# Engine Validation — v0.17

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
- Real-market validation exists for 2-2, 2-1-2, 3-1-2, and SSS50 examples.
- Research Console remains wired to `core-engine-v0.3.js` and remains in SAMPLE DATA mode.

## Timeframe / domino state — new in v0.17

`timeframe-domino.js` adds a timeframe-agnostic state model spanning long-term, swing, and intraday use without changing Strat rules by trading style.

Default supported ladder:

`Y -> Q -> M -> W -> D -> 60 -> 30 -> 15 -> 5`

Yearly and Quarterly are now first-class supported timeframe classes. They are available context and thesis frames, not mandatory filters.

Default convenience profiles:
- `LONG_TERM`: Y/Q/M/W/D
- `SWING`: M/W/D/60
- `SWING_WITH_ENTRY`: M/W/D/60/30/15
- `INTRADAY`: D/60/30/15/5

Profiles are only presets. Custom timeframe sets remain allowed.

### Domino semantics

A timeframe is active only when its own trigger is actually in force:
- bullish: current price strictly above trigger;
- bearish: current price strictly below trigger;
- equality is not in force.

A lower timeframe becoming actionable does **not** automatically activate a higher timeframe. If price later puts the higher-timeframe setup in force in the same direction, the engine records that higher timeframe as an advancement of the same directional thesis.

This is an observable multi-timeframe state chain, not a claim that one timeframe literally causes another.

The engine preserves separate:
- `thesisTimeframe`
- `executionTimeframe`
- per-timeframe setup/in-force state
- bullish and bearish active chains when they conflict

Holding duration remains an outcome field rather than redefining the setup.

### Focused validation

`tests/timeframe-domino-validation.js` reports **20/20 PASS locally** and verifies:
- Yearly/Quarterly/monthly/weekly/daily/intraday aliases and ordering;
- strict bullish/bearish in-force semantics;
- Y/Q/M/W/D long-term profile behavior;
- lower-timeframe activation without falsely activating Quarterly/Daily higher frames;
- separate thesis and execution timeframe identity;
- D/60/30/15/5 intraday compatibility;
- preservation of mixed-direction higher/lower timeframe states.

See:
- `timeframe-domino.js`
- `tests/timeframe-domino-validation.js`
- `TIMEFRAME-DOMINO-SPEC.md`

## Integrated multi-timeframe objective pipeline

`objective-pipeline.js` runs the production objective chain end to end:

`SETUP-DEFINED MAGNITUDE -> STRUCTURAL RANGE QUALIFICATION -> TARGET HIERARCHY / EXACT DE-DUP -> OBJECTIVE STATE -> EXHAUSTION`

The focused integration test covers both swing-style and intraday structures rather than assuming one fixed timeframe set.

Verified behavior includes:
- setup-defined magnitude remains first until reached;
- only structurally engaged broader ranges qualify;
- exact same-price targets can merge while preserving timeframe provenance;
- target order follows the price path rather than timeframe prestige;
- unengaged higher-timeframe ranges are not silently promoted;
- exhaustion occurs after currently qualified structure is cleared.

## Target hierarchy / de-duplication

`target-hierarchy.js` handles competing qualified targets after structural qualification.

Deterministic behavior:
1. objective order follows the actual price path, not timeframe prestige;
2. bullish targets sort nearest-to-farthest upward;
3. bearish targets sort nearest-to-farthest downward;
4. exact same-price qualified structures merge into one objective while preserving source provenance;
5. nearby-but-unequal prices are not silently merged;
6. optional proximity grouping is advisory only and requires an explicit caller-supplied tolerance.

## Structural target qualification

A candidate broader range qualifies only when:
1. it is valid and active;
2. it contains the setup/source range;
3. the required initiating side of that broader range has already been taken;
4. its opposite boundary extends beyond the setup-defined magnitude.

Direction symmetry:
- bullish broader target -> broader range `lowTaken === true`, target = broader range high;
- bearish broader target -> broader range `highTaken === true`, target = broader range low.

## Post-magnitude objective state

`magnitude.js` keeps the setup-defined first objective separate from raw pivots and qualified targets.

Production behavior:
- first objective is always setup-defined `magnitude`;
- raw directional pivots are not automatically promoted;
- only structurally qualified pivots/range boundaries can become post-magnitude targets;
- after magnitude is reached, the nearest remaining qualified target is promoted;
- consumed qualified targets are skipped;
- once magnitude and all currently-qualified targets are cleared, `exhaustionRisk = true`;
- exhaustion remains context only, never an automatic reversal signal.

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

Scenario grouping can later compare setup, direction, timeframe, FTFC, Minervini state, Elder state, market/sector alignment, exhaustion state, SSS50 involvement, price bucket, stop model, long-term timeframe alignment, and combinations thereof.

Every reported percentage must retain sample size. Exploratory findings must survive out-of-sample validation before being treated as useful evidence.

## Core safeguards still active

- completed Scenario 3 remains path-ambiguous unless lower-timeframe/tick sequence resolves direction;
- SSS50 midpoint confirmation is intrabar/live-price based, not close-confirmation based;
- magnitude = setup-defined first objective;
- targets = further structurally qualified objectives;
- raw pivots are not guaranteed targets;
- exact same target price can be merged while preserving source provenance;
- nearby target prices remain semantically separate unless a caller explicitly requests advisory grouping;
- timeframe size alone does not override price-path objective order;
- Yearly/Quarterly are supported but never required by default;
- a lower timeframe cannot falsely activate a higher timeframe;
- thesis and execution timeframe identity are stored separately;
- exhaustion is not a reversal signal;
- these tests validate implementation, not profitability or historical expectancy.

## Deferred automation note

Adaptive automated trade-management behavior is intentionally not part of the current deterministic research build. The architecture preserves separate thesis/execution states so a later management/automation layer could change management granularity without redefining the original setup.

## Next validation/build work

1. integrate domino state with actual setup objects emitted by the core engine rather than synthetic timeframe states;
2. validate historical lower-to-higher timeframe advancement on real charts;
3. validate outside-bar sequence resolution with lower-timeframe data;
4. add explicit timeframe/session/anchor metadata to the data model;
5. validate configurable timeframe groups on real charts, including Y/Q/M/W/D long-term groups;
6. connect a low-cost historical data adapter and begin broader audited scenario backtesting.

The Research Console remains in sample-data mode until the real-market validation and data-semantics layers are materially complete.
