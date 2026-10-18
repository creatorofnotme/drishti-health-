'use strict';
/** Builders for synthetic facilities used by the unit tests. Values are chosen so the maths is easy to check by hand. */

const DAILY = [10, 10, 10, 10, 10, 10, 10]; // forecast usage = 0.6*10 + 0.4*10 = 10 units/day

/** A facility with no issues: 100 days of every medicine, 50% beds, 90% attendance, all tests, all equipment. */
function healthy(over = {}) {
  return {
    id: 1, n: 'Test CHC', t: 'CHC', st: 'MP', d: 'Bhopal', loc: 'Test', lat: 23.2, lng: 77.4,
    beds: 20, occ: 10, doc: 2, att: 90, staff: 5,
    fo: [50, 52, 49, 51, 50, 53, 55],
    med: [1, 2, 3, 4, 5].map(() => ({ q: 1000, h: [...DAILY] })),
    tests: [1, 1, 1, 1, 1, 1],
    eq: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    docs: [['General', 'D', 90], ['Paediatrics', 'C', 90]],
    inc: '',
    ...over,
  };
}

/** Same as healthy() but medicine `i` has `q` units in stock (usage stays 10/day, so days left = q/10). */
function withStock(i, q, over = {}) {
  const f = healthy(over);
  f.med[i] = { q, h: [...DAILY] };
  return f;
}

module.exports = { healthy, withStock, DAILY };
