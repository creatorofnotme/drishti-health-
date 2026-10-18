'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { logic, call } = require('./helpers/sandbox');
const { ROOT } = require('./helpers/load-app');

const app = logic();
const rows = (expr) => call(app, `()=>DB.rows.${expr}`);

test('every facility has a unique id and a valid type', () => {
  const ids = rows('map(f=>f.id)');
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(rows('every(f=>f.t==="PHC"||f.t==="CHC")'));
});

test('every facility belongs to a listed state and one of its districts', () => {
  assert.equal(rows('filter(f=>!SM[f.st]).length'), 0);
  assert.equal(rows('filter(f=>!SM[f.st].d.includes(f.d)).length'), 0);
});

test('shape: 5 medicines x 7 days, 7 footfall days, 6 tests, 10 equipment slots', () => {
  assert.ok(rows('every(f=>f.med.length===MED.length&&f.med.every(m=>m.h.length===7&&m.q>=0))'));
  assert.ok(rows('every(f=>f.fo.length===7&&f.fo.every(v=>v>=0))'));
  assert.ok(rows('every(f=>f.tests.length===TESTS.length)'));
  assert.ok(rows('every(f=>f.eq.length===EQ.length&&f.eq.every(v=>v===0||v===1||v===2))'));
});

test('ranges: occupancy never exceeds beds, attendance is 0-100, doctor roster matches headcount', () => {
  assert.ok(rows('every(f=>f.beds>0&&f.occ>=0&&f.occ<=f.beds)'));
  assert.ok(rows('every(f=>f.att>=0&&f.att<=100)'));
  assert.ok(rows('every(f=>f.docs.length===f.doc&&f.docs.every(d=>d[1] in DUTY&&d[2]>=0&&d[2]<=100))'));
});

test('every facility has coordinates and a map position inside the map image', () => {
  assert.ok(rows('every(f=>typeof f.lat==="number"&&typeof f.lng==="number")'));
  assert.ok(rows('every(f=>{const p=MAP_XY[f.id];return p&&p[0]>=0&&p[0]<=MAP_W&&p[1]>=0&&p[1]<=MAP_H})'));
});

test('all 36 states and UTs are present and every state lists districts', () => {
  assert.equal(call(app, '()=>ST.length'), 36);
  assert.ok(call(app, '()=>ST.every(s=>s.d.length>0&&s.r in REG)'));
});

test('i18n: every translation row has exactly one value per label key', () => {
  const r = call(app, '()=>({keys:KEYS.length,rows:TR.map(([l,s])=>[l,s.split("|").length])})');
  for (const [lang, n] of r.rows) assert.equal(n, r.keys, `${lang} has ${n} values, expected ${r.keys}`);
});

test('i18n: English exists, every translated language is a listed language, t() falls back to English', () => {
  assert.ok(call(app, '()=>"en" in DICT'));
  assert.ok(call(app, '()=>TR.every(([l])=>LANGS.some(x=>x[0]===l))'));
  assert.equal(call(app, '()=>{S.lang="mai";return t("dash")===DICT.en.dash}'), true);
  call(app, '()=>{S.lang="en"}');
});

test('photos: every listed image exists, every image file is listed, placeholder exists, size budget holds', () => {
  const listed = call(app, '()=>IMAGES');
  const dir = path.join(ROOT, 'assets', 'hospitals');
  const files = fs.readdirSync(dir).filter((f) => f !== 'placeholder.svg');
  assert.deepEqual([...listed].sort(), files.sort());
  assert.ok(fs.existsSync(path.join(dir, 'placeholder.svg')));
  for (const f of files) {
    const kb = fs.statSync(path.join(dir, f)).size / 1024;
    assert.ok(kb <= 160, `${f} is ${kb.toFixed(0)} KB (budget 160 KB)`);
  }
});

test('both facility types have photos to draw from', () => {
  assert.ok(call(app, '()=>POOL.CHC.length>0&&POOL.PHC.length>0'));
});
