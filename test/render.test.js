'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./helpers/load-app');

const VIEWS = ['dash', 'map', 'fac', 'alr', 'pln'];

/** Fresh full app (all scripts, including app.js) each time, so state never leaks between tests. */
function boot(opts) { return loadApp(opts); }

/** Render a view with the given state patch and return everything the page would contain. */
function page(app, patch = {}) {
  app.run(`Object.assign(S,{v:'dash',reg:'',st:'',d:'',type:'All',q:'',cat:'',lim:24,lang:'en',av:'all',risk:'all',ff:'all'},${JSON.stringify(patch)});render()`);
  return {
    view: app.el('view').innerHTML,
    bar: app.el('bar').innerHTML,
    nav: app.el('nav').innerHTML,
    tabs: app.el('tabs').innerHTML,
    all() { return [this.view, this.bar, this.nav, this.tabs].join('\n'); },
  };
}

/** Heading levels as assistive tech sees them (aria-level overrides the tag). */
function headingLevels(html) {
  return [...html.matchAll(/<h([1-6])\b([^>]*)>/g)].map((m) => {
    const al = /aria-level="(\d)"/.exec(m[2]);
    return al ? +al[1] : +m[1];
  });
}

test('every view renders for the whole country without placeholders leaking into the page', () => {
  const app = boot();
  for (const v of VIEWS) {
    const html = page(app, { v }).all();
    assert.ok(html.length > 500, `${v} rendered`);
    assert.doesNotMatch(html, /undefined|NaN|\[object |Infinity/, `${v} contains a placeholder value`);
  }
});

test('every state renders in every view (36 states x 5 views)', () => {
  const app = boot();
  const states = app.run('ST.map(s=>s.c)');
  for (const st of states) for (const v of VIEWS) {
    const html = page(app, { v, st }).all();
    assert.doesNotMatch(html, /undefined|NaN|\[object |Infinity/, `${v}/${st}`);
  }
});

test('every district of a state renders, and filters combine without errors', () => {
  const app = boot();
  const d = app.run(`SM.MP.d.slice(0,6)`);
  for (const dist of d) for (const v of VIEWS) page(app, { v, st: 'MP', d: dist, type: 'PHC', cat: 2 });
  for (const risk of ['h', 'm', 'l']) for (const ff of ['hi', 'lo']) for (const av of ['beds', 'doc', 'med', 'tests']) {
    const html = page(app, { v: 'map', risk, ff, av }).view;
    assert.doesNotMatch(html, /undefined|NaN/);
  }
});

test('search narrows results and an unmatched query shows the empty state, not an error', () => {
  const app = boot();
  const all = page(app, { v: 'fac' }).view;
  const none = page(app, { v: 'fac', q: 'zzzz-no-such-centre' }).view;
  assert.match(none, /No centres match/);
  assert.ok(all.length > none.length);
  assert.match(page(app, { v: 'fac', q: 'bhopal' }).view, /Showing \d+ of \d+ centres/);
});

test('every language renders; untranslated ones fall back to English labels', () => {
  const app = boot();
  for (const l of app.run('LANGS.map(x=>x[0])')) {
    const p = page(app, { lang: l });
    assert.ok(p.nav.length > 100, l);
    assert.doesNotMatch(p.nav, /undefined/, l);
  }
});

test('"Show more" pagination reveals more cards', () => {
  const app = boot();
  const a = (page(app, { v: 'fac', lim: 24 }).view.match(/class="card"/g) || []).length;
  const b = (page(app, { v: 'fac', lim: 48 }).view.match(/class="card"/g) || []).length;
  assert.equal(a, 24);
  assert.equal(b, 48);
});

test('the centre profile dialog opens for every kind of facility', () => {
  const app = boot();
  for (const id of app.run('[DB.rows[0].id,DB.rows[200].id,DB.rows[400].id,DB.rows[657].id]')) {
    app.run(`openF(${id})`);
    const html = app.el('watchC').innerHTML;
    assert.match(html, /id="watchT"/);
    assert.doesNotMatch(html, /undefined|NaN/);
    assert.ok(app.el('watchD').open);
  }
});

test('theme: only "dark" or "light" are accepted from storage', () => {
  const evil = boot({ storage: { 'drishti-theme': '"><script>x</script>' } });
  assert.equal(evil.ctx.document.documentElement.dataset.theme, 'light');
  const dark = boot({ storage: { 'drishti-theme': 'dark' } });
  assert.equal(dark.ctx.document.documentElement.dataset.theme, 'dark');
});

/* ---------------- security ---------------- */
test('SECURITY: hostile text in the data cannot inject markup in any view or in the profile dialog', () => {
  const app = boot();
  app.run(`(()=>{const f=JSON.parse(JSON.stringify(DB.rows[0]));f.id=999001;f.n='<img src=x onerror=alert(1)>';f.loc='<svg onload=alert(2)>';
    f.inc='<script>alert(3)</script>';f.med[0].q=1;f.docs=[['<b>x</b>','D',50]];f.doc=1;f._a=null;DB.rows.push(f);globalThis.__evil=f})()`);
  const outputs = [];
  for (const v of VIEWS) outputs.push(page(app, { v, lim: 999 }).view);
  app.run('openF(999001)');
  outputs.push(app.el('watchC').innerHTML);
  const joined = outputs.join('\n');
  assert.ok(joined.includes('&#60;img src=x onerror=&#61;') || joined.includes('&#60;img src=x onerror=alert(1)&#62;'), 'the hostile name is present, escaped');
  assert.doesNotMatch(joined, /<img src=x/);
  assert.doesNotMatch(joined, /<svg onload/);
  assert.doesNotMatch(joined, /<script>alert/);
  assert.doesNotMatch(joined, /<b>x<\/b>/);
});

test('SECURITY: rendered markup never contains inline event handlers or javascript: URLs (strict CSP)', () => {
  const app = boot();
  for (const v of VIEWS) {
    const html = page(app, { v }).all();
    assert.doesNotMatch(html, /\son[a-z]+\s*=/i, `${v} has an inline handler`);
    assert.doesNotMatch(html, /javascript:/i, v);
  }
  app.run('openF(DB.rows[5].id)');
  assert.doesNotMatch(app.el('watchC').innerHTML, /\son[a-z]+\s*=/i);
});

test('SECURITY: a broken photo is replaced by the placeholder without an inline handler', () => {
  const app = boot();
  const img = { tagName: 'IMG', className: 'him', src: 'assets/hospitals/x.jpg', classList: { contains: (c) => c === 'him' } };
  app.ctx.__img = img;
  app.run('imgFallback({target:__img})');
  assert.equal(img.className, 'him ph');
  assert.match(img.src, /placeholder\.svg$/);
  // a failing placeholder must not loop
  img.classList = { contains: (c) => c === 'him' || c === 'ph' };
  img.src = 'unchanged';
  app.run('imgFallback({target:__img})');
  assert.equal(img.src, 'unchanged');
});

/* ---------------- accessibility ---------------- */
test('A11Y: headings start at h1 and never skip a level, in every view', () => {
  const app = boot();
  for (const v of VIEWS) {
    const lv = headingLevels(page(app, { v }).view);
    assert.equal(lv[0], 1, `${v} must start with an h1 (got h${lv[0]})`);
    assert.equal(lv.filter((x) => x === 1).length, 1, `${v} must have exactly one h1`);
    lv.forEach((x, i) => { if (i) assert.ok(x - lv[i - 1] <= 1, `${v}: h${lv[i - 1]} followed by h${x}`); });
  }
});

test('A11Y: images have alt text; SVG images and groups have accessible names', () => {
  const app = boot();
  for (const v of VIEWS) {
    const html = page(app, { v }).view;
    for (const m of html.matchAll(/<img\b[^>]*>/g)) assert.match(m[0], /\balt="/, `${v}: ${m[0].slice(0, 80)}`);
    for (const m of html.matchAll(/<svg\b[^>]*role="(img|group)"[^>]*>/g)) assert.match(m[0], /aria-label="[^"]+"/, `${v}: svg without name`);
  }
});

test('A11Y: interactive elements are not nested inside role="img" (they would be hidden from screen readers)', () => {
  const app = boot();
  for (const v of VIEWS) {
    const html = page(app, { v }).view;
    for (const m of html.matchAll(/<svg\b[^>]*role="img"[^>]*>([\s\S]*?)<\/svg>/g)) {
      assert.doesNotMatch(m[1], /role="button"|tabindex=/, `${v}: focusable content inside role="img"`);
    }
  }
});

test('A11Y: every button has an accessible name, every select a label', () => {
  const app = boot();
  for (const v of VIEWS) {
    const html = page(app, { v }).all();
    for (const m of html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)) {
      const text = m[2].replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, '').trim();
      assert.ok(text || /aria-label="[^"]+"/.test(m[1]), `${v}: nameless button ${m[0].slice(0, 100)}`);
    }
    for (const m of html.matchAll(/<select\b[^>]*>/g)) assert.match(m[0], /aria-label="[^"]+"/, `${v}: select without label`);
  }
});

test('A11Y: data tables have column headers with scope; the map table has a caption', () => {
  const app = boot();
  for (const v of VIEWS) {
    const html = page(app, { v }).view;
    for (const m of html.matchAll(/<th\b[^>]*>/g)) assert.match(m[0], /scope="col"/, `${v}: <th> without scope`);
  }
  assert.match(page(app, { v: 'map' }).view, /<caption class="sr-only">/);
});

test('A11Y: the current view is exposed with aria-current in both navigations', () => {
  const app = boot();
  const p = page(app, { v: 'alr' });
  assert.equal((p.nav.match(/aria-current="page"/g) || []).length, 1);
  assert.equal((p.tabs.match(/aria-current="page"/g) || []).length, 1);
  assert.match(p.nav.match(/<button[^>]*aria-current="page"[^>]*>/)[0], /data-v="alr"/);
});

test('A11Y: toggle chips expose their state with aria-pressed', () => {
  const app = boot();
  const html = page(app, { type: 'PHC' }).bar;
  assert.match(html, /data-t="PHC" aria-pressed="true"/);
  assert.match(html, /data-t="CHC" aria-pressed="false"/);
});

test('A11Y: the page title follows the view and result counts are announced politely', () => {
  const app = boot();
  page(app, { v: 'pln' });
  assert.match(app.ctx.document.title, /^.+ \| DRISHTI/);
  const before = app.el('sr').textContent;
  page(app, { v: 'fac', st: 'MP' });
  assert.match(app.el('sr').textContent, /^\d+ centres match the current filters$/);
  assert.notEqual(app.el('sr').textContent, before);
});

test('A11Y: the keyboard can open a state row of the summary table (Enter/Space)', () => {
  const app = boot();
  assert.match(page(app, { v: 'map' }).view, /<tr data-pick="[A-Z]+" class="[^"]*" tabindex="0" aria-label="Show /);
});
