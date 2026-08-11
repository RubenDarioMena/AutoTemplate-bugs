"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const test = require("node:test");
const { pathToFileURL } = require("node:url");

const { TOOL_PATH } = require("./helpers/monolith");

const BROWSERS = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  process.env.CHROME_BIN
].filter(Boolean);

function availableBrowser() {
  return BROWSERS.find(candidate => fs.existsSync(candidate));
}

function waitForWsUrl(child, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    let output = "";
    const timer = setTimeout(() => reject(new Error(`Chrome no publicó DevTools:\n${output}`)), timeoutMs);
    const onData = chunk => {
      output += chunk.toString();
      const match = output.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) {
        clearTimeout(timer);
        child.stderr.off("data", onData);
        resolve(match[1]);
      }
    };
    child.stderr.on("data", onData);
    child.once("exit", code => {
      clearTimeout(timer);
      reject(new Error(`Chrome terminó antes de iniciar (código ${code}):\n${output}`));
    });
  });
}

class Cdp {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
  }

  async open() {
    await new Promise((resolve, reject) => {
      this.ws.addEventListener("open", resolve, { once: true });
      this.ws.addEventListener("error", reject, { once: true });
    });
    this.ws.addEventListener("message", event => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result);
        return;
      }
      const key = `${message.sessionId || "browser"}:${message.method}`;
      for (const listener of this.listeners.get(key) || []) listener(message.params);
    });
  }

  send(method, params = {}, sessionId) {
    const id = this.nextId++;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    this.ws.send(JSON.stringify(payload));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }

  once(method, sessionId, timeoutMs = 10000) {
    const key = `${sessionId || "browser"}:${method}`;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Timeout esperando ${method}`)), timeoutMs);
      const listener = params => {
        clearTimeout(timer);
        this.listeners.set(key, (this.listeners.get(key) || []).filter(item => item !== listener));
        resolve(params);
      };
      this.listeners.set(key, [...(this.listeners.get(key) || []), listener]);
    });
  }
}

async function evaluate(cdp, sessionId, expression) {
  const result = await cdp.send("Runtime.evaluate", {
    expression, awaitPromise: true, returnByValue: true
  }, sessionId);
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  }
  return result.result.value;
}

test("Chrome arranca el monolito, actualiza output y restaura la sesión", { timeout: 30000 }, async t => {
  const browser = availableBrowser();
  if (!browser) return t.skip("Chrome/Edge no está disponible en este entorno");
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "bug-tool-browser-test-"));
  const child = spawn(browser, [
    "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
    "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank"
  ], { stdio: ["ignore", "ignore", "pipe"] });

  let cdp;
  try {
    cdp = new Cdp(await waitForWsUrl(child));
    await cdp.open();
    const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
    await cdp.send("Page.enable", {}, sessionId);
    await cdp.send("Runtime.enable", {}, sessionId);
    const exceptions = [];
    cdp.listeners.set(`${sessionId}:Runtime.exceptionThrown`, [params => exceptions.push(params.exceptionDetails)]);

    const loaded = cdp.once("Page.loadEventFired", sessionId);
    await cdp.send("Page.navigate", { url: pathToFileURL(TOOL_PATH).href }, sessionId);
    await loaded;
    const initial = await evaluate(cdp, sessionId, `(() => ({
      forms: document.querySelectorAll("#formTabs [data-form]").length,
      activeFields: document.querySelectorAll("#formPanel [data-field]").length,
      activeInstances: document.querySelectorAll("#subTabs .sub-tab").length,
      damaged: !document.getElementById("formTabs")
    }))()`);
    assert.equal(initial.damaged, false);
    assert.ok(initial.forms >= 2);
    assert.ok(initial.activeFields >= 1);
    assert.equal(initial.activeInstances, 1);

    const changed = await evaluate(cdp, sessionId, `(() => {
      const input = document.querySelector('[data-bind="team"]');
      input.value = "QA Persistente";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("blur", { bubbles: true }));
      return {
        output: document.getElementById("outputTextarea").value,
        saved: document.getElementById("saveIndicatorText").textContent
      };
    })()`);
    assert.match(changed.output, /QA Persistente/);
    assert.equal(changed.saved, "Guardado");

    const partialOutput = await evaluate(cdp, sessionId, `(() => {
      const output = document.getElementById("outputTextarea");
      output.value = output.value.replace("QA Persistente", "QA Manual");
      output.dispatchEvent(new Event("input", { bubbles: true }));
      const region = document.querySelector('[data-bind="region"]');
      region.value = "EU";
      region.dispatchEvent(new Event("input", { bubbles: true }));
      region.dispatchEvent(new Event("blur", { bubbles: true }));
      return {
        output: document.getElementById("outputTextarea").value,
        badge: document.getElementById("outputDisconnectBadge").textContent,
        visible: document.getElementById("outputDisconnectBadge").classList.contains("visible")
      };
    })()`);
    assert.match(partialOutput.output, /QA Manual/);
    assert.match(partialOutput.output, /EU/);
    assert.match(partialOutput.badge, /Desconectado: 1 campo/);
    assert.equal(partialOutput.visible, true);

    const reloaded = cdp.once("Page.loadEventFired", sessionId);
    await cdp.send("Page.reload", {}, sessionId);
    await reloaded;
    assert.equal(await evaluate(cdp, sessionId,
      `document.querySelector('[data-bind="team"]').value`), "QA Persistente");
    const persistedPartial = await evaluate(cdp, sessionId, `(() => ({
      output: document.getElementById("outputTextarea").value,
      badge: document.getElementById("outputDisconnectBadge").textContent
    }))()`);
    assert.match(persistedPartial.output, /QA Manual/);
    assert.match(persistedPartial.output, /EU/);
    assert.match(persistedPartial.badge, /Desconectado: 1 campo/);

    const regenerated = await evaluate(cdp, sessionId, `(() => {
      const button = [...document.querySelectorAll("#outputActions button")]
        .find(item => item.textContent === "Regenerar");
      button.click();
      return {
        output: document.getElementById("outputTextarea").value,
        badgeVisible: document.getElementById("outputDisconnectBadge").classList.contains("visible")
      };
    })()`);
    assert.match(regenerated.output, /QA Persistente/);
    assert.match(regenerated.output, /EU/);
    assert.equal(regenerated.badgeVisible, false);

    const preview = await evaluate(cdp, sessionId, `(() => {
      const output = document.getElementById("outputTextarea");
      output.value = "* *Perfil:* QA\\n# Paso uno\\n## Paso dos\\n#* Viñeta anidada\\n*+Combinado+* El_ejemplo_cursiva _correcta_ [Example|http://Example.com] [^Adjunto] [~Usuario]\\n{code:java}\\nconst value = 1;\\n{code}";
      output.dispatchEvent(new Event("input", { bubbles: true }));
      document.querySelector('input[aria-label="Vista previa Jira"]').click();
      const jira = document.querySelector('input[aria-label="Vista previa Jira"]');
      const markdown = document.querySelector('input[aria-label="Vista previa Markdown"]');
      const preview = document.getElementById("outputPreview");
      const jiraState = {
        previewing: preview.closest(".output-textarea-wrap").classList.contains("previewing"),
        jira: jira.checked,
        markdown: markdown.checked,
        list: preview.querySelectorAll("ul > li").length,
        ordered: preview.querySelectorAll("ol > li").length,
        nestedOrdered: preview.querySelectorAll("ol ol").length,
        mixedNested: preview.querySelectorAll("ol ul").length,
        combined: preview.querySelector("strong u")?.textContent,
        italics: [...preview.querySelectorAll("em")].map(item => item.textContent),
        jiraLinks: [...preview.querySelectorAll(".jira-preview-link")].map(item => ({
          text: item.textContent,
          tag: item.tagName,
          href: item.getAttribute("href")
        })),
        code: preview.querySelector("pre code")?.textContent,
        language: preview.querySelector("pre code")?.dataset.language,
        notebookClosed: output.closest(".output-textarea-wrap").classList.contains("notebook-closed"),
        bottomSpace: getComputedStyle(output).marginBottom,
        source: output.value
      };
      markdown.click();
      return {
        jiraState,
        markdown: document.querySelector('input[aria-label="Vista previa Markdown"]').checked,
        jiraAfter: document.querySelector('input[aria-label="Vista previa Jira"]').checked
      };
    })()`);
    assert.equal(preview.jiraState.previewing, true);
    assert.equal(preview.jiraState.jira, true);
    assert.equal(preview.jiraState.markdown, false);
    assert.equal(preview.jiraState.list, 2);
    assert.equal(preview.jiraState.ordered, 2);
    assert.equal(preview.jiraState.nestedOrdered, 1);
    assert.equal(preview.jiraState.mixedNested, 1);
    assert.equal(preview.jiraState.combined, "Combinado");
    assert.deepEqual(preview.jiraState.italics, ["correcta"]);
    assert.deepEqual(preview.jiraState.jiraLinks, [
      { text: "Example", tag: "SPAN", href: null },
      { text: "Adjunto", tag: "SPAN", href: null },
      { text: "Usuario", tag: "SPAN", href: null }
    ]);
    assert.equal(preview.jiraState.code, "const value = 1;");
    assert.equal(preview.jiraState.language, "java");
    assert.equal(preview.jiraState.notebookClosed, true);
    assert.equal(preview.jiraState.bottomSpace, "30px");
    assert.match(preview.jiraState.source, /El_ejemplo_cursiva/);
    assert.equal(preview.markdown, true);
    assert.equal(preview.jiraAfter, false);

    const keywords = await evaluate(cdp, sessionId, `(() => {
      const found = getField(getForm("bug"), "keywords");
      found.field.source = "chipSuggestions";
      config.data.lists.chipSuggestions = ["nuevo_valor_ejemplo_1", "muchos_nuevos_valores_ejemplo_2"];
      renderForm();
      const input = document.querySelector('[data-kw-input="keywords"]');
      input.focus();
      input.value = "nue";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      const suggestions = [...document.querySelectorAll('[data-kw-option]')];
      const filtered = suggestions.map(item => ({
        text: item.firstElementChild.textContent,
        children: item.children.length,
        marked: item.querySelector("mark")?.textContent,
        canDelete: !!item.querySelector("[data-kw-del]")
      }));
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      return {
        filtered,
        input: document.querySelector('[data-kw-input="keywords"]').value,
        chips: [...document.querySelectorAll('[data-kw-chip-text]')].map(item => item.textContent)
      };
    })()`);
    assert.deepEqual(keywords.filtered, [
      { text: "nuevo_valor_ejemplo_1", children: 2, marked: "nue", canDelete: true },
      { text: "muchos_nuevos_valores_ejemplo_2", children: 2, marked: "nue", canDelete: true }
    ]);
    assert.equal(keywords.input, "");
    assert.deepEqual(keywords.chips, ["nue"]);

    const keywordDataActions = await evaluate(cdp, sessionId, `(() => {
      let input = document.querySelector('[data-kw-input="keywords"]');
      input.value = "opcion_nueva";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      const addVisible = !!document.querySelector('[data-kw-add="opcion_nueva"]');
      document.querySelector('[data-kw-add="opcion_nueva"]')
        .dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      const addedToData = config.data.lists.chipSuggestions.includes("opcion_nueva");
      const addedAsChip = [...document.querySelectorAll('[data-kw-chip-text]')]
        .some(item => item.textContent === "opcion_nueva");
      input = document.querySelector('[data-kw-input="keywords"]');
      input.focus();
      const del = document.querySelector('[data-kw-del="opcion_nueva"]');
      del.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      const confirmVisible = document.getElementById("modal").classList.contains("open");
      document.querySelector("#modalActions button.danger").click();
      return {
        addVisible,
        addedToData,
        addedAsChip,
        input: document.querySelector('[data-kw-input="keywords"]').value,
        confirmVisible,
        deletedFromData: !config.data.lists.chipSuggestions.includes("opcion_nueva"),
        chipPreserved: [...document.querySelectorAll('[data-kw-chip-text]')]
          .some(item => item.textContent === "opcion_nueva")
      };
    })()`);
    assert.deepEqual(keywordDataActions, {
      addVisible: true,
      addedToData: true,
      addedAsChip: true,
      input: "",
      confirmVisible: true,
      deletedFromData: true,
      chipPreserved: true
    });

    const switched = await evaluate(cdp, sessionId, `(() => {
      document.querySelector('[data-form="regression"]').click();
      return {
        active: document.querySelector('#formTabs [data-form].active').dataset.form,
        fields: document.querySelectorAll('#formPanel [data-field]').length
      };
    })()`);
    assert.equal(switched.active, "regression");
    assert.ok(switched.fields >= 1);
    assert.deepEqual(exceptions, []);
    await cdp.send("Browser.close");
  } finally {
    if (cdp && cdp.ws.readyState === WebSocket.OPEN) cdp.ws.close();
    if (!child.killed) child.kill("SIGTERM");
    fs.rmSync(profile, { recursive: true, force: true });
  }
});
