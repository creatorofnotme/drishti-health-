'use strict';
/**
 * Loads the browser scripts of DRISHTI into a Node `vm` sandbox with a tiny DOM stub,
 * in the same order as index.html, so the real production code can be unit-tested
 * without a browser, a bundler or any dependency.
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..', '..');

/** Script order is parsed from index.html so tests can never drift from production. */
function scriptList() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  return [...html.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)].map((m) => m[1]);
}

/** Minimal element double: records innerHTML/textContent and ignores everything layout related. */
class FakeEl {
  constructor(id = '') {
    this.id = id;
    this.innerHTML = '';
    this.textContent = '';
    this.value = '';
    this.dataset = {};
    this.children = [];
    this.attrs = {};
    this.open = false;
    const set = new Set();
    this.classList = {
      add: (c) => set.add(c),
      remove: (c) => set.delete(c),
      toggle: (c, on) => { (on === undefined ? !set.has(c) : on) ? set.add(c) : set.delete(c); },
      contains: (c) => set.has(c),
    };
    this.style = { setProperty() {} };
  }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  getAttribute(k) { return this.attrs[k] ?? null; }
  addEventListener() {}
  appendChild(c) { this.children.push(c); return c; }
  remove() {}
  click() {}
  closest() { return null; }
  querySelectorAll() { return []; }
  showModal() { this.open = true; }
  close() { this.open = false; }
  getBoundingClientRect() { return { left: 0, top: 0, width: 1, height: 1 }; }
}

function createSandbox({ storage = {} } = {}) {
  const els = new Map();
  const get = (id) => { if (!els.has(id)) els.set(id, new FakeEl(id)); return els.get(id); };
  const docEl = new FakeEl('html');
  const document = {
    getElementById: get,
    documentElement: docEl,
    body: new FakeEl('body'),
    createElement: () => new FakeEl(),
    querySelectorAll: () => [],
    addEventListener() {},
  };
  const sandbox = {
    document,
    console,
    setTimeout, clearTimeout,
    matchMedia: () => ({ matches: false }),
    localStorage: { getItem: (k) => storage[k] ?? null, setItem: (k, v) => { storage[k] = v; } },
    addEventListener() {},
    requestAnimationFrame: (f) => setTimeout(() => f(Date.now()), 0),
    performance: { now: () => Date.now() },
    scrollTo() {},
    innerWidth: 1280,
    Blob: class {},
    URL: { createObjectURL: () => 'blob:x', revokeObjectURL() {} },
  };
  sandbox.window = sandbox;
  sandbox.__els = els;
  return vm.createContext(sandbox);
}

/**
 * @param {{ upTo?: string, storage?: object }} [opts] stop after this script (e.g. 'js/store.js' for logic-only tests); initial localStorage content
 * @returns {{ ctx: object, run: (code: string) => any, el: (id: string) => FakeEl }}
 */
function loadApp({ upTo, storage } = {}) {
  const ctx = createSandbox({ storage });
  for (const src of scriptList()) {
    const code = fs.readFileSync(path.join(ROOT, src), 'utf8');
    vm.runInContext(code, ctx, { filename: src });
    if (upTo && src === upTo) break;
  }
  return {
    ctx,
    /** Evaluates code inside the sandbox so top-level `const`s of the app are reachable. */
    run: (code) => vm.runInContext(code, ctx),
    el: (id) => ctx.document.getElementById(id),
  };
}

module.exports = { loadApp, scriptList, ROOT, FakeEl };
