# Engine Validation — v0.16

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
- Real-market validation exists for 2-2, 2-1-2, 3-1-2, and SSS50 examples.
- Research Console remains wired to `core-engine-v0.3.js` and remains in SAMPLE DATA mode.

## Integrated multi-timeframe objective pipeline — new in v0.16

`objective-pipeline.js` now runs the production objective chain end to end:

`SETUP-DEFINED MAGNITUDE -> STRUCTURAL RANGE QUALIFICATION -> TARGET HIERARCHY / EXACT DE-DUP -> OBJECTIVE STATE -> EXHAUSTION`

The focused integration test covers both a swing-style structure and an intraday structure rather than assuming one fixed timeframe set.

### Swing-style stack
Synthetic overlapping structures model a bullish setup inside Daily, Weekly, and Monthly ranges.

Verified behavior:
- setup-defined magnitude remains first until reached;
- engaged Daily and Weekly ranges qualify;
- an unengaged Monthly range is excluded even though its boundary is farther in the bullish direction;
- after magnitude, Daily target comes before Weekly because it is nearer in price;
- after Daily is consumed, Weekly promotes;
- after currently qualified Daily/Weekly structure is cleared, exhaustion becomes true;
- the unengaged Monthly boundary is not silently promoted after exhaustion.

### Exact higher-timeframe agreement
A Daily and Weekly range resolving to the exact same target price becomes one semantic objective while preserving both timeframe sources.

### Intraday/day-trading stack
Synthetic bearish structure models 30m, 60m, Daily, and Weekly ranges.

Verified behavior:
- the same engine works without changing rules;
- 30m and 60m exact agreement merges into one objective with both sources retained;
- Daily can remain a later valid extension;
- an unengaged Weekly range is excluded;
- after intraday targets are consumed, the Daily target promotes;
- exhaustion occurs after all currently engaged structures are cleared.

This confirms that the objective engine is timeframe-neutral: `M/W/D/60`, `D/60/30/15`, and other configured groups can use the same deterministic pipeline. Timeframe size alone never grants target priority.

See:
- `objective-pipeline.js`
- `tests/objective-pipeline-validation.js`
- `MULTI-TIMEFRAME-OBJECTIVE-PIPELINE.md`

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

Scenario grouping can later compare setup, direction, timeframe, FTFC, Minervini state, Elder state, market/sector alignment, exhaustion state, SSS50 involvement, price bucket, stop model, and combinations thereof.

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
- the objective pipeline supports both swing and intraday timeframe groups;
- exhaustion is not a reversal signal;
- these tests validate implementation, not profitability or historical expectancy.

## Deferred automation note

Adaptive automated trade-management behavior is intentionally not part of the current deterministic research build. The architecture can later keep separate `thesisTimeframe`, `executionTimeframe`, and `managementTimeframe` fields so an automation layer could change management granularity without redefining the original setup. This remains a later execution/automation layer, not current scope.

## Next validation/build work

1. implement and validate multi-timeframe domino state where a lower-timeframe setup triggers or advances a higher-timeframe setup;
2. validate outside-bar sequence resolution with lower-timeframe data;
3. add explicit timeframe/session anchor metadata to the data model;
4. validate configurable timeframe groups on real charts;
5. connect a low-cost historical data adapter and begin broader audited scenario backtesting.

The Research Console remains in sample-data mode until the real-market validation and data-semantics layers are materially complete.
