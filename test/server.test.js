'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const server = require('../scripts/serve');

function get(p, method = 'GET') {
  return new Promise((resolve, reject) => {
    const { port } = server.address();
    const req = require('node:http').request({ port, path: p, method }, (res) => {
      const chunks = []; res.on('data', (c) => chunks.push(c)); res.on('end', () => resolve({ res, body: Buffer.concat(chunks) }));
    });
    req.on('error', reject); req.end();
  });
}

test('dev server: serves the app with security headers, blocks traversal and non-public files', async (t) => {
  await new Promise((r) => server.listen(0, r));
  t.after(() => server.close());
  const home = await get('/');
  assert.equal(home.res.statusCode, 200);
  assert.match(home.res.headers['content-type'], /text\/html/);
  assert.equal(home.res.headers['x-content-type-options'], 'nosniff');
  assert.equal(home.res.headers['x-frame-options'], 'DENY');
  assert.match(home.body.toString(), /DRISHTI/);
  assert.equal((await get('/js/app.js')).res.headers['content-type'], 'text/javascript; charset=utf-8');
  assert.equal((await get('/assets/map.webp')).res.headers['content-type'], 'image/webp');
  assert.equal((await get('/package.json')).res.statusCode, 404, 'project files are not public');
  assert.equal((await get('/test/helpers/load-app.js')).res.statusCode, 404);
  assert.equal((await get('/..%2f..%2fetc%2fpasswd')).res.statusCode, 404);
  assert.equal((await get('/css/%E0%A4%A')).res.statusCode, 400);
  assert.equal((await get('/', 'POST')).res.statusCode, 405);
});

test('dev server: a NUL byte in the path is rejected and does not crash the process', async (t) => {
  if (!server.listening) await new Promise((r) => server.listen(0, r));
  t.after(() => server.close());
  for (const p of ['/css/%00', '/js/%00.js', '/index.html%00', '/%00']) {
    assert.equal((await get(p)).res.statusCode, 400, p);
  }
  assert.equal((await get('/')).res.statusCode, 200, 'still serving afterwards');
});
