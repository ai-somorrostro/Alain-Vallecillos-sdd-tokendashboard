# Design

## Context

Greenfield static page: the repo contains only `mock-data.json` (10 models with per-token prices, TTFT, modalities, and day/week token volumes) and an empty OpenSpec tree. See proposal.md for motivation; requirements are in `specs/token-dashboard/spec.md`.

Constraints that shape the approach: plain HTML/CSS/JS only, no build step, no dependencies, and the page must be opened via a local HTTP server because `fetch()` of a local JSON file is blocked on `file://`.

## Goals / Non-Goals

**Goals:**
- One readable table comparing all models, sortable on every column
- Human-readable numbers (per-1M prices, K/M token suffixes, computed daily/weekly cost)
- Zero tooling: three files, open in a browser via a static server

**Non-Goals:**
- Filtering, search, pagination, or charts (data is 10 rows)
- Responsive/mobile-first optimization beyond horizontal scroll on narrow screens
- Live data, APIs, persistence, or any state beyond the current sort
- Tests/tooling infrastructure (out of scope for this change)

## Decisions

**1. Load data with `fetch()` at runtime; require an HTTP server.**
- *Chosen:* `fetch('mock-data.json')` in `app.js`, with an error branch that renders a visible failure message.
- *Alternative considered:* inlining the JSON into the JS. Rejected: duplicates the data so `mock-data.json` stops being the single source of truth, and the spec fixes HTTP serving as the viewing path.
- Consequence: documented run instruction `python3 -m http.server` (or equivalent) from the project root.

**2. Three flat files: `index.html`, `style.css`, `app.js` at repo root.**
- *Chosen:* minimal surface, each file with one job; the table markup lives in `index.html` as a static `<table>` skeleton, JS only populates `<tbody>` and toggles sort indicators.
- *Alternative considered:* a single self-contained `index.html`. Rejected: mixes three concerns and makes the CSS harder to scan; still no build step either way.

**3. Sort state lives in one object; re-render the tbody on each click.**
```
sortState = { key: 'name', dir: 'asc' }   // initial: file order OR name asc

click header(key):
  dir = (sortState.key === key && sortState.dir === 'desc') ? 'asc' : 'desc'
  rows.sort(comparator[key](dir))
  render()
  updateHeaderIndicators()
```
- Each column gets its own comparator (numeric for prices/TTFT/tokens/cost, locale string compare for `name`, string compare for modality). Avoids one generic comparator mis-sorting mixed types.
- Sorting operates on the raw data objects; formatting happens only at render time so numbers are never sorted as strings.
- *Alternative considered:* CSS-only sorting or sort-on-load-only. Rejected: spec requires clickable headers with direction indicators.

**4. Formatting helpers, three small pure functions:**
- `formatPrice(p)` → `(p * 1e6).toFixed(2)` prefixed with `$` (per 1M tokens)
- `formatTokens(n)` → K/M/B suffix, one decimal place, trailing `.0` trimmed (e.g. `980000` → `980K`, `4200000` → `4.2M`)
- `formatCost(n)` → `$` + `toFixed(2)`; cost = `inTokens * inPrice + outTokens * outPrice` per period

**5. Column set (11 columns, modalities merged):**

| Name | In $/1M | Out $/1M | TTFT | Modality | Day In | Day Out | Day Cost | Week In | Week Out | Week Cost |

- *Decision:* render modality as a single `Text -> Text` cell instead of two columns - it is never numeric, rarely differs, and two extra columns widen the table for little comparison value.
- Wide table handled with `overflow-x: auto` on a wrapper rather than hiding columns.

**6. DOM building via `document.createElement` + `textContent`** (no `innerHTML` with data). Keeps the rendering trivially safe and needs no escaping logic.

## Risks / Trade-offs

- [`file://` opening fails silently with a CORS error] → explicit error branch renders a message telling the user to serve the directory over HTTP; documented in README-style note in `index.html` comments or the run task.
- [11-ish columns overflow small screens] → horizontally scrollable wrapper; desktop-first is acceptable for a comparison dashboard.
- [Rounding surprises: `1.406` → `$1.41`, spec scenarios pin exact values] → use `toFixed(2)` consistently; spec scenarios double as check values.
- [Sort indicator needs to be visible without color-only cues] → use text/arrow characters on the header plus `aria-sort`, not color alone.
- [`TTFT` is in ms and never formatted] → keep raw integer with `ms` suffix; no risk of unit confusion.

## Migration Plan

Not applicable - new static page, no existing behavior, no deployment beyond opening the served directory. Rollback = delete the three new files.

## Open Questions

None blocking. Deferrable: exact sort-indicator glyph (`^`/`v` vs `▲`/`▼`) - cosmetic, does not affect specs or tasks.
