# Engine Validation — v0.19

Date: 2026-08-19

## Current status

- Legacy synthetic regression layer: **44/44 PASS** in the v0.2 expanded harness. Superseded semantics in that file remain historical only.
- Corrected core engine: **15/15 PASS** in `tests/core-engine-v0.3-validation.js`.
- Setup-specific first magnitude: **10/10 PASS** in `tests/setup-magnitude-validation-v0.1.js`.
- Research outcome/scenario layer: **20/20 PASS** in `tests/research-outcomes-validation.js`.
- Post-magnitude objective layer: deterministic behavior preserved; terminology now exposes explicit `priceExhaustionRisk` while retaining `exhaustionRisk` as a temporary compatibility alias.
- Explicit time/price exhaustion layer: **21/21 PASS locally** in `tests/exhaustion-validation.js`.
- Structural target qualification layer: **19/19 PASS** in `tests/target-qualification-validation.js`.
- Target hierarchy / de-duplication layer: **18/18 PASS** in `tests/target-hierarchy-validation.js`.
- Integrated multi-timeframe objective pipeline: **20/20 PASS** in `tests/objective-pipeline-validation.js`.
- Timeframe/domino state layer: **20/20 PASS** in `tests/timeframe-domino-validation.js`.
- PMG geometry/actionable-state layer: **21/21 PASS** in `tests/pmg-validation.js`.
- Real-market validation exists for 2-2, 2-1-2, 3-1-2, and SSS50 examples.
- Research Console remains wired to `core-engine-v0.3.js` and remains in SAMPLE DATA mode.

## TheStrat.ai documentation audit — new in v0.19

The free TheStrat.ai help material is now being treated as a structured operational cross-check, not as a replacement for Rob Smith canonical rules.

Audit file:
- `research/THESTRAT-AI-DOC-AUDIT-v0.1.md`

Current high-value confirmations/refinements:

### Continuity + signal + broadening formation
The current docs explicitly separate:
- continuity = evidence;
- actionable signal = timing;
- broadening formation = map/magnitude.

This matches the current engine separation of FTFC/context, setup trigger, and objective structure.

### Lower-timeframe timing into higher-timeframe objectives
The docs show lower-timeframe signals/broadening being used to time higher-timeframe moves. This supports the domino architecture while preserving the safeguard that a lower timeframe cannot place a higher-timeframe trigger in force unless price actually crosses that higher-timeframe trigger.

### Three-price signal model
The current docs describe signals with three prices:
1. signal / trigger;
2. target / magnitude;
3. level of reclaim.

The engine already stores trigger and magnitude. `levelOfReclaim` is now a required field for the next core setup-object revision rather than being conflated with a generic stop.

### 3-2 expansion safeguard
The current docs state that a 3-2 is range expansion and has no magnitude of its own. When 3-2 is implemented, the core selector must return no setup-defined magnitude unless a separately validated higher-timeframe magnitude is supplied.

## Exhaustion terminology correction — new in v0.19

TheStrat.ai documentation makes an important distinction that our generic `exhaustionRisk` naming did not express clearly enough.

### Exhaustion by time
Mechanical question: how much time remains before the actionable signal's bar closes/expires?

New module:
- `exhaustion.js`

New deterministic state includes:
- exact elapsed percentage;
- exact remaining percentage;
- signal start/end timestamps;
- active / not-started / expired state;
- no invented LOW/MEDIUM/HIGH numerical thresholds.

### Exhaustion by price
Separate condition associated with completing magnitude / clearing the currently active objective structure or entering fresh extremes.

`magnitude.js` now exposes:
- `priceExhaustionRisk`
- legacy `exhaustionRisk` alias temporarily retained for dependent-module compatibility.

Time exhaustion and price exhaustion must never be treated as the same condition in research data or Trade Coach logic.

### Focused validation
`tests/exhaustion-validation.js`: **21/21 PASS locally**.

It validates:
- 0%, 50%, 91.667%, and 100% elapsed examples;
- exact remaining percentage;
- active vs expired state;
- pre-start clamping;
- separate time-only and price-only exhaustion states;
- invalid time windows rejected.

## PMG terminology safeguard

The current PMG staircase detector remains based on Sara's published scanner geometry and sequential higher-low/lower-high pivot structure.

