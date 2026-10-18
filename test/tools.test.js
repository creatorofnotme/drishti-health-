'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { ROOT } = require('./helpers/load-app');

test('tools/build_data.js regenerates the shipped data byte-for-byte (deterministic, and in sync with js/store.js)', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'drishti-'));
  try {
    for (const d of ['data', 'js', 'tools']) fs.cpSync(path.join(ROOT, d), path.join(tmp, d), { recursive: true });
    execFileSync(process.execPath, ['tools/build_data.js'], { cwd: tmp, stdio: 'pipe' });
    for (const f of ['data/sample_facilities.js', 'data/hospitals.js']) {
      assert.equal(fs.readFileSync(path.join(tmp, f), 'utf8'), fs.readFileSync(path.join(ROOT, f), 'utf8'), `${f} differs after regeneration`);
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
