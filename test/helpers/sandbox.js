'use strict';
const { loadApp } = require('./load-app');

let cached;
/** Logic layer only (data + utils + store + views + map, nothing that touches the DOM at load time); cheap and shared by the unit tests. */
function logic() {
  if (!cached) cached = loadApp({ upTo: 'js/map.js' });
  return cached;
}

/** Evaluate `expr` in the sandbox with `args` passed as JSON, return a JSON round-tripped result (avoids cross-realm prototype mismatches). */
function call(app, expr, ...args) {
  const src = `(${expr})(...${JSON.stringify(args)})`;
  return JSON.parse(JSON.stringify(app.run(src) ?? null));
}

module.exports = { logic, call };
