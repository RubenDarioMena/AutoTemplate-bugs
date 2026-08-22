"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
  createRuntime,
  extractVanillaConfig,
  jsonValue
} = require("./helpers/monolith");
const { createMultilanguageRuntime } = require("./helpers/multilanguage");

function deterministicConfig() {
  return {
    version: 2,
    data: {
      lists: { mediaTypes: ["Vid"] },
      childLists: {},
      listMeta: {},
      rules: { media_fmt: "{type}_{key}_{platform}_{cl}" }
    },
    schema: {
      forms: [{
        id: "bug",
        label: "Bug",
        sections: [{
          id: "summary",
          label: "Resumen",
          mode: "joined",
          sep: " - ",
          fields: [
            { id: "team", label: "Team", type: "text", template: "Team {value}" },
            { id: "platform", label: "Plataforma", type: "text" },
            { id: "cl", label: "CL", type: "text", template: "CL {value}" }
          ]
        }, {
          id: "details",
          label: "Descripción",
          mode: "lines",
          heading: "+Detalles canónicos:+",
          fields: [
            { id: "description", label: "Descripción", type: "text", template: "* Resultado: {value}" },
            { id: "attachment", label: "Adjunto", type: "mirror", template: "* Media: {media:media1}" }
          ]
        }]
      }]
    }
  };
}

function buildDeterministicOutput(api) {
  api.setConfig(jsonValue(deterministicConfig()));
  const inst = api.makeInstance("bug");
  inst.values.team = "QA";
  inst.values.platform = "PS5";
  inst.values.cl = "42";
  inst.values.description = "Falla reproducible";
  inst.ticketKey = "BUG-7";
  return { inst, output: api.buildOutput(inst) };
}

test("t/tp cambia presentación y conserva placeholders y pluralización", () => {
  const { api, sandbox } = createMultilanguageRuntime();
  assert.equal(api.t("common.save"), "Guardar");
  assert.equal(api.tp("form.replaceCount", 1), "1 campo actualizado.");
  assert.equal(api.tp("form.replaceCount", 3), "3 campos actualizados.");

  api.setLanguage("en", false, false);
  assert.equal(api.t("common.save"), "Save");
  assert.equal(api.t("form.exportTo", { form: "Regression" }), "Export to Regression");
  assert.equal(api.tp("form.replaceCount", 1), "1 field updated.");
  assert.equal(api.tp("form.replaceCount", 3), "3 fields updated.");
  assert.equal(api.configuredText("Descripción"), "Description");
  assert.equal(sandbox.document.documentElement.lang, "en");
  assert.match(sandbox.document.title, /Multilanguage/);

  api.setLanguage("idioma-inexistente", false, false);
  assert.equal(api.appearance.language, "es");
  assert.equal(api.t("common.save"), "Guardar");
});

test("idioma, tema y cabecera persisten juntos, se restauran y aceptan el tema legacy", () => {
  const storage = new Map();
  const first = createMultilanguageRuntime({ storage, executePrelude: true });
  first.api.setLanguage("en", true, false);
  first.api.setTheme("dark", true);
  first.api.setHeaderCollapsed(true, true);

  assert.deepEqual(JSON.parse(storage.get(first.api.UI_PREFS_KEY)), {
    language: "en",
    theme: "dark",
    headerCollapsed: true
  });
  assert.equal(first.sandbox.document.documentElement.lang, "en");
  assert.equal(first.sandbox.document.documentElement.dataset.theme, "dark");
  assert.equal(first.sandbox.document.documentElement.classList.contains("header-collapsed"), true);

  const reloaded = createMultilanguageRuntime({ storage, executePrelude: true });
  assert.equal(reloaded.api.appearance.language, "en");
  assert.equal(reloaded.api.appearance.theme, "dark");
  assert.equal(reloaded.api.isHeaderCollapsed(), true);
  assert.equal(reloaded.sandbox.document.documentElement.lang, "en");
  assert.equal(reloaded.sandbox.document.documentElement.dataset.theme, "dark");
  assert.equal(reloaded.sandbox.document.documentElement.classList.contains("header-collapsed"), true);
  reloaded.api.setHeaderCollapsed(false, true);
  assert.equal(reloaded.api.isHeaderCollapsed(), false);
  assert.equal(reloaded.sandbox.document.documentElement.classList.contains("header-collapsed"), false);
  assert.equal(JSON.parse(storage.get(reloaded.api.UI_PREFS_KEY)).headerCollapsed, false);

  const legacyStorage = new Map([["bugtool_theme_v1", "dark"]]);
  const migrated = createMultilanguageRuntime({ storage: legacyStorage, executePrelude: true });
  assert.equal(migrated.api.appearance.language, "es");
  assert.equal(migrated.api.appearance.theme, "dark");
  assert.equal(migrated.api.isHeaderCollapsed(), false);
});

