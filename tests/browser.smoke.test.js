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

    const reloaded = cdp.once("Page.loadEventFired", sessionId);
    await cdp.send("Page.reload", {}, sessionId);
    await reloaded;
    assert.equal(await evaluate(cdp, sessionId,
      `document.querySelector('[data-bind="team"]').value`), "QA Persistente");

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
