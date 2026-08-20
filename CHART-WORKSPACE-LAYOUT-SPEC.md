# Chart Workspace Layout — v0.1

Date: 2026-08-20

## Purpose

Support a flexible one-to-four chart workspace for examining the same symbol across multiple timeframes without forcing the user to keep all four charts visible.

This is a UI/workspace rule only. It does not change market data, Strat classification, FTFC, signal validity, or Practice Mode.

## User interaction

Desktop should expose a compact layout control, preferably near the right edge of the chart workspace, with:

- 1 chart
- 2 charts
- 3 charts
- 4 charts

After choosing the chart count, the user selects exactly that many timeframes.

Selected timeframes are always ordered from lowest to highest timeframe in the visible workspace. Example valid combinations:

- `15`
- `15 / D`
- `15 / 60 / D`
- `15 / 30 / 60 / D`
- `15 / 60 / W / M`
- `30 / D`

The point is comparison, not a fixed preset. A user can keep a higher-timeframe broadening formation visible while drilling into a lower-timeframe execution chart.

## Supported initial timeframe ladder

`5 -> 15 -> 30 -> 60 -> D -> W -> M -> Q -> Y`

Timeframes may be displayed only when the corresponding semantic data is validated for that path. In particular, 60-minute production use remains gated by the separate provider/aggregation semantic validation.

## Defaults

Current deterministic defaults:

- 1 chart: `15`
- 2 charts: `15 / D`
- 3 charts: `15 / 60 / D`
- 4 charts: `60 / D / W / M`

These are defaults only; they do not restrict user combinations.

## Ordering

Regardless of selection order, panels are arranged `LOWEST_TO_HIGHEST`.

This prevents panel position from becoming ambiguous when the user changes combinations.

## Layout behavior

Renderer implementation may choose the most readable geometry for the active count:

- 1: single large panel
- 2: two panels, side-by-side on desktop where space permits
- 3: one larger + two supporting panels or a balanced responsive grid
- 4: 2x2 desktop grid

The exact geometry is presentation-level and can be refined during DESIGN/FRICTION testing. The chart count/timeframe selection contract is locked here.

## Synchronization

All panels share the same symbol/workspace. Optional synchronized crosshair/selected-time behavior remains compatible with this layout model.

The chart time axes remain semantically independent.

## Implementation

Deterministic workspace state is implemented in:

- `chart-workspace-layout.js`

Focused validation:

- `tests/chart-workspace-layout-validation.js`

The model enforces:

- 1-4 chart limit;
- unique selected timeframes;
- lowest-to-highest ordering;
- explicit selection count;
- no silent fifth chart;
- no unsupported timeframe aliases.

## Status

UX concept: ACCEPTED.
Workspace state model: IMPLEMENTED.
Visible chart-layout control: pending chart renderer workspace integration.
