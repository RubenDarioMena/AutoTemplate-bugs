"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const {
  ROOT,
  extractScripts,
  extractVanillaConfig
} = require("./helpers/monolith");
const {
  MULTILANGUAGE_TOOL_PATH,
  createMultilanguageRuntime,
  readMultilanguageHtml
} = require("./helpers/multilanguage");

function monolithMarkers(html) {
  return [...html.matchAll(/MONOLITH:SECTION ([A-Za-z0-9-]+) (START|END)/g)]
    .map(match => ({ name: match[1], kind: match[2], index: match.index }));
}

function documentedSections(markdown) {
  return [...markdown.matchAll(/^\| `([^`]+)` \|/gm)].map(match => match[1]);
}

test("la variante multilenguaje conserva marcadores únicos y valida su directorio cuando exista", t => {
  const html = readMultilanguageHtml();
  const markers = monolithMarkers(html);
  const byName = new Map();
  for (const marker of markers) byName.set(marker.name, [...(byName.get(marker.name) || []), marker]);

  assert.ok(byName.has("localization-appearance"), "la localización requiere una sección delimitada");
  assert.ok(byName.has("preferences-bootstrap"), "las preferencias tempranas requieren una sección delimitada");
  for (const [name, pair] of byName) {
    assert.equal(pair.length, 2, `${name} debe tener exactamente START y END`);
    assert.deepEqual(pair.map(item => item.kind), ["START", "END"], `${name}: orden inválido`);
    assert.ok(pair[0].index < pair[1].index, `${name}: END precede a START`);
  }

  const ownDirectory = fs.readdirSync(ROOT).find(name =>
    /^Directorio.*multi.*\.md$/i.test(name));
  if (!ownDirectory) {
    t.diagnostic("Aún no existe un directorio propio para la variante; se validaron sus marcadores internos.");
    return;
  }
  const documented = documentedSections(fs.readFileSync(path.join(ROOT, ownDirectory), "utf8"));
  assert.deepEqual([...byName.keys()], documented,
    `${ownDirectory} debe reflejar exactamente el orden de marcadores de la variante`);
});

test("vanillaConfig y todos los scripts de la variante son válidos", () => {
  const html = readMultilanguageHtml();
  const config = extractVanillaConfig(html);
  assert.equal(config.version, 2);
  assert.ok(config.schema.forms.length >= 2);

  for (const [index, script] of extractScripts(html).entries()) {
    if (/\btype=["']application\/json["']/.test(script.attributes)) continue;
    assert.doesNotThrow(
      () => new vm.Script(script.source, {
        filename: `${path.basename(MULTILANGUAGE_TOOL_PATH)}#script-${index + 1}`
      }),
      `el script ejecutable ${index + 1} debe compilar`
    );
  }
});

test("la variante continúa autocontenida, sin red y sin IDs estáticos duplicados", () => {
  const html = readMultilanguageHtml();
  assert.doesNotMatch(html, /<script\b[^>]*\bsrc\s*=/i);
  assert.doesNotMatch(html, /<link\b[^>]*\brel=["']?stylesheet/i);
  assert.doesNotMatch(html, /\b(fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(/);
  assert.doesNotMatch(html, /\bimport\s*\(/);

  const staticHtml = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "");
  const ids = [...staticHtml.matchAll(/\bid=["']([^"']+)["']/g)].map(match => match[1]);
  const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  assert.deepEqual(duplicates, []);
  assert.match(staticHtml, /id=["']languageSelect["']/);
  assert.match(staticHtml, /id=["']themeSelect["']/);
});

test("los catálogos es/en tienen paridad de claves, placeholders y referencias DOM", () => {
  const { api } = createMultilanguageRuntime();
  assert.deepEqual(Array.from(api.SUPPORTED_LANGUAGES), ["es", "en"]);
  assert.deepEqual(Array.from(api.SUPPORTED_THEMES), ["light", "dark"]);
  assert.doesNotThrow(() => api.validateMessageCatalogs());

  const esKeys = Object.keys(api.UI_MESSAGES.es).sort();
  const enKeys = Object.keys(api.UI_MESSAGES.en).sort();
  assert.deepEqual(enKeys, esKeys);
  assert.ok(esKeys.length >= 150, "el catálogo debe cubrir la interfaz completa, no solo los selectores");

  const placeholders = value => [...String(value).matchAll(/\{([A-Za-z0-9_]+)\}/g)]
    .map(match => match[1]).sort();
  for (const key of esKeys) {
    assert.notEqual(String(api.UI_MESSAGES.es[key]).trim(), "", `es.${key} está vacío`);
    assert.notEqual(String(api.UI_MESSAGES.en[key]).trim(), "", `en.${key} está vacío`);
    assert.deepEqual(placeholders(api.UI_MESSAGES.en[key]), placeholders(api.UI_MESSAGES.es[key]),
      `${key}: placeholders distintos entre idiomas`);
    if (key.endsWith(".one")) {
      assert.ok(esKeys.includes(key.replace(/\.one$/, ".other")), `${key}: falta plural .other`);
    }
  }

  const staticKeys = [...readMultilanguageHtml().matchAll(
    /\bdata-i18n(?:-title|-placeholder|-aria)?=["']([^"']+)["']/g)]
    .map(match => match[1]);
  for (const key of new Set(staticKeys)) {
    assert.ok(Object.hasOwn(api.UI_MESSAGES.es, key), `atributo DOM sin clave es: ${key}`);
    assert.ok(Object.hasOwn(api.UI_MESSAGES.en, key), `atributo DOM sin clave en: ${key}`);
  }

  const source = readMultilanguageHtml();
  const directKeys = [...source.matchAll(/\bt\(\s*["']([^"']+)["']/g)].map(match => match[1]);
  for (const key of new Set(directKeys)) {
    assert.ok(Object.hasOwn(api.UI_MESSAGES.es, key), `llamada t() sin clave es: ${key}`);
    assert.ok(Object.hasOwn(api.UI_MESSAGES.en, key), `llamada t() sin clave en: ${key}`);
  }
  const pluralBases = [...source.matchAll(/\btp\(\s*["']([^"']+)["']/g)].map(match => match[1]);
  for (const base of new Set(pluralBases)) {
    assert.ok(Object.hasOwn(api.UI_MESSAGES.es, `${base}.other`), `llamada tp() sin plural es: ${base}`);
    assert.ok(Object.hasOwn(api.UI_MESSAGES.en, `${base}.other`), `llamada tp() sin plural en: ${base}`);
  }
});

test("metadatos y claves persistentes de la variante están aislados de la versión original", () => {
  const { api } = createMultilanguageRuntime();
  assert.equal(api.APP_META.id, "bug-tool-multilanguage");
  assert.equal(api.APP_META.exportName, "bug_tool_multilanguage.html");
  assert.match(api.CONFIG_KEY, /multilanguage/);
  assert.match(api.SESSION_KEY, /multilanguage/);
  assert.match(api.UI_PREFS_KEY, /multilanguage/);
  assert.notEqual(api.CONFIG_KEY, api.LEGACY_CONFIG_KEY);
  assert.notEqual(api.SESSION_KEY, api.LEGACY_SESSION_KEY);
});
