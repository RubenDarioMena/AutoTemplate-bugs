"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const {
  ROOT, createRuntime, extractScripts, extractVanillaConfig, readToolHtml
} = require("./helpers/monolith");

test("los marcadores del monolito son únicos, están ordenados y coinciden con el directorio", () => {
  const html = readToolHtml();
  const markers = [...html.matchAll(/MONOLITH:SECTION ([A-Za-z0-9-]+) (START|END)/g)]
    .map(match => ({ name: match[1], kind: match[2], index: match.index }));
  const byName = new Map();
  for (const marker of markers) byName.set(marker.name, [...(byName.get(marker.name) || []), marker]);
  for (const [name, pair] of byName) {
    assert.equal(pair.length, 2, `${name} debe tener exactamente dos límites`);
    assert.deepEqual(pair.map(x => x.kind), ["START", "END"], `${name}: START debe preceder a END`);
    assert.ok(pair[0].index < pair[1].index, `${name}: límites fuera de orden`);
  }
  const directory = fs.readFileSync(path.join(ROOT, "Directorio-Monolito.MD"), "utf8");
  const documented = [...directory.matchAll(/^\| `([^`]+)` \|/gm)].map(x => x[1]);
  assert.deepEqual([...byName.keys()], documented);
});

test("vanillaConfig es JSON válido y los scripts ejecutables tienen sintaxis válida", () => {
  const html = readToolHtml();
  const config = extractVanillaConfig(html);
  assert.equal(config.version, 2);
  assert.ok(config.schema.forms.length >= 2);
  for (const [index, script] of extractScripts(html).entries()) {
    if (/\btype=["']application\/json["']/.test(script.attributes)) continue;
    assert.doesNotThrow(
      () => new vm.Script(script.source, { filename: `bug_tool.html#script-${index + 1}` }),
      `el script ejecutable ${index + 1} debe compilar`
    );
  }
});

test("el HTML sigue autocontenido y sin APIs de red", () => {
  const html = readToolHtml();
  assert.doesNotMatch(html, /<script\b[^>]*\bsrc\s*=/i);
  assert.doesNotMatch(html, /<link\b[^>]*\brel=["']?stylesheet/i);
  assert.doesNotMatch(html, /\b(fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(/);
  assert.doesNotMatch(html, /\bimport\s*\(/);
});

test("los IDs estáticos del documento no se repiten", () => {
  const html = readToolHtml()
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "");
  const ids = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map(x => x[1]);
  const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  assert.deepEqual(duplicates, []);
});

test("el schema embebido conserva IDs, tipos y referencias válidas", () => {
  const { api } = createRuntime();
  const config = api.getConfig();
  const knownTypes = new Set(api.FIELD_TYPES.map(x => x.id));
  const formIds = new Set();

  for (const form of config.schema.forms) {
    assert.ok(form.id && form.label, "todo formulario requiere id y label");
    assert.ok(!formIds.has(form.id), `formulario repetido: ${form.id}`);
    formIds.add(form.id);
    const sectionIds = new Set();
    const fieldIds = new Set();
    for (const section of form.sections) {
      assert.ok(section.id && section.label, `${form.id}: sección sin id o label`);
      assert.ok(!sectionIds.has(section.id), `${form.id}: sección repetida ${section.id}`);
      sectionIds.add(section.id);
      assert.ok(["joined", "lines"].includes(section.mode || "lines"));
      for (const field of section.fields) {
        assert.ok(field.id && field.label, `${form.id}/${section.id}: campo sin id o label`);
        assert.ok(!fieldIds.has(field.id), `${form.id}: campo repetido ${field.id}`);
        fieldIds.add(field.id);
        assert.ok(knownTypes.has(field.type), `${form.id}/${field.id}: tipo desconocido ${field.type}`);
        if (field.regex) {
          const raw = field.regex.startsWith("@") ? config.data.rules[field.regex.slice(1)] : field.regex;
          assert.notEqual(raw, undefined, `${form.id}/${field.id}: regla inexistente ${field.regex}`);
          assert.doesNotThrow(() => new RegExp(raw), `${form.id}/${field.id}: regex inválida`);
        }
        if (field.default && field.default.startsWith("@")) {
          assert.notEqual(config.data.rules[field.default.slice(1)], undefined,
            `${form.id}/${field.id}: default inexistente ${field.default}`);
        }
        if (field.type === "mirror") {
          const source = api.getField(form, field.source);
          assert.ok(source, `${form.id}/${field.id}: mirror sin origen ${field.source}`);
          assert.notEqual(source.field.type, "mirror", `${form.id}/${field.id}: mirror encadenado`);
        }
        assert.deepEqual(
          Array.from(api.templateReferenceErrors(field.template || "", form, field.type === "mirror" ? "" : field.id)),
          [], `${form.id}/${field.id}: plantilla con referencias rotas`
        );
      }
    }
    for (const rule of form.rules || []) {
      assert.equal(api.exprError(rule.whenExpr || "", form), "", `${form.id}: condición inválida`);
      assert.ok(fieldIds.has(rule.then.field), `${form.id}: destino inexistente ${rule.then.field}`);
    }
    for (const tile of form.tiles || []) {
      if (tile.whenExpr) assert.equal(api.exprError(tile.whenExpr, form), "", `${form.id}: tile inválido`);
      if (tile.field) assert.ok(fieldIds.has(tile.field), `${form.id}: tile apunta a ${tile.field}`);
    }
  }
  assert.ok(config.data.lists.mediaTypes?.length, "mediaTypes debe contener opciones");
  assert.ok(config.data.rules.media_fmt, "media_fmt debe existir");
});

test("las fuentes de listas del schema apuntan al árbol de DATA", () => {
  const { api } = createRuntime();
  const config = api.getConfig();
  for (const form of config.schema.forms) {
    for (const { field } of api.allFields(form)) {
      if (!field.source || field.type === "mirror") continue;
      const child = /^child:([^:]+):(.+)$/.exec(field.source);
      if (child) {
        assert.ok(config.data.childLists[child[1]], `${form.id}/${field.id}: lista hija inexistente`);
        assert.ok(api.getField(form, child[2]), `${form.id}/${field.id}: padre inexistente ${child[2]}`);
      } else if (["autocomplete", "checklist"].includes(field.type)) {
        assert.ok(config.data.lists[field.source], `${form.id}/${field.id}: lista inexistente ${field.source}`);
      }
    }
  }
});
