# DRISHTI Health

**D**igital **R**egional **I**nfrastructure and **H**ealth **S**urveillance **T**racking **I**nitiative.

A zero-dependency web dashboard that shows **operational gaps in Primary and Community Health Centres (PHCs / CHCs)**:
medicine stock, patient footfall, beds, doctors, diagnostic tests and equipment, across 36 states and UTs. It flags
centres that are failing, forecasts stock and footfall, and proposes where surplus medicine should move.

> **All data is simulated.** No real facility records or live feeds are connected, and the app says so on every screen.

## Run it

```bash
npm start          # http://localhost:8080  (tiny static server with security headers; Node 18+)
npm run verify     # syntax check + the full test suite
```

No install step and no build step: every file is plain HTML, CSS and JavaScript. You can also just open `index.html`
from any static host.

## Problem statement to features

| Need (operational gaps in PHCs and CHCs)        | Where it lives                                                                      |
| ----------------------------------------------- | ----------------------------------------------------------------------------------- |
| See gaps across the country, state and district | Dashboard KPI tiles, status ring, India map with risk-coloured dots, filters        |
| Find failing centres early                      | 5-level status per centre (Stable, Warning, Low Performance, High Risk, Critical Loss) and the **Alerts** view |
| Medicine stock-outs                             | Days-of-stock forecast per medicine (weighted moving average), 3-day and 7-day thresholds |
| Beds, doctors, tests, equipment, incidents      | Flags per centre: bed pressure (90%+), attendance under 60%, no doctor, under 4 of 6 tests, key equipment down |
| Act on it                                       | Recommended action per flag, "Escalate to DHO" (simulated), CSV export              |
| Move supplies to where they are needed          | **Redistribution** view: donors keep 21 days, receivers are topped up to 14 days, otherwise a drug-store request |
| Patient load                                    | Footfall trend and next-day forecast                                                |
| Everyone can use it                             | 13 translated languages (Urdu is right-to-left), keyboard and screen-reader support |

## How the status logic works

All rules live in `js/store.js`, and every number in them is in the `THRESH` object at the top of the file.

* **Forecast**: daily usage = 60% of the last 3 days + 40% of the week. Days left = stock / usage.
* **Flags** (severity 2 is critical): stock under `critDays` (3) is critical, under `warnDays` (7) is a warning;
  beds at or above `bedsPct` (90); attendance under `attPct` (60); no doctor posted (critical) or none on duty;
  fewer than `minTests` (4) of 6 tests; key equipment down; an active incident.
* **Category**: any critical flag is *Critical Loss*; only attendance/test flags is *Low Performance*;
  two or more flags is *High Risk*; one flag is *Warning*; none is *Stable*.
* **Redistribution**: within one district, a centre with more than `surplusDays` (25) of a medicine can donate down to
  `keepDays` (21); centres under `warnDays` are topped up to `targetDays` (14); moves under `minMove` (10 units) are skipped.

## Project layout

```
index.html           page shell (CSP, landmarks, skip link, deferred scripts)
css/styles.css       all styling, light and dark themes
js/utils.js          escaping, formatting, icons, photo helper, CSV cell guard
js/store.js          dataset, THRESH, forecast, status categories, redistribution plan
js/views.js          state, dashboard, centre cards, centre profile dialog, render()
js/map.js            India map view and risk helpers
js/analytics.js      Alerts and Redistribution views, charts, CSV export
js/app.js            event handling, theme, search
data/                simulated facilities, states, districts, translations
tools/               build_data.js (regenerates the sample data), place_on_map.py (map positions)
scripts/             serve.js (dev server), check-syntax.js
test/                node:test suite, see below
```

## Tests

`npm test` runs 80+ tests with Node's built-in runner (no dependencies). The real browser scripts are loaded into a `vm`
sandbox with a small DOM stub (`test/helpers/load-app.js`), so the tests exercise production code, not copies.

| File                  | What it covers                                                                                  |
| --------------------- | ----------------------------------------------------------------------------------------------- |
| `analysis.test.js`    | every flag, threshold boundary, category rule, forecast maths, stats, redistribution invariants, golden numbers for the full dataset |
| `data.test.js`        | data integrity (unique ids, valid states/districts, ranges, shapes), i18n completeness, photo files and size budget |
| `render.test.js`      | all 5 views for all 36 states, filters, languages, pagination, profile dialog; **XSS**, **accessibility** (heading order, names, roles, table headers, aria-current, live region) |
| `static.test.js`      | CSP strength, no inline scripts/handlers/eval/network calls, deferred scripts, performance budgets, focus/reduced-motion/forced-colors CSS, WCAG AA text contrast |
| `utils.test.js`       | escaping, number formatting, CSV injection guard, debounce, photo helper                         |
| `server.test.js`      | dev server headers, path traversal protection                                                   |
| `tools.test.js`       | the data generator reproduces the shipped data exactly                                          |

## Security notes

* Strict Content-Security-Policy: scripts only from the same origin, no inline scripts or event handlers, no `eval`,
  no network requests (`connect-src 'none'`), no plugins, no form posts. The only third party is Google Fonts.
* Everything that reaches `innerHTML` goes through `esc()`; a test injects hostile names into every view.
* CSV exports neutralise spreadsheet formulas (`=`, `+`, `-`, `@`).
* Stored theme preference is validated before use. Nothing sensitive is stored or sent anywhere.
* When deploying, also send `X-Content-Type-Options: nosniff` and `frame-ancestors 'none'` as HTTP headers
  (`scripts/serve.js` shows how; meta tags cannot set `frame-ancestors`).

## Accessibility notes

Skip link, one `h1` per view with no skipped levels, labelled landmarks, `aria-current` navigation, `aria-pressed`
toggles, keyboard access to map dots, table rows and sortable headers, polite live region for result counts,
page title per view, visible focus rings, `prefers-reduced-motion` and `forced-colors` support, WCAG AA text contrast,
and an accessible name for every chart and the map.

## Replacing the simulated data

Each facility follows the schema documented at the top of `data/hospitals.js`. Add real records there, run
`npm test` (the data tests validate the shape), and `python3 tools/place_on_map.py` to compute map positions.

## Known limits

* Forecasts are simple statistical estimates, not clinical or procurement advice.
* Officer names are intentionally not stored; each district shows the designation only.
* Labels are translated for 13 of the 23 listed languages; the rest fall back to English.
