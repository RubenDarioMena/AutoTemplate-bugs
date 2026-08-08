"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
const TOOL_PATH = path.join(ROOT, "bug_tool.html");

function readToolHtml() {
  return fs.readFileSync(TOOL_PATH, "utf8");
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
  const html = options.html || readToolHtml();
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
    "ruleWhenTrue", "evalFieldRules", "revalidate", "templatePlaceholders",
    "templateFieldRefs", "templateMediaRefs", "templateReferenceErrors",
    "interpolateFieldTemplate", "fieldOutputPart", "buildOutput", "buildMediaName",
    "exportSharedFieldValues", "importDataCsv", "importFieldsCsv", "ensureTiles"
  ];

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
    state.dataTab = { selectedCategory: "" };
    state.prefs = { dontAskOnClose: false, dragFields: false, formSplitRatio: null };
  },
  getLastModal() { return __testModal; },
  async captureDataCsv() { __testDownload = null; await exportDataCsv(); return __testDownload; },
  async captureFieldsCsv() { __testDownload = null; await exportFieldsCsv(); return __testDownload; },
  async captureToolHtml() { __testDownload = null; await exportToolHtml(); return __testDownload; }
};`;

  const storage = new Map();
  const noop = () => {};
  const document = {
    documentElement: { outerHTML: html.replace(/^<!doctype html>\s*/i, "") },
    getElementById: () => null,
    querySelectorAll: () => [],
    addEventListener: noop,
    createElement: () => ({}),
    body: {}
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
  new vm.Script(main, { filename: TOOL_PATH }).runInContext(sandbox);
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
  ROOT, TOOL_PATH, createRuntime, extractMainScript, extractScripts,
  extractVanillaConfig, jsonValue, readToolHtml
};
