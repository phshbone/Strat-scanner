# Engine Validation — v0.18

Date: 2026-08-19

## Current status

- Legacy synthetic regression layer: **44/44 PASS** in the v0.2 expanded harness. Superseded semantics in that file remain historical only.
- Corrected core engine: **15/15 PASS** in `tests/core-engine-v0.3-validation.js`.
- Setup-specific first magnitude: **10/10 PASS** in `tests/setup-magnitude-validation-v0.1.js`.
- Research outcome/scenario layer: **20/20 PASS** in `tests/research-outcomes-validation.js`.
- Post-magnitude objective/exhaustion layer: **24/24 PASS** in `tests/magnitude-validation.js`.
- Structural target qualification layer: **19/19 PASS** in `tests/target-qualification-validation.js`.
- Target hierarchy / de-duplication layer: **18/18 PASS** in `tests/target-hierarchy-validation.js`.
- Integrated multi-timeframe objective pipeline: **20/20 PASS** in `tests/objective-pipeline-validation.js`.
- Timeframe/domino state layer: **20/20 PASS** in `tests/timeframe-domino-validation.js`.
- PMG geometry/actionable-state layer: **21/21 PASS** in `tests/pmg-validation.js`.
- Real-market validation exists for 2-2, 2-1-2, 3-1-2, and SSS50 examples.
- Research Console remains wired to `core-engine-v0.3.js` and remains in SAMPLE DATA mode.

## Pivot Machine Gun (PMG) — new in v0.18

`pmg.js` adds deterministic PMG staircase detection without treating the geometry itself as a trade trigger.

### General geometry

- bearish PMG candidate = consecutive strictly higher lows;
- bullish PMG candidate = consecutive strictly lower highs;
- default general detector minimum = 5 bars;
- equality breaks the strict sequence.

A public TheStrat indicator description states that PMG labels 5 or more consecutive candles making higher lows or 5 or more making lower highs.

Sara Strat Sniper's published `Strat M PMG Short` TrendSpider scanner is slightly stricter in literal form: current monthly low is above low[1], which is above low[2], continuing through low[5]. That is six monthly candles connected by five strict higher-low comparisons.

The engine preserves both:
- default general PMG detector: `minBars = 5`;
- `SARA_MONTHLY_SHORT` preset: 6 bars to reproduce Sara's published scanner criterion.

### Actionable-state safeguard

PMG geometry alone does not create an entry.

`buildPmgState()` requires a separate Strat reversal:
- the reversal must be in force;
- its direction must match the PMG traversal direction.

States:
- `NO_PMG`
- `PMG_WAITING_FOR_REVERSAL`
- `PMG_IN_FORCE`

This prevents the engine from assuming that a staircase must reverse.

### PMG target integration

For bearish PMG:
- staircase lows are emitted as sequential downside levels.

For bullish PMG:
- staircase highs are emitted as sequential upside levels.

PMG levels carry structural-target metadata so they can pass into the existing target hierarchy/objective machinery rather than creating a separate target system.

Current integration path:

`PMG GEOMETRY -> VALID STRAT REVERSAL / IN FORCE -> PMG LEVELS -> TARGET HIERARCHY -> OBJECTIVE / EXHAUSTION`

### Focused PMG validation

`tests/pmg-validation.js` reports **21/21 PASS locally** and verifies:
- five-bar higher-low and lower-high PMG geometry;
- strict inequality;
- Sara six-bar monthly-short preset;
- correct level extraction/order;
- source/timeframe metadata;
- geometry waiting for a reversal;
- matching in-force reversal activation;
- opposite-direction/out-of-force rejection;
- invalid configuration rejection.

See:
- `pmg.js`
- `tests/pmg-validation.js`
- `PMG-SPEC.md`

## Timeframe / domino state

`timeframe-domino.js` supports the timeframe ladder:

`Y -> Q -> M -> W -> D -> 60 -> 30 -> 15 -> 5`

Default convenience profiles:
- `LONG_TERM`: Y/Q/M/W/D
- `SWING`: M/W/D/60
- `SWING_WITH_ENTRY`: M/W/D/60/30/15
- `INTRADAY`: D/60/30/15/5

Profiles are presets only; custom timeframe groups remain allowed.

A lower timeframe becoming actionable does not automatically activate a higher timeframe. Each higher timeframe joins the chain only when its own trigger becomes in force. Thesis and execution timeframes remain separate.

## Integrated objective pipeline

`objective-pipeline.js` runs:

`SETUP-DEFINED MAGNITUDE -> STRUCTURAL RANGE QUALIFICATION -> TARGET HIERARCHY / EXACT DE-DUP -> OBJECTIVE STATE -> EXHAUSTION`

Verified safeguards include:
- setup-defined magnitude remains first;
- only structurally engaged broader ranges qualify;
- exact same-price targets can merge while preserving provenance;
- target order follows price path, not timeframe prestige;
- unengaged higher-timeframe ranges are not silently promoted;
- exhaustion occurs only after currently qualified structure is cleared.

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

Scenario grouping can later compare setup, direction, timeframe, FTFC, Minervini state, Elder state, market/sector alignment, exhaustion state, SSS50 involvement, price bucket, stop model, long-term alignment, PMG presence/level count, and combinations thereof.

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
- exhaustion is not a reversal signal;
- these tests validate implementation, not profitability or historical expectancy.

## Deferred automation note

Adaptive automated trade-management behavior remains outside the current deterministic research build. The architecture preserves thesis/execution states so a later management/automation layer can change management granularity without redefining the original setup.

## Next validation/build work

1. integrate PMG levels with the production target hierarchy/objective pipeline in a focused end-to-end fixture;
2. return to domino work: integrate actual setup objects emitted by the core engine rather than synthetic timeframe states;
3. validate historical lower-to-higher timeframe advancement on real charts;
4. validate outside-bar sequence resolution with lower-timeframe data;
5. add explicit timeframe/session/anchor metadata to the data model;
6. validate configurable timeframe groups on real charts, including Y/Q/M/W/D long-term groups;
7. connect a low-cost historical data adapter and begin broader audited scenario backtesting.

The Research Console remains in sample-data mode until the real-market validation and data-semantics layers are materially complete.
