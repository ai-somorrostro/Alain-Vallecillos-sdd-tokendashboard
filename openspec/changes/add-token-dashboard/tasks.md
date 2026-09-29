# Tasks

## 1. Page scaffold

- [x] 1.1 Create `index.html` at repo root with a `<table>` skeleton (11 column headers, empty `<tbody>`, scroll wrapper) linking `style.css` and `app.js`; verify the page loads over HTTP with no console errors and empty headers render
- [x] 1.2 Create `style.css` with base table styles and an `overflow-x: auto` wrapper; verify the header row is styled and the wrapper scrolls horizontally when the viewport is narrow

## 2. Data loading and row rendering

- [x] 2.1 In `app.js`, fetch `mock-data.json` and render one `<tr>` per model using `createElement`/`textContent`; verify all 10 models appear in file order when served from `python3 -m http.server`
- [x] 2.2 Add a fetch/parse error branch that shows a visible message (including an HTTP-server hint) instead of table rows; verify by opening `index.html` via `file://` that the message appears and no rows render

## 3. Formatting and derived costs

- [x] 3.1 Implement `formatPrice` (per-1M, 2 decimals), `formatTokens` (K/M/B, one decimal, trailing `.0` trimmed), and `formatCost` helpers and apply them to price, TTFT, modality, and volume cells; verify `0.00000023` renders as `$0.23`, `4200000` as `4.2M`, `980000` as `980K`
- [x] 3.2 Add daily and weekly cost columns computed as `inTokens*inPrice + outTokens*outPrice` and rendered via `formatCost`; verify Llama 3.3 70B shows `$1.41` daily and `$9.71` weekly (spec check values)

## 4. Sorting

- [x] 4.1 Add `sortState` plus per-column comparators (numeric for money/TTFT/tokens/cost, locale string for name, string for modality) and re-sort/re-render on header click; verify clicking "Day Cost" puts the highest cost first and clicking again reverses it
- [x] 4.2 Show the active sort column/direction on headers (arrow glyph + `aria-sort`); verify the indicator moves to the clicked header and flips direction on repeated clicks, and that sorting by Name orders rows alphabetically

## 5. Integration verification

- [x] 5.1 Run through every scenario in `specs/token-dashboard/spec.md` against a served copy of the page and record pass/fail for each (load, load failure, price format, token format, both cost scenarios, all three sort scenarios, no-build open)
- [x] 5.2 Confirm the no-dependency constraint holds: only `index.html`, `style.css`, `app.js` were added and no package manager, framework, or build tooling was introduced (verify with a directory listing and no `package.json`)
