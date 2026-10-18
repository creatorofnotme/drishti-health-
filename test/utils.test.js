'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { logic } = require('./helpers/sandbox');

const app = logic();
const run = (c) => app.run(c);

test('esc() neutralises every HTML metacharacter, including backticks', () => {
  assert.equal(run(`esc('<img src=x onerror="a()">')`), '&#60;img src=x onerror=&#34;a()&#34;&#62;');
  assert.equal(run(`esc("it's & \`x\`")`), 'it&#39;s &#38; &#96;x&#96;');
});

test('esc() is safe for null, undefined and numbers', () => {
  assert.equal(run('esc(null)'), '');
  assert.equal(run('esc(undefined)'), '');
  assert.equal(run('esc(0)'), '0');
});

test('fmt() groups digits the Indian way and shows a dash for missing values', () => {
  assert.equal(run('fmt(1234567)'), '12,34,567');
  assert.equal(run('fmt(null)'), '\u2014');
  assert.equal(run('fmt(0)'), '0');
});

test('ini() builds two-letter initials', () => {
  assert.equal(run(`ini('Bhopal District CHC')`), 'BD');
  assert.equal(run(`ini('Solo')`), 'S');
});

test('col() always returns a palette colour, deterministically', () => {
  assert.equal(run(`col('abc')`), run(`col('abc')`));
  assert.ok(run(`PAL.includes(col('anything'))`));
});

test('csvCell() quotes, escapes quotes and blocks spreadsheet formula injection', () => {
  assert.equal(run(`csvCell('plain')`), '"plain"');
  assert.equal(run(`csvCell('say "hi"')`), '"say ""hi"""');
  assert.equal(run(`csvCell('=HYPERLINK("http://evil")')`), '"\'=HYPERLINK(""http://evil"")"');
  assert.equal(run(`csvCell('@SUM(A1)')`), '"\'@SUM(A1)"');
  assert.equal(run(`csvCell('+1 555')`), '"\'+1 555"');
  assert.equal(run(`csvCell(-5)`), '"-5"', 'real negative numbers are not mangled');
  assert.equal(run(`csvCell(null)`), '""');
});

test('debounce() runs once, with the last arguments', async () => {
  const out = await run(`new Promise(res=>{const calls=[];const f=debounce(x=>calls.push(x),20);f(1);f(2);f(3);setTimeout(()=>res(calls),80)})`);
  assert.deepEqual([...out], [3]);
});

test('himg() uses the photo pool for the facility type and never an inline handler', () => {
  const html = run(`himg({id:3,t:'CHC',n:'A "quoted" <b>name</b>'})`);
  assert.match(html, /^<img class="him" src="assets\/hospitals\/[^"]+"/);
  assert.doesNotMatch(html, /onerror|onclick|javascript:/i);
  assert.doesNotMatch(html, /<b>/, 'facility name must be escaped inside alt');
  assert.match(html, /alt="[^"]*illustrative photo/);
});

test('tyTag() and catTag() expose full names to assistive tech', () => {
  assert.match(run(`tyTag({t:'PHC'})`), /aria-label="Primary Health Centre"/);
  assert.match(run(`catTag({cat:4})`), /Critical Loss/);
});

test('keepFocus() returns focus to the replacement control, or the fallback, after a re-render', () => {
  const calls = [];
  app.ctx.document.activeElement = { tagName: 'BUTTON', id: '', isConnected: true, attributes: [{ name: 'data-t', value: 'CHC' }] };
  const fresh = { focus: () => calls.push('fresh') }, close = { focus: () => calls.push('close') };
  const root = { querySelector: (s) => (s === 'button[data-t="CHC"]' ? fresh : s === '[data-close]' ? close : null) };
  const old = app.ctx.document.activeElement;
  app.ctx.keepFocus(() => { old.isConnected = false; }, root);
  assert.deepEqual(calls, ['fresh'], 'focus follows the control that replaced the old one');

  old.isConnected = true; calls.length = 0;
  fresh.disabled = true; /* e.g. the Escalate button becomes disabled once used */
  app.ctx.keepFocus(() => { old.isConnected = false; }, root, '[data-close]');
  assert.deepEqual(calls, ['close'], 'a disabled replacement falls back to the named control');

  calls.length = 0; old.isConnected = true;
  app.ctx.keepFocus(() => {}, root);
  assert.deepEqual(calls, [], 'nothing is touched when the focused control survives the re-render');
});