test("los temas Autumn y Neon se aceptan, persisten y un tema inválido vuelve a light", () => {
  const storage = new Map();
  const first = createMultilanguageRuntime({ storage, executePrelude: true });
  first.api.setTheme("autumn", true);
  assert.equal(first.api.appearance.theme, "autumn");
  assert.equal(first.sandbox.document.documentElement.dataset.theme, "autumn");

  const autumnReload = createMultilanguageRuntime({ storage, executePrelude: true });
  assert.equal(autumnReload.api.appearance.theme, "autumn");
  autumnReload.api.setTheme("neon", true);
  assert.equal(autumnReload.api.appearance.theme, "neon");

  storage.set(autumnReload.api.UI_PREFS_KEY, JSON.stringify({ language: "es", theme: "tema-invalido" }));
  const fallback = createMultilanguageRuntime({ storage, executePrelude: true });
  assert.equal(fallback.api.appearance.theme, "light");
});

test("cambiar idioma o tema no muta config, valores ni output canónico", () => {
  const original = createRuntime();
  const multilingual = createMultilanguageRuntime();
  const originalResult = buildDeterministicOutput(original.api);
  const multilingualResult = buildDeterministicOutput(multilingual.api);

  assert.equal(multilingualResult.output.full, originalResult.output.full);
  assert.equal(multilingualResult.output.full,
    "Team QA - PS5 - CL 42\n\n+Detalles canónicos:+\n* Resultado: Falla reproducible\n* Media: Vid_BUG-7_PS5_42");

  const configBefore = JSON.stringify(multilingual.api.getConfig());
  const valuesBefore = JSON.stringify(multilingualResult.inst.values);
  multilingual.api.setLanguage("en", true, false);
  multilingual.api.setTheme("dark", true);
  const after = multilingual.api.buildOutput(multilingualResult.inst);

  assert.equal(after.full, multilingualResult.output.full);
  assert.equal(JSON.stringify(multilingual.api.getConfig()), configBefore);
  assert.equal(JSON.stringify(multilingualResult.inst.values), valuesBefore);
  assert.equal(multilingual.api.configuredText("Descripción"), "Description");
});

