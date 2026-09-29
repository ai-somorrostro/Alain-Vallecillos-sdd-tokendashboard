# Spec Delta

## Purpose

Displays model pricing, latency, modality, and token-volume data from `mock-data.json` in a sortable comparison table so users can compare models at a glance without reading raw numbers.

## ADDED Requirements

### Requirement: Dashboard loads and displays model data
The system SHALL load the model list from `mock-data.json` and render one table row per model, containing the model name, input price, output price, time to first token (TTFT), input/output modalities, and token volumes.

#### Scenario: Successful load
- **WHEN** the dashboard is opened from a local HTTP server and `mock-data.json` is valid
- **THEN** a table renders with one row per model present in the file, in the file's original order by default

#### Scenario: Data fails to load
- **WHEN** `mock-data.json` cannot be fetched or parsed
- **THEN** the page shows a visible error message and no partially populated table rows

### Requirement: Prices are displayed in human-readable form
The system SHALL display prices per 1,000,000 tokens with two decimal places and a currency symbol (for example, `0.00000023` becomes `$0.23`).

#### Scenario: Per-token price is converted
- **WHEN** a model has `inputPricePerToken` of `0.00000023`
- **THEN** the input price column shows `$0.23` (per 1M tokens)

### Requirement: Token volumes are displayed in human-readable form
The system SHALL display token counts using abbreviated units with up to one decimal place (for example, `4200000` becomes `4.2M`, `7600000` becomes `7.6M`).

#### Scenario: Millions are abbreviated
- **WHEN** a model has `inputTokensDay` of `4200000`
- **THEN** the daily input tokens cell shows `4.2M`

#### Scenario: Thousands are abbreviated
- **WHEN** a model has a token count of `980000`
- **THEN** the cell shows `980K`

### Requirement: Derived cost figures are shown
The system SHALL compute and display a daily cost and a weekly cost per model as `(inputTokens * inputPricePerToken) + (outputTokens * outputPricePerToken)` for the corresponding period, formatted as currency with two decimal places.

#### Scenario: Daily cost is computed
- **WHEN** a model has 4,200,000 input tokens at $0.00000023 and 1,100,000 output tokens at $0.00000040 for the day
- **THEN** the daily cost cell shows `$1.41`

#### Scenario: Weekly cost is computed
- **WHEN** a model has 29,000,000 input tokens at $0.00000023 and 7,600,000 output tokens at $0.00000040 for the week
- **THEN** the weekly cost cell shows `$9.71`

### Requirement: Table columns are sortable
The system SHALL allow the user to sort the table by clicking any column header, toggling between descending and ascending order on repeated clicks, and SHALL indicate the active sort column and direction visually.

#### Scenario: Sort by daily cost
- **WHEN** the user clicks the daily cost header
- **THEN** rows reorder so the highest daily cost is first and the header shows the descending indicator

#### Scenario: Reverse the sort
- **WHEN** the user clicks the same header again
- **THEN** rows reorder into ascending order and the header shows the ascending indicator

#### Scenario: Sort by model name
- **WHEN** the user clicks the model name header
- **THEN** rows reorder alphabetically by model name rather than numerically

### Requirement: Dashboard requires no build step or dependencies
The system SHALL be implemented with plain HTML, CSS, and JavaScript only, with no frameworks, package managers, or build tooling, and SHALL be viewable by serving the project directory over HTTP.

#### Scenario: Page opens from a local server
- **WHEN** the project directory is served over HTTP and `index.html` is opened
- **THEN** the dashboard renders fully without any compilation or dependency installation step
