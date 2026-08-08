"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const { ROOT, createRuntime, extractVanillaConfig, jsonValue } = require("./helpers/monolith");

test("utilidades de texto, CSV y formatos de sistema cubren casos con escape", () => {
  const { api } = createRuntime();
  assert.equal(api.slugify("Posición de vista"), "posicionDeVista");
  assert.equal(api.escapeHtml('<a title="x">&'), "&lt;a title=&quot;x&quot;&gt;&amp;");
  assert.deepEqual(Array.from(api.parseCsvLine('uno," dos, tres ","a""b"')),
    ["uno", " dos, tres ", 'a"b']);
  assert.equal(api.csvEscape(' a,"b" '), '" a,""b"" "');
  const date = new Date(2026, 7, 5, 13, 7, 0);
  assert.equal(api.formatSystemFieldValue({ type: "clock", format: "24h" }, date), "13:07");
  assert.equal(api.formatSystemFieldValue({ type: "clock", format: "12h-am-pm" }, date), "1:07 PM");
  assert.equal(api.formatSystemFieldValue({ type: "date", format: "dmy-4" }, date), "05/08/2026");
  assert.equal(api.normalizeSystemFormat("clock", "24h-am-pm-dots"), "12h-am-pm-dots");
});

test("la migración legacy de DATA es idempotente y reescribe sources", () => {
  const { api } = createRuntime();
  const legacy = {
    data: {
      maps: ["Mapa A"], pois: { "Mapa A": ["POI A"] },
      lists: {}, rules: {}, linkedLists: {}, listMeta: {}, childLists: {}
    },
    schema: { forms: [{ id: "bug", sections: [{ id: "s", fields: [
      { id: "map", type: "autocomplete", source: "maps" },
      { id: "poi", type: "autocomplete", source: "pois:map" }
    ] }] }] }
  };
  api.migrateListsToTree(legacy);
  const once = JSON.stringify(legacy);
  api.migrateListsToTree(legacy);
  assert.equal(JSON.stringify(legacy), once);
  assert.deepEqual(jsonValue(legacy.data.lists.map), ["Mapa A"]);
  assert.equal(legacy.data.childLists.poi.parent, "map");
  assert.equal(legacy.schema.forms[0].sections[0].fields[0].source, "map");
  assert.equal(legacy.schema.forms[0].sections[0].fields[1].source, "child:poi:map");
  assert.equal("maps" in legacy.data, false);
  assert.equal("pois" in legacy.data, false);
});

test("el motor booleano respeta precedencia, listas, referencias y campos ausentes", () => {
  const { api } = createRuntime();
  const form = api.getForm("bug");
  const inst = api.makeInstance("bug");
  inst.values.map = "Shurima Rift";
  inst.values.mode = "MP";
  inst.values.region = "NA";
  api.getConfig().data.rules.esContexto = 'map notEmpty AND mode in ("MP", "BR")';
  assert.equal(api.ruleWhenTrue({ whenExpr: '@esContexto AND NOT region = "EU"' }, inst), true);
  assert.equal(api.ruleWhenTrue({ whenExpr: 'region = "EU" OR mode = "MP" AND map empty' }, inst), false);
  assert.equal(api.ruleWhenTrue({ whenExpr: 'mode not in ("Campaign", empty)' }, inst), true);
  assert.equal(api.ruleWhenTrue({ whenExpr: 'campoQueNoExiste empty' }, inst), false);
  assert.equal(api.exprError('map = "Shurima Rift" AND (mode = "MP"', form).length > 0, true);
});

test("instancias se sanea contra el schema y media conserva IDs estables", () => {
  const { api } = createRuntime();
  api.resetState();
  api.state.topTab = "bug";
  api.state.instances = [{
    id: "legacy", formId: "bug", title: "Legacy", values: { team: "QA", keywords: "mal" },
    media: ["Vid", { id: "media3", type: "Pic" }, { id: "media3", type: "DxDiag" }]
  }, { id: "orphan", formId: "deleted-form", values: {} }];
  api.state.activeInstanceId = "orphan";
  api.ensureSessionConsistency();
  assert.equal(api.state.instances.length, 1);
  const inst = api.state.instances[0];
  assert.ok(Array.isArray(inst.values.keywords));
  assert.ok(Object.hasOwn(inst.values, "region"));
  assert.deepEqual(jsonValue(inst.media.map(x => x.id)), ["media1", "media3", "media2"]);
  assert.equal(api.nextMediaId(inst.media), "media4");
  assert.equal(api.state.activeInstanceId, "legacy");
});