test("SEGMENTS conserva ownership de separadores, referencias y rangos de sección", () => {
  const { api } = createMultilanguageRuntime({
    exposedNames: ["outputTargetAtOffset"]
  });
  api.setConfig({
    version: 2,
    data: { lists: { mediaTypes: ["Vid"] }, childLists: {}, listMeta: {}, rules: { media_fmt: "{type}" } },
    schema: { forms: [{ id: "bug", label: "Bug", sections: [
      { id: "summary", label: "Summary", mode: "joined", sep: " - ", fields: [
        { id: "mode", label: "Mode", type: "text" },
        { id: "notes", label: "Notes", type: "text", template: "Used {mode}: {value}" },
        { id: "mirror", label: "Mirror", type: "mirror", source: "mode", template: "Mirror {value}" }
      ] },
      { id: "details", label: "Details", mode: "lines", heading: "DETAILS", fields: [
        { id: "detail", label: "Detail", type: "text" },
        { id: "suffix", label: "Suffix", type: "text", joinPrev: true, sep: " :: " }
      ] }
    ] }] }
  });
  const inst = api.makeInstance("bug");
  inst.values.mode = "MP";
  inst.values.notes = "ok";
  inst.values.detail = "body";
  inst.values.suffix = "tail";
  const chunks = api.buildOutput(inst);
  const notes = chunks.segments.find(segment => segment.fieldId === "notes");
  const mirror = chunks.segments.find(segment => segment.fieldId === "mirror");
  const suffix = chunks.segments.find(segment => segment.fieldId === "suffix");

  assert.equal(chunks.full.slice(notes.start, notes.end), " - Used MP: ok");
  assert.equal(chunks.full.slice(notes.contentStart, notes.contentEnd), "Used MP: ok");
  assert.equal(chunks.full.slice(notes.refs[0].start, notes.refs[0].end), "MP");
  assert.equal(chunks.full.slice(mirror.refs[0].start, mirror.refs[0].end), "MP");
  assert.equal(chunks.full.slice(suffix.start, suffix.end), " :: tail");
  assert.equal(chunks.full.slice(suffix.contentStart, suffix.contentEnd), "tail");
  assert.equal(api.outputTargetAtOffset(notes.start + 1, chunks).fieldId, "notes");
  assert.deepEqual(jsonValue(api.outputTargetAtOffset(notes.refs[0].start, chunks)), {
    kind: "field", fieldId: "mode", sectionId: "summary", viaReference: true
  });
  assert.deepEqual(jsonValue(api.outputTargetAtOffset(chunks.full.indexOf("DETAILS"), chunks)), {
    kind: "section", sectionId: "details"
  });
  assert.equal(chunks.full.slice(chunks.sectionRanges.summary.start, chunks.sectionRanges.summary.end),
    "MP - Used MP: ok - Mirror MP\n\n");
  assert.equal(chunks.full.slice(chunks.sectionRanges.details.start, chunks.sectionRanges.details.end),
    "DETAILS\nbody :: tail");

  const rendered = api.applyOutputDetachment(chunks, {
    notes: { parts: { 0: " - Manual" } }
  });
  const detachedNotes = rendered.segments.find(segment => segment.fieldId === "notes");
  assert.equal(rendered.full, "MP - Manual - Mirror MP\n\nDETAILS\nbody :: tail");
  assert.deepEqual(jsonValue(detachedNotes.refs), []);
  assert.equal(rendered.sectionRanges.details.start, rendered.full.indexOf("DETAILS"));

  inst.values.mode = "";
  const withoutMirrors = api.buildOutput(inst);
  assert.equal(withoutMirrors.full, "Used : ok\n\nDETAILS\nbody :: tail");
  assert.doesNotMatch(withoutMirrors.full, / -\s*(?:-|\n|$)/);
});

test("la variante reconecta un campo sin restaurar los demás fragmentos manuales", () => {
  const { api } = createMultilanguageRuntime({
    exposedNames: ["outputDetachedFieldIds", "reconnectOutputField"]
  });
  api.setConfig({
    version: 2,
    data: { lists: { mediaTypes: ["Vid"] }, childLists: {}, listMeta: {}, rules: { media_fmt: "{type}" } },
    schema: { forms: [{ id: "bug", label: "Bug", sections: [{ id: "s", label: "S", mode: "lines", fields: [
      { id: "first", label: "First", type: "text", template: "A {value}" },
      { id: "second", label: "Second", type: "text", template: "B {value}" }
    ] }] }] }
  });
  const inst = api.makeInstance("bug");
  inst.values.first = "uno";
  inst.values.second = "dos";
  let chunks = api.buildOutput(inst);
  inst.output = chunks.full;
  inst.outputSegments = chunks.segments;
  inst.outputRanges = chunks.ranges;
  api.captureOutputTextareaEdit(inst, "A manual\nB dos");
  api.captureOutputTextareaEdit(inst, "A manual\nB manual");
  assert.deepEqual(jsonValue(api.outputDetachedFieldIds(inst, inst.outputSegments)), ["first", "second"]);

  assert.equal(api.reconnectOutputField(inst, "first"), true);
  assert.equal(api.reconnectOutputField(inst, "first"), false);
  inst.values.first = "actualizado";
  inst.values.second = "ignorado";
  chunks = api.buildOutput(inst);
  const rendered = api.applyOutputDetachment(chunks, inst.outputDetached);
  assert.equal(rendered.full, "A actualizado\nB manual");
  assert.deepEqual(jsonValue(api.outputDetachedFieldIds(inst, rendered.segments)), ["second"]);
});

