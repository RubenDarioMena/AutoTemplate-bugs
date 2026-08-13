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

test("las condiciones pueden leer el tipo de una fila de media sin convertirlo en campo", () => {
  const { api } = createRuntime();
  const form = api.getForm("bug");
  const inst = api.makeInstance("bug");
  inst.media = [{ id: "media1", type: "Vid" }];
  assert.equal(api.isMediaTypeConditionRef("media:media1:type"), true);
  assert.equal(api.exprError('media:media1:type = "Vid"', form), "");
  assert.equal(api.ruleWhenTrue({ whenExpr: 'media:media1:type = "VID"' }, inst), true);
  assert.equal(api.ruleWhenTrue({ whenExpr: 'media:media1:type = "Pic"' }, inst), false);
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

test("el output conserva solo el fragmento de plantilla editado manualmente", () => {
  const { api } = createRuntime();
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
  inst.values.second = "tres";
  chunks = api.buildOutput(inst);
  const rendered = api.applyOutputDetachment(chunks, inst.outputDetached);
  assert.equal(rendered.full, "A manual\nB tres");
});

test("reconectar un campo restaura solo su fragmento y conserva los demás desconectados", () => {
  const { api } = createRuntime({ exposedNames: ["outputDetachedFieldIds", "reconnectOutputField"] });
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

test("la copia parcial respeta campos desconectados y el formato no desconecta campos", () => {
  const { api } = createRuntime();
  api.setConfig({
    version: 2,
    data: { lists: { mediaTypes: ["Vid"] }, childLists: {}, listMeta: {}, rules: { media_fmt: "{type}" } },
    schema: { forms: [{ id: "bug", label: "Bug", sections: [
      { id: "summary", label: "Summary", mode: "joined", sep: " - ", fields: [
        { id: "team", label: "Team", type: "text", template: "Team {value}" },
        { id: "region", label: "Region", type: "text", template: "Region {value}" }
      ] },
      { id: "details", label: "Details", mode: "lines", fields: [
        { id: "detail", label: "Detail", type: "text", template: "Detail {value}" }
      ] }
    ] }] }
  });
  const inst = api.makeInstance("bug");
  inst.values.team = "QA";
  inst.values.region = "MX";
  inst.values.detail = "Inicial";
  let chunks = api.buildOutput(inst);
  inst.output = chunks.full;
  inst.outputSegments = chunks.segments;
  inst.outputRanges = chunks.ranges;

  api.captureOutputTextareaEdit(inst, inst.output.replace("Team QA", "Team Manual"));
  assert.deepEqual(Object.keys(inst.outputDetached), ["team"]);
  inst.values.region = "EU";
  inst.values.detail = "Actualizado";
  api.state.topTab = "bug";
  api.state.instances = { bug: [inst] };
  api.state.activeInstance = { bug: inst.id };
  assert.equal(api.refreshOutputForCopy(inst, "summary"), "Team Manual - Region EU");
  assert.equal(api.refreshOutputForCopy(inst, "description"), "Detail Actualizado");
  chunks = api.buildOutput(inst);
  const rendered = api.applyOutputDetachment(chunks, inst.outputDetached);
  assert.equal(rendered.summary, "Team Manual - Region EU");
  assert.equal(rendered.description, "Detail Actualizado");

  inst.output = rendered.full;
  inst.outputSegments = rendered.segments;
  inst.outputRanges = rendered.ranges;
  api.captureOutputTextareaEdit(inst, inst.output.replace(" - ", " / "));
  assert.deepEqual(Object.keys(inst.outputDetached), ["team"]);
  assert.equal(inst.outputLayoutEdited, true);

  const blank = api.makeInstance("bug");
  blank.outputRanges = {
    full: { start: 0, end: 0 },
    summary: { start: 0, end: 0 },
    description: { start: 0, end: 0 }
  };
  api.captureOutputTextareaEdit(blank, "Texto manual sin campo");
  assert.equal(blank.outputEdited, false);
  assert.equal(blank.outputLayoutEdited, true);
});

test("la vista previa reconoce los bloques básicos de Jira y Markdown sin tocar el texto", () => {
  const { api } = createRuntime();
  assert.equal(api.normalizeOutputPreviewMode("jira"), "jira");
  assert.equal(api.normalizeOutputPreviewMode("markdown"), "markdown");
  assert.equal(api.normalizeOutputPreviewMode("html"), "plain");
  assert.deepEqual(jsonValue(api.outputPreviewLine("* *Perfil:* QA", "jira")),
    { type: "ul", markers: "*", text: "*Perfil:* QA" });
  assert.deepEqual(jsonValue(api.outputPreviewLine("# Paso uno", "jira")),
    { type: "ol", markers: "#", text: "Paso uno" });
  assert.deepEqual(jsonValue(api.outputPreviewLine("#** Detalle mixto", "jira")),
    { type: "ul", markers: "#**", text: "Detalle mixto" });
  assert.deepEqual(jsonValue(api.outputPreviewLine("## Título", "markdown")),
    { type: "heading", level: 2, text: "Título" });
  assert.deepEqual(jsonValue(api.outputPreviewLine("1. Paso uno", "markdown")),
    { type: "ol", text: "Paso uno" });
  assert.deepEqual(jsonValue(api.jiraCodeFence("{code:java}")), { language: "java" });
  assert.deepEqual(jsonValue(api.jiraCodeFence(" {code} ")), { language: "" });
  assert.equal(api.jiraCodeFence("{code: java}"), null);
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