test("exportar campos compartidos copia solo valores compatibles y no destructivos", () => {
  const { api } = createRuntime();
  const source = api.makeInstance("bug");
  const target = api.makeInstance("regression");
  source.values.platform = "PS5";
  source.values.client = "";
  source.values.cl = "12345";
  source.values.description = "Descripción de origen";
  source.values.keywords = ["uno"];
  target.values.client = "Cliente existente";
  target.output = "edición manual";
  target.outputEdited = true;
  target.media = [{ id: "media1", type: "Pic" }];
  const result = api.exportSharedFieldValues(source, target);
  assert.ok(result.copied >= 3);
  assert.equal(target.values.platform, "PS5");
  assert.equal(target.values.cl, "12345");
  assert.equal(target.values.description, "Descripción de origen");
  assert.equal(target.values.client, "Cliente existente");
  assert.equal(target.output, "edición manual");
  assert.deepEqual(jsonValue(target.media), [{ id: "media1", type: "Pic" }]);
});

test("plantillas compuestas, llaves literales y media producen output estable", () => {
  const { api } = createRuntime();
  api.setConfig({
    version: 2,
    data: {
      lists: { mediaTypes: ["Vid"] }, childLists: {}, listMeta: {},
      rules: { media_fmt: "{type}_{key}_{platform}_{cl}" }
    },
    schema: { forms: [{
      id: "bug", label: "Bug", sections: [
        { id: "summary", label: "Summary", mode: "joined", sep: " - ", fields: [
          { id: "platform", label: "Platform", type: "text" },
          { id: "cl", label: "CL", type: "text", template: "CL {value}" }
        ] },
        { id: "details", label: "Details", mode: "lines", fields: [
          { id: "description", label: "Description", type: "text", template: "{{raw}} {value} [{cl}]" },
          { id: "attachment", label: "Attachment", type: "mirror", template: "Media: {media:media1}" }
        ] }
      ]
    }] }
  });
  const inst = api.makeInstance("bug");
  inst.values.platform = "PS5";
  inst.values.cl = "42";
  inst.values.description = "Falla";
  inst.ticketKey = "BUG-7";
  const output = api.buildOutput(inst);
  assert.equal(output.summary, "PS5 - CL 42");
  assert.equal(output.description, "{raw} Falla [42]\nMedia: Vid_BUG-7_PS5_42");
  assert.equal(output.full, "PS5 - CL 42\n\n{raw} Falla [42]\nMedia: Vid_BUG-7_PS5_42");
});

test("los CSV canónicos se importan y los datos embebidos hacen round-trip", async () => {
  const { api } = createRuntime();
  const canonicalData = fs.readFileSync(path.join(ROOT, "bug_data.csv"), "utf8");
  const canonicalFields = fs.readFileSync(path.join(ROOT, "bug_fields.csv"), "utf8");
  assert.doesNotThrow(() => api.importDataCsv(canonicalData));
  assert.doesNotThrow(() => api.importFieldsCsv(canonicalFields));
  assert.ok(api.getConfig().schema.forms.length >= 2);
  assert.ok(Object.keys(api.getConfig().data.lists).length >= 2);

  const fresh = createRuntime();
  const exportedData = await fresh.api.captureDataCsv();
  const exportedFields = await fresh.api.captureFieldsCsv();
  assert.equal(exportedData.name, "bug_data.csv");
  assert.equal(exportedFields.name, "bug_fields.csv");
  const imported = createRuntime();
  imported.api.importDataCsv(exportedData.content);
  imported.api.importFieldsCsv(exportedFields.content);
  const original = fresh.api.getConfig();
  const roundTrip = imported.api.getConfig();
  const normalizeSchemaDefaults = value => {
    const copy = jsonValue(value);
    for (const form of copy) for (const section of form.sections) for (const field of section.fields) {
      if (field.rows === 3) delete field.rows;
    }
    for (const form of copy) for (const rule of form.rules || []) {
      if (rule.editorCondition === false) delete rule.editorCondition;
    }
    return copy;
  };
  assert.deepEqual(jsonValue(roundTrip.data), jsonValue(original.data));
  assert.deepEqual(normalizeSchemaDefaults(roundTrip.schema.forms),
    normalizeSchemaDefaults(original.schema.forms));
});

test("exportar la herramienta integra config segura sin romper el script JSON", async () => {
  const { api } = createRuntime();
  api.getConfig().data.rules.danger = "</script><script>fallo()</script>";
  const exported = await api.captureToolHtml();
  assert.equal(exported.name, "bug_tool.html");
  const parsed = extractVanillaConfig(exported.content);
  assert.equal(parsed.data.rules.danger, "</script><script>fallo()</script>");
  assert.match(exported.content, /<\\\/script>/);
});
