'use strict';
/**
 * Tiny static file server for local use (no dependencies): `npm start` then open http://localhost:8080
 * Sends the security headers a real deployment should also send (meta CSP cannot set frame-ancestors).
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT) || 8080;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
};
const HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "frame-ancestors 'none'",
  'Permissions-Policy': 'geolocation=(), camera=(), microphone=()',
};

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, { Allow: 'GET, HEAD' }).end(); return; }
  let rel;
  try { rel = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { res.writeHead(400).end(); return; }
  if (rel.includes('\0')) { res.writeHead(400, HEADERS).end('Bad request'); return; } /* fs throws synchronously on NUL bytes, which would crash the process */
  const file = path.resolve(ROOT, '.' + (rel.endsWith('/') ? rel + 'index.html' : rel));
  const allowed = ['index.html', 'css', 'js', 'data', 'assets'].some((p) => file === path.join(ROOT, p) || file.startsWith(path.join(ROOT, p) + path.sep));
  if (!file.startsWith(ROOT + path.sep) || !allowed) { res.writeHead(404, HEADERS).end('Not found'); return; }
  const send404 = () => res.writeHead(404, HEADERS).end('Not found');
  const onRead = (err, buf) => {
    if (err) { send404(); return; }
    const ext = path.extname(file).toLowerCase();
    const cache = ext === '.html' ? 'no-cache' : 'public, max-age=3600';
    res.writeHead(200, { ...HEADERS, 'Content-Type': TYPES[ext] || 'application/octet-stream', 'Cache-Control': cache });
    res.end(req.method === 'HEAD' ? undefined : buf);
  };
  try { fs.readFile(file, onRead); } catch { send404(); }
});

if (require.main === module) server.listen(PORT, () => console.log(`DRISHTI running at http://localhost:${PORT}`));
module.exports = server;