test("la variante conserva una inserción manual al final del segmento de un field", () => {
  const { api } = createMultilanguageRuntime({ exposedNames: ["outputDetachedFieldIds"] });
  api.setConfig({
    version: 2,
    data: { lists: { mediaTypes: ["Vid"] }, childLists: {}, listMeta: {}, rules: { media_fmt: "{type}" } },
    schema: { forms: [{ id: "bug", label: "Bug", sections: [{ id: "s", label: "S", mode: "lines", fields: [
      { id: "first", label: "First", type: "text", template: "A {value}" },
      { id: "second", label: "Second", type: "text", template: "B {value}" }
    ] }] }] }
  });
  const inst = api.makeInstance("bug");
  inst.values.first = "uno";
  inst.values.second = "dos";
  let chunks = api.buildOutput(inst);
  inst.output = chunks.full;
  inst.outputSegments = chunks.segments;
  inst.outputRanges = chunks.ranges;

  api.captureOutputTextareaEdit(inst, "A uno manual\nB dos");
  assert.deepEqual(jsonValue(api.outputDetachedFieldIds(inst, inst.outputSegments)), ["first"]);

  inst.values.second = "tres";
  chunks = api.buildOutput(inst);
  assert.equal(api.applyOutputDetachment(chunks, inst.outputDetached).full, "A uno manual\nB tres");
});

test("placeholder viaja en el CSV de campos sin alterar el schema canónico", async () => {
  const source = createMultilanguageRuntime();
  const field = source.api.getConfig().schema.forms[0].sections[0].fields[0];
  field.placeholder = "Escribe el equipo";
  const exported = await source.api.captureFieldsCsv();
  assert.match(exported.content.split(/\r?\n/, 1)[0], /placeholder$/);

  const imported = createMultilanguageRuntime();
  imported.api.importFieldsCsv(exported.content);
  assert.equal(imported.api.getConfig().schema.forms[0].sections[0].fields[0].placeholder,
    "Escribe el equipo");
});

test("la variante recuerda la última subpestaña de cada formulario", () => {
  const { api } = createMultilanguageRuntime({ exposedNames: ["setActiveInstance", "switchToForm"] });
  const bugFirst = api.makeInstance("bug");
  const bugLast = api.makeInstance("bug");
  const regressionFirst = api.makeInstance("regression");
  const regressionLast = api.makeInstance("regression");
  api.state.instances = [bugFirst, bugLast, regressionFirst, regressionLast];
  api.state.topTab = "bug";
  api.setActiveInstance(bugLast.id);

  api.switchToForm("regression");
  api.setActiveInstance(regressionLast.id);
  api.switchToForm("bug");

  assert.equal(api.state.activeInstanceId, bugLast.id);
  assert.deepEqual(jsonValue(api.state.activeInstanceByForm), {
    bug: bugLast.id,
    regression: regressionLast.id
  });
});

test("exportar la variante usa su nombre canónico e integra JSON resistente a cierre de script", async () => {
  const { api } = createMultilanguageRuntime();
  const dangerous = "</SCRIPT><script>fallo()</script>";
  api.getConfig().data.rules.danger = dangerous;

  const exported = await api.captureToolHtml();
  assert.equal(exported.name, api.APP_META.exportName);
  const embedded = extractVanillaConfig(exported.content);
  assert.equal(embedded.data.rules.danger, dangerous);
});

