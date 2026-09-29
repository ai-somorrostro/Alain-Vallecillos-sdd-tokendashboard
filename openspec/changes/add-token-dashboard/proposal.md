# Proposal

## Why

The project has model usage and pricing data in `mock-data.json`, but no way to view or compare it. A static dashboard makes the data legible: which models are cheapest, fastest, and consuming the most tokens per day/week.

## What Changes

- Add a browser-viewable dashboard built with plain HTML, CSS, and JavaScript only (no frameworks, no build step).
- Load model data from the existing `mock-data.json` at runtime.
- Render the data as a single sortable table (one row per model) with human-readable formatting of prices, token volumes, and computed daily/weekly costs.
- Allow sorting by any column (default sort order defined in the spec).

## Capabilities

### New Capabilities
- `token-dashboard`: Display of model pricing, latency, modality, and token-volume data from `mock-data.json` in a sortable comparison table, including derived cost figures and human-readable number formatting.

### Modified Capabilities

(none - no existing specs in this project)

## Impact

- New files: `index.html`, `style.css`, `app.js` (names subject to design).
- Existing `mock-data.json` is read, not modified.
- No backend, no dependencies, no build tooling.
- Page must be served over HTTP (e.g. `python3 -m http.server`) because `fetch()` of local JSON is blocked on `file://`.
