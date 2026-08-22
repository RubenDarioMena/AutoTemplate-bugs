"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
const TOOL_PATH = path.join(ROOT, "bug_tool.html");
const MULTILANGUAGE_TOOL_PATH = path.join(ROOT, "bug_tool_multilanguage.html");

function readToolHtml(toolPath = TOOL_PATH) {
  return fs.readFileSync(toolPath, "utf8");
}

function extractScripts(html) {
  const scripts = [];
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = re.exec(html))) {
    scripts.push({ attributes: match[1], source: match[2], index: match.index });
  }
  return scripts;
}

function extractVanillaConfig(html) {
  const script = extractScripts(html).find(({ attributes }) =>
    /\bid=["']vanillaConfig["']/.test(attributes));
  if (!script) throw new Error("No se encontró #vanillaConfig");
  return JSON.parse(script.source);
}

function extractMainScript(html) {
  const script = extractScripts(html).find(({ source }) =>
    source.includes('"use strict";') && source.includes("MONOLITH:SECTION 18-boot"));
  if (!script) throw new Error("No se encontró el script principal");
  return script.source;
}

function jsonValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function createRuntime(options = {}) {
  const toolPath = options.toolPath || TOOL_PATH;
  const html = options.html || readToolHtml(toolPath);
  let main = extractMainScript(html);
  const bootPattern = /\nboot\(\);\s*(?=\/\* MONOLITH:SECTION 18-boot END \*\/)/;
  if (!bootPattern.test(main)) throw new Error("No se pudo aislar boot() para las pruebas");
  main = main.replace(bootPattern, "\n");

  const exposedNames = [
    "FIELD_TYPES", "FIELDS_CSV_HEADER", "parseCsvLine", "csvEscape", "csvTruthy",
    "escapeHtml", "slugify", "deepClone", "normalizeSystemFormat",
    "formatSystemFieldValue", "migrateListsToTree", "migrateRulesToExpr",
    "normalizeFieldSources", "getForms", "getForm", "getField", "allFields",
    "makeInstance", "ensureInstanceFields", "ensureSessionConsistency",
    "nextMediaId", "normalizeMediaRows", "parseExpr", "exprError", "exprFieldRefs",
    "ruleWhenTrue", "evalFieldRules", "revalidate", "isMediaTypeConditionRef",
    "templatePlaceholders",
    "templateFieldRefs", "templateMediaRefs", "templateReferenceErrors",
    "interpolateFieldTemplate", "fieldOutputPart", "buildOutput", "buildMediaName",
    "applyOutputDetachment", "captureOutputTextareaEdit", "refreshOutputForCopy",
    "normalizeOutputPreviewMode", "outputPreviewLine", "jiraCodeFence",
    "exportSharedFieldValues", "importDataCsv", "importFieldsCsv", "ensureTiles"
  ].concat(options.exposedNames || []);

  main += `
let __testDownload = null;
let __testModal = null;
downloadFile = async (name, content) => {
  __testDownload = { name, content };
  return true;
};
showConfirmModal = (opts) => {
  __testModal = { title: opts.title, body: opts.body, confirmText: opts.confirmText };
  if (${options.autoConfirm === false ? "false" : "true"} && typeof opts.onConfirm === "function") {
    opts.onConfirm(false);
  }
};
refreshAll = () => {};
refreshSubTabs = () => {};
scheduleSave = () => {};
flashBanner = () => {};
updateConfigChip = () => {};
globalThis.__bugToolTestApi = {
  ${exposedNames.join(",\n  ")},
  state,
  setConfig(value) { config = value; },
  getConfig() { return config; },
  setVanilla(value) { vanilla = value; },
  getVanilla() { return vanilla; },
  resetState() {
    state.topTab = "";
    state.editMode = false;
    state.instances = [];
    state.activeInstanceId = null;
    state.activeInstanceByForm = {};
    state.dataTab = { selectedCategory: "" };
    state.prefs = { dontAskOnClose: false, dragFields: false, formSplitRatio: null, outputPreviewMode: "plain" };
  },
  getLastModal() { return __testModal; },
  async captureDataCsv() { __testDownload = null; await exportDataCsv(); return __testDownload; },
  async captureFieldsCsv() { __testDownload = null; await exportFieldsCsv(); return __testDownload; },
  async captureToolHtml() { __testDownload = null; await exportToolHtml(); return __testDownload; }
};`;

  const storage = options.storage || new Map();
  const noop = () => {};
  function classList() {
    const values = new Set();
    return {
      add: (...names) => names.forEach(name => values.add(String(name))),
      remove: (...names) => names.forEach(name => values.delete(String(name))),
      toggle(name, force) {
        const shouldHave = force === undefined ? !values.has(name) : Boolean(force);
        if (shouldHave) values.add(name); else values.delete(name);
        return shouldHave;
      },
      contains: name => values.has(String(name))
    };
  }
  const documentElement = {
    outerHTML: html.replace(/^<!doctype html>\s*/i, ""),
    dataset: {},
    lang: "",
    classList: classList(),
    setAttribute(name, value) {
      if (name === "data-theme") this.dataset.theme = String(value);
      else this[name] = String(value);
    },
    getAttribute(name) {
      if (name === "data-theme") return this.dataset.theme;
      return this[name] ?? null;
    }
  };
  const document = {
    documentElement,
    title: "",
    getElementById: () => null,
    querySelectorAll: () => [],
    addEventListener: noop,
    createElement: () => ({}),
    body: { classList: classList() }
  };
  const window = { addEventListener: noop };
  window.window = window;
  const sandbox = {
    document, window,
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: key => storage.delete(key)
    },
    navigator: { clipboard: { writeText: async () => {} } },
    console, Blob, URL, Intl, Date, Math, JSON, Set, Map, RegExp,
    setTimeout, clearTimeout
  };
  vm.createContext(sandbox);
  if (options.executePrelude) {
    const mainScript = extractScripts(html).find(({ source }) =>
      source.includes('"use strict";') && source.includes("MONOLITH:SECTION 18-boot"));
    for (const [index, script] of extractScripts(html).entries()) {
      if (!mainScript || script.index >= mainScript.index) break;
      if (/\btype=["']application\/json["']/.test(script.attributes)) continue;
      new vm.Script(script.source, { filename: `${toolPath}#prelude-${index + 1}` })
        .runInContext(sandbox);
    }
  }
  new vm.Script(main, { filename: toolPath }).runInContext(sandbox);
  const api = sandbox.__bugToolTestApi;

  const vanilla = extractVanillaConfig(html);
  api.setVanilla(jsonValue(vanilla));
  api.setConfig(jsonValue(vanilla));
  api.migrateListsToTree(api.getVanilla());
  api.migrateRulesToExpr(api.getVanilla());
  api.ensureTiles(api.getVanilla());
  api.migrateListsToTree(api.getConfig());
  api.migrateRulesToExpr(api.getConfig());
  api.ensureTiles(api.getConfig());

  return { api, sandbox, storage, html };
}

module.exports = {
  ROOT, TOOL_PATH, MULTILANGUAGE_TOOL_PATH, createRuntime, extractMainScript, extractScripts,
  extractVanillaConfig, jsonValue, readToolHtml
};