test("shortcuts navegan y compactan sin interceptar flechas dentro de controles editables", () => {
  const { api, sandbox } = createMultilanguageRuntime({ exposedNames: [
    "setActiveInstance", "wireKeyboardShortcuts", "uiCollapse"
  ] });
  const classList = () => {
    const values = new Set();
    return {
      add: (...names) => names.forEach(name => values.add(name)),
      remove: (...names) => names.forEach(name => values.delete(name)),
      toggle: (name, force) => {
        const value = force === undefined ? !values.has(name) : !!force;
        if (value) values.add(name); else values.delete(name);
        return value;
      },
      contains: name => values.has(name)
    };
  };
  const element = () => ({
    classList: classList(), style: { removeProperty() {} }, setAttribute() {},
    querySelector: () => null, innerHTML: "", title: ""
  });
  const elements = Object.fromEntries([
    "formCollapseBtn", "formCol", "mediaCollapseBtn", "mediaPanel",
    "actionsCollapseBtn", "outputSide", "outputPanelCollapseBtn",
    "outputPanel", "main", "formOutputResizer", "modal"
  ].map(id => [id, element()]));
  let listener;
  sandbox.window.innerWidth = 1200;
  sandbox.document.getElementById = id => elements[id] || null;
  sandbox.document.addEventListener = (type, callback) => { if (type === "keydown") listener = callback; };

  const bugFirst = api.makeInstance("bug");
  const bugLast = api.makeInstance("bug");
  const regression = api.makeInstance("regression");
  api.state.instances = [bugFirst, bugLast, regression];
  api.state.topTab = "bug";
  api.setActiveInstance(bugFirst.id);
  sandbox.document.querySelectorAll = selector => selector.includes("#topTabs") ? [
    { dataset: { form: "bug" } }, { dataset: { form: "regression" } },
    { dataset: { tab: "data" } }, { dataset: { tab: "rules" } }
  ] : [];
  api.wireKeyboardShortcuts();

  const press = (key, options = {}) => {
    let prevented = false;
    listener({
      key, target: { closest: () => null, isContentEditable: false },
      preventDefault() { prevented = true; }, ...options
    });
    return prevented;
  };
  const twice = key => { press(key); press(key); };

  assert.equal(press("PageDown", { ctrlKey: true, altKey: true }), true);
  assert.equal(api.state.topTab, "regression");
  press("PageUp", { ctrlKey: true, altKey: true });
  assert.equal(api.state.topTab, "bug");
  press("ArrowRight", { ctrlKey: true, altKey: true });
  assert.equal(api.state.activeInstanceId, bugLast.id);
  press("q", { altKey: true });
  assert.equal(elements.formCol.classList.contains("form-collapsed"), false);
  assert.ok(Object.values(api.uiCollapse.sections).every(Boolean));
  twice("ArrowLeft");
  assert.equal(elements.formCol.classList.contains("form-collapsed"), true);
  twice("ArrowLeft");
  assert.equal(elements.formCol.classList.contains("form-collapsed"), false);
  twice("ArrowDown");
  assert.equal(elements.mediaPanel.classList.contains("collapsed"), true);
  twice("ArrowDown");
  twice("ArrowRight");
  assert.equal(elements.outputSide.classList.contains("actions-collapsed"), true);
  twice("ArrowRight");
  assert.equal(elements.outputPanel.classList.contains("output-collapsed"), true);
  twice("ArrowDown");
  assert.equal(elements.mediaPanel.classList.contains("collapsed"), false);
  twice("ArrowRight");
  assert.equal(elements.outputPanel.classList.contains("output-collapsed"), false);
  assert.equal(elements.outputSide.classList.contains("actions-collapsed"), false);
  twice("ArrowUp");
  assert.equal(sandbox.document.body.classList.contains("header-collapsed"), true);

  let prevented = false;
  listener({
    key: "ArrowLeft", target: { closest: () => ({}), isContentEditable: false },
    preventDefault() { prevented = true; }
  });
  assert.equal(prevented, false);
});
