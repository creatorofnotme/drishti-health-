'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { ROOT, scriptList } = require('./helpers/load-app');

const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const html = read('index.html');
const css = read('css/styles.css');

test('document basics: doctype, language, charset, responsive viewport (zoom not disabled), title, description', () => {
  assert.match(html, /^<!DOCTYPE html>/i);
  assert.match(html, /<html lang="[a-z-]+"/);
  assert.match(html, /<meta charset="utf-8">/i);
  const vp = html.match(/<meta name="viewport" content="([^"]+)"/)[1];
  assert.match(vp, /width=device-width/);
  assert.doesNotMatch(vp, /user-scalable=(no|0)|maximum-scale/);
  assert.match(html, /<title>[^<]{5,}<\/title>/);
  assert.match(html, /<meta name="description" content="[^"]{40,}"/);
});

test('landmarks: skip link first, one main, labelled navigations, search input labelled', () => {
  assert.match(html, /<body>\s*<a class="skip-link" href="#main">/);
  assert.equal((html.match(/<main\b/g) || []).length, 1);
  assert.match(html, /<main[^>]*id="main"/);
  for (const m of html.matchAll(/<nav\b[^>]*>/g)) assert.match(m[0], /aria-label=/);
  assert.match(html, /<input id="q"[^>]*aria-label="[^"]+"/);
  assert.match(html, /<select id="lang"[^>]*aria-label=/);
  assert.match(html, /<dialog id="watchD" aria-labelledby="watchT">/);
});

test('live regions exist for toasts and result counts', () => {
  assert.match(html, /id="toast" role="status" aria-live="polite"/);
  assert.match(html, /id="sr" class="sr-only" role="status" aria-live="polite"/);
});

test('SECURITY: Content-Security-Policy forbids inline and third-party scripts, objects and form posts', () => {
  const csp = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/);
  assert.ok(csp, 'CSP meta tag present');
  const d = Object.fromEntries(csp[1].split(';').map((s) => s.trim().split(/\s+/)).filter((a) => a[0]).map(([k, ...v]) => [k, v]));
  assert.deepEqual(d['script-src'], ["'self'"]);
  assert.deepEqual(d['object-src'], ["'none'"]);
  assert.deepEqual(d['base-uri'], ["'self'"]);
  assert.deepEqual(d['form-action'], ["'none'"]);
  assert.deepEqual(d['connect-src'], ["'none'"]);
  assert.ok(!csp[1].includes("'unsafe-eval'"));
  assert.ok(!d['script-src'].includes("'unsafe-inline'"));
  assert.ok(d['style-src'].every((v) => ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'].includes(v)));
  assert.match(html, /<meta name="referrer" content="no-referrer">/);
});

test('SECURITY: no inline scripts, no inline event-handler attributes, no javascript: URLs, no eval in the shipped code', () => {
  assert.equal((html.match(/<script(?![^>]*\ssrc=)[^>]*>/g) || []).length, 0, 'inline <script>');
  assert.doesNotMatch(html, /\son[a-z]+\s*=\s*"/i);
  assert.doesNotMatch(html, /javascript:/i);
  for (const f of scriptList()) {
    const src = read(f);
    assert.doesNotMatch(src, /\beval\s*\(|new Function\s*\(|document\.write\s*\(/, f);
    assert.doesNotMatch(src, /\son(error|click|load)=\\?"/, `${f} builds an inline handler`);
  }
});

test('SECURITY: the only third-party hosts are Google Fonts (CSS + font files); nothing else is fetched', () => {
  const hosts = new Set([...(html + css).matchAll(/https?:\/\/([a-z0-9.-]+)/gi)].map((m) => m[1]));
  hosts.delete('www.w3.org');
  assert.deepEqual([...hosts].sort(), ['fonts.googleapis.com', 'fonts.gstatic.com']);
  for (const f of scriptList()) assert.doesNotMatch(read(f), /\bfetch\(|XMLHttpRequest|WebSocket|sendBeacon/, f);
});

test('PERFORMANCE: every script exists, is deferred and loads in dependency order', () => {
  const tags = [...html.matchAll(/<script\b[^>]*>/g)].map((m) => m[0]);
  assert.ok(tags.length >= 10);
  for (const t of tags) assert.match(t, /\sdefer>/);
  const list = scriptList();
  for (const f of list) assert.ok(fs.existsSync(path.join(ROOT, f)), `${f} missing`);
  const idx = (f) => list.indexOf(f);
  assert.ok(idx('data/meta.js') < idx('js/utils.js') && idx('js/utils.js') < idx('js/store.js') && idx('js/store.js') < idx('js/views.js') && idx('js/views.js') < idx('js/app.js'));
});

test('PERFORMANCE: fonts use display=swap and preconnect; payload budget holds', () => {
  assert.match(html, /fonts\.googleapis\.com\/css2\?[^"]*display=swap/);
  assert.match(html, /rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin/);
  const bytes = [...scriptList(), 'css/styles.css', 'index.html'].reduce((a, f) => a + fs.statSync(path.join(ROOT, f)).size, 0);
  assert.ok(bytes < 700 * 1024, `code + data is ${(bytes / 1024).toFixed(0)} KB (budget 700 KB)`);
  assert.ok(fs.statSync(path.join(ROOT, 'assets/map.webp')).size < 300 * 1024, 'map image budget');
});

test('A11Y (CSS): visible focus, reduced-motion, forced-colors and screen-reader-only helpers exist', () => {
  assert.match(css, /:focus-visible\{outline:/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /forced-colors:\s*active/);
  assert.match(css, /\.sr-only\{position:absolute/);
  assert.match(css, /\.skip-link:focus\{/);
  assert.match(css, /prefers-color-scheme:\s*dark/);
});

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

test('A11Y (CSS): body and muted text meet WCAG AA (4.5:1) on every light and dark surface', () => {
  const v = (name, block) => new RegExp(`--${name}:(#[0-9a-f]{6})`, 'i').exec(block)[1];
  const light = css.match(/:root\{([^}]+)\}/)[1];
  const dark = css.match(/prefers-color-scheme:dark\)\{:root:not\(\[data-theme="light"\]\)\{([^}]+)\}/)[1];
  for (const [mode, block] of [['light', light], ['dark', dark]]) {
    const surfaces = ['bg', 'bg2', 'bg3'].map((n) => v(n, block));
    for (const fg of ['fg', 'mute']) for (const bg of surfaces) {
      const c = contrast(v(fg, block), bg);
      assert.ok(c >= 4.5, `${mode}: --${fg} on ${bg} is ${c.toFixed(2)}:1`);
    }
  }
});