TheStrat.ai current material also describes pivot-after-pivot travel through prior ranges as PMG fuel. One older/general setup-guide page labels `3-1-3` as "Pivot Machine Gun." Until dedicated current source material resolves that naming, the engine must keep these separate:

- `PMG_STAIRCASE` = sequential higher lows / lower highs used as target structure;
- `3-1-3` = distinct setup/pattern identifier if implemented later.

Do not silently redefine the staircase detector as 3-1-3.

## Timeframe / domino state

`timeframe-domino.js` supports:

`Y -> Q -> M -> W -> D -> 60 -> 30 -> 15 -> 5`

Default convenience profiles:
- `LONG_TERM`: Y/Q/M/W/D
- `SWING`: M/W/D/60
- `SWING_WITH_ENTRY`: M/W/D/60/30/15
- `INTRADAY`: D/60/30/15/5

Profiles remain presets only; custom groups are allowed.

## Integrated objective pipeline

Production path remains:

`SETUP-DEFINED MAGNITUDE -> STRUCTURAL RANGE QUALIFICATION -> TARGET HIERARCHY / EXACT DE-DUP -> OBJECTIVE STATE -> PRICE EXHAUSTION`

Time exhaustion is calculated independently from the signal bar's clock.

## Real-market validation summary

### RM-001 — SPY September 2021 SSS50 / potential outside month
Validated live-price midpoint semantics, path ordering, and opposite-side target geometry.

### RM-002 — SPY August 2021 daily 2-2
Bullish case resolves WIN under midpoint stop. Bearish case demonstrates daily same-bar ambiguity under midpoint stop and WIN under structure stop.

### RM-003 — SPY November 2021 daily 2-1-2
Bearish and bullish examples validate first magnitude. Daily OHLC preserves same-bar midpoint-stop ambiguity; structure-stop scenarios resolve WIN.

### RM-004 — SPY November 2022 daily 3-1-2
Clean bearish 3-1-2 validates trigger, first magnitude, and WIN under both midpoint and structure stop models without path ambiguity.

## Historical research accounting

Primary outcome states remain:
- WIN = magnitude before stop;
- LOSS = stop before magnitude;
- AMBIGUOUS = both occurred but available data cannot establish order;
- OPEN / UNRESOLVED = no valid resolved result yet.

Scenario fields now need to distinguish:
- `timeExhaustionRisk`
- `timeRemainingPct`
- `priceExhaustionRisk`
- `levelOfReclaim`
- `carrierTimeframes[]`
- `borrowedMagnitudeTimeframe`

Every reported percentage must retain sample size. Exploratory findings must survive out-of-sample validation before being treated as useful evidence.

## Core safeguards still active

- completed Scenario 3 remains path-ambiguous unless lower-timeframe/tick sequence resolves direction;
- SSS50 midpoint confirmation is intrabar/live-price based, not close-confirmation based;
- magnitude = setup-defined first objective;
- targets = further structurally qualified objectives;
- raw pivots are not guaranteed targets;
- PMG geometry is not a reversal signal;
- no universal PMG spacing threshold is invented;
- exact same target price can merge while preserving source provenance;
- nearby unequal target prices remain semantically separate by default;
- timeframe size alone does not override price-path objective order;
- Yearly/Quarterly are supported but never required by default;
- a lower timeframe cannot falsely activate a higher timeframe;
- thesis and execution timeframe identity are stored separately;
- time exhaustion and price exhaustion are separate states;
- neither exhaustion type is an automatic reversal signal;
- these tests validate implementation, not profitability or historical expectancy.

## Next validation/build work

1. continue the TheStrat.ai documentation audit across actionable signals, levels of reclaim, reversals, PMG, broadening, and management before hardening those modules;
2. add `levelOfReclaim` and signal-expiration metadata to actual core setup objects;
3. integrate PMG levels with the production target hierarchy/objective pipeline in a focused end-to-end fixture;
4. return to domino work using actual core-engine setup objects instead of synthetic timeframe states;
5. validate historical lower-to-higher timeframe advancement on real charts;
6. add explicit timeframe/session/anchor metadata to the data model;
7. connect a low-cost historical data adapter and begin broader audited scenario backtesting.

The Research Console remains in sample-data mode until the real-market validation and data-semantics layers are materially complete.
