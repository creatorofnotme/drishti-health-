'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { logic, call } = require('./helpers/sandbox');
const { healthy, withStock } = require('./helpers/fixtures');

const app = logic();
/** Run an() on a synthetic facility and return a plain object. */
const an = (f) => call(app, 'f=>{const a=an(f);return {cat:a.cat,lvl:a.lvl,kinds:a.rs.map(r=>r[2]),sev:a.rs.map(r=>r[0]),text:a.rs.map(r=>r[1]),mind:a.mind,low:a.low.length,occp:a.occp,tests:a.tests,fc:a.fc}}', f);

const CAT = { stable: 0, warning: 1, lowPerf: 2, highRisk: 3, critical: 4 };

test('thresholds are the documented ones', () => {
  assert.deepEqual(call(app, '()=>THRESH'), {
    critDays: 3, warnDays: 7, bedsPct: 90, attPct: 60, minTests: 4, minUse: 0.1,
    surplusDays: 25, keepDays: 21, targetDays: 14, minMove: 10,
  });
});

test('a facility with no problems is Stable with no flags', () => {
  const r = an(healthy());
  assert.equal(r.cat, CAT.stable);
  assert.equal(r.lvl, 0);
  assert.deepEqual(r.kinds, []);
  assert.equal(r.mind, 100);
});

test('forecast usage is a weighted moving average: 60% last 3 days, 40% whole week', () => {
  const f = healthy();
  f.med[0] = { q: 1000, h: [0, 0, 0, 0, 20, 20, 20] };           // 0.6*20 + 0.4*(60/7)
  const u = call(app, 'f=>use(f.med[0])', f);
  assert.ok(Math.abs(u - (0.6 * 20 + 0.4 * (60 / 7))) < 1e-9);
});

test('forecast usage never drops below the floor, so days-left stays finite', () => {
  const f = healthy();
  f.med[0] = { q: 5, h: [0, 0, 0, 0, 0, 0, 0] };
  assert.equal(call(app, 'f=>use(f.med[0])', f), 0.1);
  assert.equal(an(f).mind, 50);
});

test('stock-out: under 3 days is critical (severity 2), 3 to 7 days is a warning (severity 1)', () => {
  const crit = an(withStock(0, 25));       // 2.5 days
  assert.deepEqual(crit.kinds, ['s']);
  assert.deepEqual(crit.sev, [2]);
  assert.equal(crit.cat, CAT.critical);
  const warn = an(withStock(1, 50));       // 5 days
  assert.deepEqual(warn.sev, [1]);
  assert.equal(warn.cat, CAT.warning);
  assert.match(warn.text[0], /^ORS: 5\.0d left$/);
});

test('stock-out boundaries: exactly 3 days is only a warning, exactly 7 days is no flag', () => {
  assert.deepEqual(an(withStock(0, 30)).sev, [1]);
  assert.deepEqual(an(withStock(0, 70)).kinds, []);
  assert.deepEqual(an(withStock(0, 69)).kinds, ['s']);
});

test('bed pressure starts at 90% occupancy', () => {
  assert.deepEqual(an(healthy({ beds: 20, occ: 18 })).kinds, ['b']);   // 90%
  assert.deepEqual(an(healthy({ beds: 20, occ: 17 })).kinds, []);      // 85%
  assert.equal(an(healthy({ beds: 20, occ: 18 })).cat, CAT.warning);
});

test('attendance below 60% is a Low Performance staffing gap; 60% is fine', () => {
  const r = an(healthy({ att: 59 }));
  assert.deepEqual(r.kinds, ['a']);
  assert.equal(r.cat, CAT.lowPerf);
  assert.deepEqual(an(healthy({ att: 60 })).kinds, []);
});

test('no doctor posted is critical', () => {
  const r = an(healthy({ doc: 0, att: 0, docs: [] }));
  assert.ok(r.text.includes('No doctor posted'));
  assert.equal(r.cat, CAT.critical);
});

