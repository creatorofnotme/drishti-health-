'use strict';
/** Syntax-checks every browser script and Node script without running them. Zero dependencies. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const dirs = ['js', 'data', 'tools', 'scripts', 'test'];
let bad = 0, n = 0;
for (const d of dirs) {
  const dir = path.join(root, d);
  if (!fs.existsSync(dir)) continue;
  const walk = (p) => fs.readdirSync(p, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(p, e.name)) : [path.join(p, e.name)]));
  for (const f of walk(dir).filter((x) => x.endsWith('.js'))) {
    n++;
    try { new vm.Script(fs.readFileSync(f, 'utf8'), { filename: f }); }
    catch (e) { bad++; console.error(`SYNTAX ERROR in ${path.relative(root, f)}: ${e.message}`); }
  }
}
console.log(`${n} files checked, ${bad} with errors`);
process.exit(bad ? 1 : 0);
