# Engine Validation — v0.20

Date: 2026-08-19

## Current status

- Legacy synthetic regression layer: **44/44 PASS** in the v0.2 expanded harness. Superseded semantics in that file remain historical only.
- Corrected core engine: **15/15 PASS** in `tests/core-engine-v0.3-validation.js`.
- Setup-specific first magnitude: **10/10 PASS** in `tests/setup-magnitude-validation-v0.1.js`.
- Research outcome/scenario layer: **20/20 PASS** in `tests/research-outcomes-validation.js`.
- Post-magnitude objective layer: deterministic behavior preserved; terminology exposes explicit `priceExhaustionRisk` while retaining `exhaustionRisk` as a temporary compatibility alias.
- Explicit time/price exhaustion layer: **21/21 PASS locally** in `tests/exhaustion-validation.js`.
- Structural target qualification layer: **19/19 PASS** in `tests/target-qualification-validation.js`.
- Target hierarchy / de-duplication layer: **18/18 PASS** in `tests/target-hierarchy-validation.js`.
- Integrated multi-timeframe objective pipeline: **20/20 PASS** in `tests/objective-pipeline-validation.js`.
- Timeframe/domino state layer: **20/20 PASS** in `tests/timeframe-domino-validation.js`.
- PMG geometry/actionable-state layer: **21/21 PASS** in `tests/pmg-validation.js`.
- Actionable signal lifecycle layer: **25/25 PASS locally** in `tests/signal-lifecycle-validation.js`.
- Real-market validation exists for 2-2, 2-1-2, 3-1-2, and SSS50 examples.
- Research Console remains wired to `core-engine-v0.3.js` and remains in SAMPLE DATA mode.

## TheStrat.ai documentation audit — expanded in v0.20

The free TheStrat.ai help material is being treated as a structured operational cross-check, not as a replacement for Rob Smith canonical rules.

Audit files:
- `research/THESTRAT-AI-DOC-AUDIT-v0.1.md`
- `research/THESTRAT-AI-DOC-AUDIT-v0.2.md`

The v0.2 pass confirms/refines:
- continuity = evidence, signal = timing, broadening formation = map/magnitude;
- lower-timeframe signals can time higher-timeframe moves without automatically activating the higher timeframe;
- actionable signals are time-bounded by the triggering bar;
- multiple active timeframes can remain independent carriers;
- magnitude completion is distinct from time expiration;
- `levelOfReclaim` is a required first-class field but its exact per-pattern formula remains under audit;
- 3-2 carries no magnitude of its own and must borrow a validated higher-timeframe objective;
- kicker is a gap/reversal context pattern that requires fast lower-timeframe reconfirmation and does not supply its own magnitude;
- PMG staircase terminology remains separate from the older `3-1-3` label until dedicated current source material resolves the naming.

Animations/diagrams are part of the audit evidence when accessible. If a particular embedded animation cannot be inspected reliably, request only that specific screen recording rather than the full library.

## Actionable signal lifecycle — new in v0.20

New module:
- `signal-lifecycle.js`

New focused harness:
- `tests/signal-lifecycle-validation.js`

Spec:
- `SIGNAL-LIFECYCLE-SPEC.md`

The lifecycle layer represents an actionable signal as a time-bounded state rather than a permanent setup flag.

States:
- `NOT_STARTED`
- `STANDBY`
- `ACTIVE`
- `EXPIRED`
- `COMPLETED`

Rules:
- bullish trigger is in force only when price is strictly above trigger;
- bearish trigger is in force only when price is strictly below trigger;
- equality is not in force;
- signal expires exactly when its triggering bar closes;
- setup-defined magnitude is preferred when present;
- explicit borrowed higher-timeframe magnitude is supported for future expansion setups such as 3-2;
- hitting magnitude marks the signal `COMPLETED` and removes it from active carrier state;
- `levelOfReclaim` is preserved if supplied but is not calculated yet;
- carrier timeframes include only currently active signals.

Focused validation executed locally with Node: **25/25 PASS**.

Validated behavior includes:
- strict bullish/bearish trigger symmetry;
- equality safeguards;
- magnitude completion at equality;
- setup magnitude precedence over borrowed magnitude;
- borrowed higher-timeframe magnitude handling;
- active, standby, not-started, expired, and completed states;
- exact bar-close expiration;
- elapsed/remaining percentage calculation;
- optional `levelOfReclaim` preservation;
- multiple active carrier timeframes;
- lower carrier expiration while higher carrier remains active;
- invalid signal time windows rejected.

## Exhaustion terminology

TheStrat.ai documentation distinguishes two concepts.

### Exhaustion by time
Mechanical question: how much time remains before the actionable signal's bar closes/expires?

`exhaustion.js` exposes exact elapsed/remaining time without inventing universal LOW/MEDIUM/HIGH thresholds.

### Exhaustion by price
Separate condition associated with completing magnitude / clearing currently active objective structure or entering fresh extremes.

`magnitude.js` exposes:
- `priceExhaustionRisk`
- legacy `exhaustionRisk` alias temporarily retained for dependent-module compatibility.

Time exhaustion and price exhaustion must never be treated as the same condition in research data or Trade Coach logic.

## PMG terminology safeguard

The current PMG staircase detector remains based on Sara's published scanner geometry and sequential higher-low/lower-high pivot structure.

TheStrat.ai current material also describes pivot-after-pivot travel through prior ranges as PMG fuel. One older/general setup-guide page labels `3-1-3` as "Pivot Machine Gun." Until dedicated current source material resolves that naming, keep separate:

- `PMG_STAIRCASE` = sequential higher lows / lower highs used as target structure;
- `3-1-3` = distinct setup/pattern identifier if implemented later.

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

The expanded signal path is now:

`CORE SETUP -> SIGNAL OBJECT -> SIGNAL LIFECYCLE -> DOMINO / CARRIER STATE -> OBJECTIVE / MANAGEMENT CONTEXT`

Time expiration is calculated independently from price completion.

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

Scenario fields need to distinguish:
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
- `3-1-3` is not silently aliased to PMG staircase geometry;
- exact same target price can merge while preserving source provenance;
- nearby unequal target prices remain semantically separate by default;
- timeframe size alone does not override price-path objective order;
- Yearly/Quarterly are supported but never required by default;
- a lower timeframe cannot falsely activate a higher timeframe;
- thesis and execution timeframe identity are stored separately;
- actionable signals expire with their triggering bars;
- completed signals are not active carriers;
- expansion setups may borrow magnitude only explicitly;
- `levelOfReclaim` formula is not invented before source validation;
- time exhaustion and price exhaustion are separate states;
- neither exhaustion type is an automatic reversal signal;
- these tests validate implementation, not profitability or historical expectancy.

## Next validation/build work

1. continue the TheStrat.ai audit, prioritizing dedicated Actionable Signals and Levels of Reclaim material/visuals;
2. integrate signal lifecycle metadata into actual core-engine setup objects;
3. integrate those real setup objects into the timeframe-domino carrier state;
4. integrate PMG levels with the production target hierarchy/objective pipeline in a focused end-to-end fixture;
5. validate historical lower-to-higher timeframe advancement on real charts;
6. add explicit timeframe/session/anchor metadata to the data model;
7. connect a low-cost historical data adapter and begin broader audited scenario backtesting.

The Research Console remains in sample-data mode until the real-market validation and data-semantics layers are materially complete.
