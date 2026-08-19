# Engine Validation — v0.14

Date: 2026-08-19

## Current status

- Legacy synthetic regression layer: **44/44 PASS** in the v0.2 expanded harness. Superseded semantics in that file remain historical only.
- Corrected core engine: **15/15 PASS** in `tests/core-engine-v0.3-validation.js`.
- Setup-specific first magnitude: **10/10 PASS** in `tests/setup-magnitude-validation-v0.1.js`.
- Research outcome/scenario layer: **20/20 PASS** in `tests/research-outcomes-validation.js`.
- Post-magnitude objective/exhaustion layer: **24/24 PASS** in `tests/magnitude-validation.js`.
- Structural target qualification layer: **19/19 PASS** in `tests/target-qualification-validation.js`.
- Real-market validation exists for 2-2, 2-1-2, 3-1-2, and SSS50 examples.
- Research Console remains wired to `core-engine-v0.3.js` and remains in SAMPLE DATA mode.

## Structural target qualification — new in v0.14

The upstream qualification layer is now implemented in `target-qualification.js`.

Purpose: after the setup-defined first magnitude is reached, decide which broader ranges are structurally eligible to become additional targets before passing them into `magnitude.js`.

A candidate broader range qualifies only when:
1. it is valid and active;
2. it contains the setup/source range;
3. the required initiating side of that broader range has already been taken;
4. its opposite boundary extends beyond the setup-defined magnitude.

Direction symmetry:
- bullish broader target -> broader range `lowTaken === true`, target = broader range high;
- bearish broader target -> broader range `highTaken === true`, target = broader range low.

This encodes the sourced restriction that the engine must not project through a larger range merely because a farther pivot exists. If the larger range has not been structurally engaged, it is not promoted.

Qualified range boundaries are converted to target objects carrying:
- `structurallyRelevant: true`
- `eligibleTarget: true`
- `source: RANGE_BOUNDARY`

They feed directly into `magnitude.buildObjectiveState()`.

State progression is now:

`SETUP-DEFINED MAGNITUDE -> QUALIFIED BROADER TARGET(S) -> EXHAUSTION FOR CURRENT KNOWN STRUCTURE`

If no broader range qualifies after magnitude is reached, the engine marks exhaustion for the currently known active structure rather than inventing a farther target. A later structural change may qualify a new range and rebuild objective state.

### Focused structural validation

`tests/target-qualification-validation.js` reports **19/19 PASS locally** and verifies:
- strict broader-range containment;
- rejection of partial overlap;
- rejection of an identical range as a broader range;
- bullish/bearish initiating-side prerequisites;
- exclusion of inactive and invalid ranges;
- exclusion when the candidate boundary does not extend past magnitude;
- nearest eligible boundary ordering;
- direct integration into `magnitude.js`;
- target consumption and promotion;
- no silent promotion of an unengaged higher-timeframe range;
- exhaustion after all currently-qualified structures are cleared.

See:
- `target-qualification.js`
- `tests/target-qualification-validation.js`
- `TARGET-QUALIFICATION-SPEC.md`
- `magnitude.js`

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
- exhaustion is not a reversal signal;
- these tests validate implementation, not profitability or historical expectancy.

## Next validation/build work

1. validate competing higher-timeframe target hierarchy when multiple qualified ranges overlap or share near-identical boundaries;
2. add deterministic target de-duplication rules for same/near-same levels across timeframes;
3. validate multi-timeframe domino sequences;
4. validate outside-bar sequence resolution with lower-timeframe data;
5. add explicit timeframe/session anchor metadata to the data model;
6. validate configurable timeframe groups on real charts;
7. connect a low-cost historical data adapter and begin broader audited scenario backtesting.

The Research Console remains in sample-data mode until the real-market validation and data-semantics layers are materially complete.
