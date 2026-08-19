# Engine Validation — v0.15

Date: 2026-08-19

## Current status

- Legacy synthetic regression layer: **44/44 PASS** in the v0.2 expanded harness. Superseded semantics in that file remain historical only.
- Corrected core engine: **15/15 PASS** in `tests/core-engine-v0.3-validation.js`.
- Setup-specific first magnitude: **10/10 PASS** in `tests/setup-magnitude-validation-v0.1.js`.
- Research outcome/scenario layer: **20/20 PASS** in `tests/research-outcomes-validation.js`.
- Post-magnitude objective/exhaustion layer: **24/24 PASS** in `tests/magnitude-validation.js`.
- Structural target qualification layer: **19/19 PASS** in `tests/target-qualification-validation.js`.
- Target hierarchy / de-duplication layer: **18/18 PASS** in `tests/target-hierarchy-validation.js`.
- Real-market validation exists for 2-2, 2-1-2, 3-1-2, and SSS50 examples.
- Research Console remains wired to `core-engine-v0.3.js` and remains in SAMPLE DATA mode.

## Target hierarchy / de-duplication — new in v0.15

`target-hierarchy.js` now handles competing qualified targets after structural qualification.

Deterministic behavior:
1. objective order follows the actual price path, not timeframe prestige;
2. bullish targets sort nearest-to-farthest upward;
3. bearish targets sort nearest-to-farthest downward;
4. multiple qualified structures at the exact same price are merged into one objective level;
5. merged levels preserve all source ids, timeframes, range ids, and source count;
6. a merged exact level is considered consumed only when all contributing sources are consumed;
7. nearby-but-unequal prices are **not** silently merged by default;
8. optional near-price grouping requires an explicit caller-supplied absolute-price tolerance and is advisory/display-only;
9. proximity clustering does not alter target prices, structural validity, consumption state, or target order.

This avoids two opposite errors:
- showing duplicate Daily/Weekly/Monthly lines when they resolve to the exact same objective;
- inventing an arbitrary cents/percent/ATR tolerance that would collapse distinct nearby objectives without source support.

A higher timeframe does not automatically leapfrog a nearer qualified lower-timeframe target. Higher-timeframe agreement at the same exact level is preserved as supporting evidence rather than assigned an arbitrary weight.

### Focused target-hierarchy validation

`tests/target-hierarchy-validation.js` reports **18/18 PASS locally** and verifies:
- bullish and bearish path ordering;
- exact-price de-duplication;
- preservation of supporting timeframe/range provenance;
- conservative consumed-state handling;
- objective numbering;
- next-target selection after consumed levels;
- exact-only default behavior;
- caller-controlled nearby-price clustering;
- advisory clusters never merging semantic objectives;
- invalid direction and negative tolerance rejection.

See:
- `target-hierarchy.js`
- `tests/target-hierarchy-validation.js`
- `TARGET-HIERARCHY-SPEC.md`

## Structural target qualification

The upstream qualification layer is implemented in `target-qualification.js`.

A candidate broader range qualifies only when:
1. it is valid and active;
2. it contains the setup/source range;
3. the required initiating side of that broader range has already been taken;
4. its opposite boundary extends beyond the setup-defined magnitude.

Direction symmetry:
- bullish broader target -> broader range `lowTaken === true`, target = broader range high;
- bearish broader target -> broader range `highTaken === true`, target = broader range low.

This encodes the restriction that the engine must not project through a larger range merely because a farther pivot exists. If the larger range has not been structurally engaged, it is not promoted.

Qualified boundaries feed through the target-hierarchy layer before entering the production objective state.

State progression is now:

`SETUP-DEFINED MAGNITUDE -> QUALIFIED BROADER TARGETS -> HIERARCHY / DE-DUP -> OBJECTIVE STATE -> EXHAUSTION`

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
- exhaustion is not a reversal signal;
- these tests validate implementation, not profitability or historical expectancy.

## Next validation/build work

1. validate the full structural pipeline on overlapping multi-timeframe examples: qualification -> hierarchy -> objective state;
2. validate multi-timeframe domino sequences where a lower-timeframe setup triggers or advances a higher-timeframe setup;
3. validate outside-bar sequence resolution with lower-timeframe data;
4. add explicit timeframe/session anchor metadata to the data model;
5. validate configurable timeframe groups on real charts;
6. connect a low-cost historical data adapter and begin broader audited scenario backtesting.

The Research Console remains in sample-data mode until the real-market validation and data-semantics layers are materially complete.