test('no doctor on duty today (but doctors posted) is a warning-level staffing flag', () => {
  const r = an(healthy({ docs: [['General', 'O', 90], ['Paediatrics', 'L', 90]] }));
  assert.deepEqual(r.kinds, ['a']);
  assert.ok(r.text.includes('No doctor on duty today'));
});

test('fewer than 4 of 6 tests is a test gap (Low Performance); 4 is fine', () => {
  const r = an(healthy({ tests: [1, 1, 1, 0, 0, 0] }));
  assert.deepEqual(r.kinds, ['t']);
  assert.equal(r.tests, 3);
  assert.equal(r.cat, CAT.lowPerf);
  assert.deepEqual(an(healthy({ tests: [1, 1, 1, 1, 0, 0] })).kinds, []);
});

test('equipment: only key equipment (oxygen, ambulance, power, water, cold chain) raises a flag', () => {
  assert.deepEqual(an(healthy({ eq: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1] })).kinds, ['q']);   // oxygen down
  assert.deepEqual(an(healthy({ eq: [1, 1, 1, 1, 1, 0, 0, 0, 0, 0] })).kinds, []);      // X-ray etc. down: no flag
  assert.deepEqual(an(healthy({ eq: [1, 1, 1, 1, 1, 2, 2, 2, 2, 2] })).kinds, []);      // not provisioned: no flag
});

test('an active incident is flagged', () => {
  const r = an(healthy({ inc: 'Flooding' }));
  assert.deepEqual(r.kinds, ['i']);
  assert.ok(r.text[0].includes('Flooding'));
});

test('several unrelated issues together are High Risk', () => {
  const r = an(withStock(0, 50, { occ: 19 }));      // stock warning + bed pressure
  assert.equal(r.cat, CAT.highRisk);
  assert.equal(r.lvl, 2);
});

test('attendance + tests only (no stock, beds or equipment issue) stays Low Performance', () => {
  const r = an(healthy({ att: 40, tests: [1, 0, 0, 0, 0, 0] }));
  assert.equal(r.cat, CAT.lowPerf);
});

test('any critical item outranks the other issues', () => {
  const r = an(withStock(2, 10, { occ: 19, att: 30 }));
  assert.equal(r.cat, CAT.critical);
  assert.equal(r.sev[0], 2, 'flags are sorted most severe first');
});

test('footfall forecast = weighted average plus half of the weekly slope per day', () => {
  const f = healthy({ fo: [10, 10, 10, 10, 10, 10, 16] });
  const exp = Math.round(0.6 * (10 + 10 + 16) / 3 + 0.4 * 76 / 7 + (16 - 10) / 6);
  assert.equal(an(f).fc, exp);
});

test('an() memoises its result on the record', () => {
  assert.equal(call(app, 'f=>an(f)===an(f)', healthy()), true);
});

test('riskOf() collapses categories into low / moderate / high', () => {
  const risk = (f) => call(app, 'f=>riskOf(f)', f);
  assert.equal(risk(healthy()), 0);
  assert.equal(risk(withStock(1, 50)), 1);          // warning
  assert.equal(risk(healthy({ att: 10 })), 1);      // low performance
  assert.equal(risk(withStock(0, 50, { occ: 19 })), 2);
  assert.equal(risk(withStock(0, 10)), 2);          // critical
});

test('stats() aggregates counts, occupancy and attendance', () => {
  const list = [healthy({ id: 1 }), healthy({ id: 2, att: 50, occ: 20, beds: 20 }), withStock(0, 10, { id: 3 })];
  const s = call(app, 'L=>stats(L)', list);
  assert.equal(s.n, 3);
  assert.equal(s.cats.reduce((a, b) => a + b, 0), 3);
  assert.equal(s.cats[CAT.critical], 1);
  assert.equal(s.so, 1);
  assert.equal(s.occ, Math.round((100 * (10 + 20 + 10)) / 60));
  assert.equal(s.att, Math.round((90 + 50 + 90) / 3));
  assert.equal(s.tst, 100);
});

test('stats() of an empty list does not divide by zero', () => {
  const s = call(app, 'L=>stats(L)', []);
  assert.equal(s.n, 0);
  assert.equal(s.occ, 0);
  assert.equal(s.att, 0);
  assert.equal(s.tst, 0);
});

