# Explainable Setup Context — v0.1

Date: 2026-08-20

## Purpose

Combine already-validated evidence layers into one compact, explainable setup context without inventing an opaque probability score.

## Input layers

- deterministic Strat signal;
- advisory state;
- FTFC summary;
- index breadth;
- sector breadth;
- structural entry/stop/target geometry;
- optional historical evidence;
- optional carrier / active trade context.

## Output principle

The context object keeps each evidence source separate.

Example conceptual output:

`SETUP -> FTFC -> INDEX BREADTH -> SECTOR BREADTH -> R:R -> HISTORICAL EVIDENCE -> WHY`

No component is silently merged into a single confidence percentage.

## Risk/reward gate

`normalizeRR()` calculates directional structural reward/risk from explicit entry, stop, and target values.

For bullish setups:
- risk = entry - stop;
- reward = target - entry.

For bearish setups:
- risk = stop - entry;
- reward = entry - target.

Invalid geometry returns UNKNOWN rather than fabricating a ratio.

The default comparison threshold is 2:1, but it remains an explicit configurable management/research rule rather than a mutation of pure setup validity.

## Evidence labels

FTFC and breadth are classified only as:

- `ALIGNED`
- `OPPOSED`
- `MIXED_OR_UNKNOWN`

Historical evidence is labeled `AVAILABLE` only when a non-zero sample is supplied. It remains descriptive evidence, not a live forecast.

## Advisory precedence

The existing advisory-state rules remain authoritative:

1. armed/open Practice Mode context -> `ACTIVE_TRADE_CONTEXT`;
2. deterministic actionable signal -> `WATCH_ACTIONABLE_SETUP`;
3. otherwise -> `WAIT_NO_ACTIONABLE_SETUP`.

Strong FTFC, breadth, or historical evidence cannot create a setup.

## Why view

`why` exposes the evidence rows individually so UI can later provide a compact expandable explanation without duplicating logic.

Support/context layers are marked `explanatoryOnly: true`.

## Hard safeguards

- breadth does not create setup validity;
- FTFC does not create setup validity;
- historical rates are not forecasts;
- no opaque aggregate probability score is emitted;
- missing geometry stays UNKNOWN;
- index and sector breadth remain distinct.

## Future UI use

A compact scanner card may show only the most useful fields, while `Why?` expands the complete evidence object.

This allows a thin front end and makes the same context object reusable by Practice Mode and Trade Coach.

## Validation

Focused harness:

- `tests/setup-context-validation.js`

Coverage includes bullish/bearish R:R, invalid geometry, FTFC/breadth alignment, wait-state preservation, advisory precedence, R:R gating, historical-evidence separation, index-vs-sector separation, and no-probability safeguards.
