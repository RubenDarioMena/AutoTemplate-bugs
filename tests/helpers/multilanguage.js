"use strict";

const {
  MULTILANGUAGE_TOOL_PATH,
  createRuntime,
  readToolHtml
} = require("./monolith");

const MULTILANGUAGE_EXPOSED_NAMES = [
  "APP_META", "CONFIG_KEY", "SESSION_KEY", "LEGACY_CONFIG_KEY", "LEGACY_SESSION_KEY",
  "UI_PREFS_KEY", "SUPPORTED_LANGUAGES", "SUPPORTED_THEMES", "UI_MESSAGES", "appearance",
  "t", "tp", "validateMessageCatalogs", "translateStaticDom", "persistAppearance",
  "setLanguage", "setTheme", "isHeaderCollapsed", "setHeaderCollapsed", "configuredText"
];

function createMultilanguageRuntime(options = {}) {
  return createRuntime({
    ...options,
    toolPath: options.toolPath || MULTILANGUAGE_TOOL_PATH,
    executePrelude: options.executePrelude ?? true,
    exposedNames: MULTILANGUAGE_EXPOSED_NAMES.concat(options.exposedNames || [])
  });
}

function readMultilanguageHtml() {
  return readToolHtml(MULTILANGUAGE_TOOL_PATH);
}

module.exports = {
  MULTILANGUAGE_EXPOSED_NAMES,
  MULTILANGUAGE_TOOL_PATH,
  createMultilanguageRuntime,
  readMultilanguageHtml
};