/* ---------------- redistribution ---------------- */
const plan = (list) => call(app, 'L=>plan(L).map(x=>({nm:x.nm,from:x.f&&x.f.id,to:x.to.id,mv:x.mv,days:x.days}))', list);

test('plan(): a surplus centre covers a short one up to 14 days, keeping 21 days itself', () => {
  const donor = withStock(0, 5000, { id: 10 });             // 500 days
  const needy = withStock(0, 20, { id: 11 });               // 2 days, wants 14*10 = 140
  const moves = plan([donor, needy]);
  assert.equal(moves.length, 1);
  assert.deepEqual(moves[0], { nm: 'Paracetamol', from: 10, to: 11, mv: 120, days: 2 });
});

test('plan(): without a donor in the same district the need becomes a request to the district drug store', () => {
  const needy = withStock(0, 20, { id: 11 });
  const other = withStock(0, 5000, { id: 12, d: 'Sehore' });    // different district: cannot donate
  const moves = plan([needy, other]);
  assert.equal(moves.length, 1);
  assert.equal(moves[0].from, null);
  assert.equal(moves[0].mv, 120);
});

test('plan(): a donor never gives away more than its surplus', () => {
  const donor = withStock(0, 300, { id: 20 });              // 30 days: surplus = 300 - 210 = 90
  const needy = withStock(0, 0, { id: 21 });                // needs 140
  const moves = plan([donor, needy]);
  const fromDonor = moves.filter((m) => m.from === 20).reduce((a, m) => a + m.mv, 0);
  assert.ok(fromDonor <= 90, `donor gave ${fromDonor}`);
  assert.equal(moves.reduce((a, m) => a + m.mv, 0), 140, 'the rest is requested from the drug store');
});

test('plan(): trivial shortfalls (< 10 units) are not scheduled', () => {
  const f = healthy({ id: 30 });
  f.med[0] = { q: 6, h: [1, 1, 1, 1, 1, 1, 1] };            // 6 days left, needs 14*1-6 = 8 units
  assert.deepEqual(plan([f]), []);
});

test('plan(): centres in different states with the same district name never exchange stock', () => {
  const a = withStock(0, 5000, { id: 40, st: 'MP', d: 'Central' });
  const b = withStock(0, 20, { id: 41, st: 'UP', d: 'Central' });
  assert.equal(plan([a, b])[0].from, null);
});

test('plan(): output is sorted most urgent (fewest days left) first', () => {
  const list = [withStock(0, 60, { id: 50 }), withStock(0, 10, { id: 51 })];
  const days = plan(list).map((m) => m.days);
  assert.deepEqual(days, [...days].sort((a, b) => a - b));
});

/* ---------------- whole simulated dataset (golden regression values) ---------------- */
test('dataset regression: headline numbers match the values verified before the refactor', () => {
  const s = call(app, '()=>stats(DB.rows)');
  assert.equal(s.n, 658);
  assert.deepEqual(s.cats, [300, 118, 81, 88, 71]);
  assert.equal(s.flag, 176);
  assert.equal(s.watch, 182);
  assert.equal(s.so, 127);
  assert.equal(s.occ, 60);
  assert.equal(s.att, 81);
  assert.equal(s.fo, 117446);
  assert.equal(s.fc, 116550);
  assert.equal(s.tst, 87);
  const p = call(app, '()=>{const p=plan(DB.rows);return [p.length,p.reduce((a,x)=>a+x.mv,0)]}');
  assert.deepEqual(p, [160, 51837]);
});

test('dataset invariants: categories partition the dataset, levels are consistent', () => {
  const r = call(app, '()=>DB.rows.map(f=>{const a=an(f);return [a.cat,a.lvl,a.rs.length,a.mind>=0]})');
  assert.equal(r.length, 658);
  for (const [cat, lvl, n, ok] of r) {
    assert.ok(cat >= 0 && cat <= 4);
    assert.equal(cat === 0, n === 0, 'Stable <=> no flags');
    assert.equal(lvl === 0, n === 0);
    assert.ok(ok);
  }
});
