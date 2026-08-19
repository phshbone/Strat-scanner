# Engine Validation — v0.13

Date: 2026-08-19

## Current status

Synthetic deterministic layer: **PASS — 44/44 checks in the legacy v0.2 expanded harness.**

Corrected core-engine layer: **PASS — 15/15 focused checks in `tests/core-engine-v0.3-validation.js`.** This layer removes the old directional Scenario-3 conflation and uses the cleaned `midpointStop` / `magnitude` terminology.

Research Console integration layer: **WIRED.** `index.html` loads `core-engine-v0.3.js` as the deterministic source of truth instead of carrying the superseded inline setup engine.

Setup-specific first-magnitude layer: **ADDED — 10/10 focused checks pass locally.** `setup-magnitude.js` isolates the first objective for validated 2-2, 2-1-2, and 3-1-2 setup families from the later generic target stack.

Research outcome/scenario layer: **ADDED — 20/20 focused checks pass locally.** `research-outcomes.js` classifies magnitude-before-stop outcomes, preserves sequence ambiguity, calculates planned/realized R, summarizes win/loss rates, and compares arbitrary scenario groupings.

Real-market validation layers are in place for 2-2, 2-1-2, 3-1-2, and SSS50 examples.

Post-magnitude objective/exhaustion layer: **REFINED — 24/24 magnitude checks pass locally.** `magnitude.js` now distinguishes setup-defined magnitude from raw pivots and structurally qualified post-magnitude targets.

## Post-magnitude objective state — new in v0.13

The previous magnitude module could mechanically walk every directional pivot beyond the origin. That behavior is now explicitly separated into a legacy/raw helper and a production objective-state path.

Production behavior in `buildObjectiveState()`:
- first objective is always the setup/range-defined `magnitude`;
- raw directional pivots are not automatically promoted as targets;
- only pivots explicitly marked structurally relevant / target-eligible by the upstream structure layer may become post-magnitude targets;
- after magnitude is reached, the nearest remaining qualified target is promoted;
- consumed qualified targets are skipped and the next qualified target is promoted;
- when magnitude has been reached and the currently-qualified target structure is cleared, `exhaustionRisk = true`;
- if magnitude is reached and no further target has been structurally qualified, the state is exhausted for the currently known active structure;
- exhaustion remains context only and never creates an automatic reversal.

This directly prevents the engine from treating every visible prior high/low as a guaranteed next objective.

### Focused magnitude validation
`tests/magnitude-validation.js` now reports **24/24 PASS locally** and covers:
- raw bullish/bearish directional filtering;
- legacy target consumption/promotion regression behavior;
- explicit setup magnitude before later targets;
- exclusion of unqualified raw pivots;
- exclusion of wrong-side pivots;
- bullish and bearish structural-target promotion;
- consumption of qualified targets;
- exhaustion only after setup magnitude is reached and active qualified structure is cleared;
- no automatic promotion of an unqualified raw pivot after magnitude.

See `magnitude.js`, `tests/magnitude-validation.js`, and `MAGNITUDE-SPEC.md` v0.5.

## Real-market 2-2 validation — RM-002

### Bullish SPY daily 2-2, August 20 2021
- trigger = Aug 19 high 412.29
- first magnitude = Aug 18 high 415.55
- midpoint stop = 409.945
- magnitude reached Aug 23 before midpoint stop => **WIN**.

### Bearish SPY daily 2-2, August 26 2021
- trigger = Aug 25 low 418.49
- first magnitude = Aug 24 low 418.16
- midpoint stop = 419.28
- structure stop = 420.07
- Aug 26 traded through both magnitude and midpoint stop in the same daily bar => midpoint-stop scenario **AMBIGUOUS**;
- structure stop was not reached => structure-stop scenario **WIN**.

## Real-market 2-1-2 validation — RM-003

### Bearish SPY daily 2-1-2, November 9 2021
- trigger = Nov 8 low 438.99
- first magnitude = Nov 5 low 437.78
- midpoint-stop result from daily OHLC = **AMBIGUOUS**;
- structure-stop result = **WIN**.

### Bullish SPY daily 2-1-2, November 12 2021
- trigger = Nov 11 high 436.26
- first magnitude = Nov 10 high 438.22
- midpoint-stop result from daily OHLC = **AMBIGUOUS**;
- structure-stop result = **WIN**.

## Real-market 3-1-2 validation — RM-004

### Bearish SPY daily 3-1-2, November 17 2022
- Nov 15 = Scenario 3 / outside
- Nov 16 = inside
- Nov 17 = 2D
- trigger = 375.76
- first magnitude = 375.47
- midpoint stop = 377.185
- structure stop = 378.61
- magnitude reached with neither stop touched => **WIN under both stop models**.

## Research scenario infrastructure

Primary historical outcome:
- WIN = magnitude reached before stop;
- LOSS = stop reached before magnitude;
- AMBIGUOUS = both occurred but available data cannot establish order;
- OPEN/UNRESOLVED = no valid resolved result yet.

The scenario comparison engine can group preserved events by setup, direction, timeframe, FTFC, Minervini state, Elder state, market/sector alignment, exhaustion state, SSS50 involvement/entry mode, price bucket, stop model, and later combinations of those fields.

Every percentage must retain its sample size. Exploratory combinations are not promoted until they survive out-of-sample validation.

## Core correction: completed Scenario 3 is path-ambiguous

Correct behavior in `core-engine-v0.3.js`:
- a completed `3` proves both sides of the prior range traded;
- completed OHLC does not prove which side traded first;
- a `3` is not automatically classified as bullish or bearish reversal continuation;
- if lower-timeframe/tick path proves sequence, the caller may pass `currentBarPathDirection`;
- otherwise the engine returns `OUTSIDE PATH AMBIGUOUS` / `UNKNOWN`.

## Outside 50 correction

Outside 50 confirmation is a LIVE-PRICE / intrabar condition, not a candle-close confirmation.

## Magnitude terminology

- `magnitude` = first expected objective tied to the active setup/range;
- `targets` = further structurally qualified objectives beyond magnitude;
- `midpointStop` = optional management midpoint stop; do not confuse it with SSS50.

## Scope note

These checks validate rule implementation and research accounting. They do **not** establish profitability, expectancy, or a historical win rate.

## Next validation/build work

1. build the upstream structural-qualification layer that decides which broader pivots/ranges are eligible after magnitude;
2. validate competing higher-timeframe target hierarchy;
3. validate multi-timeframe domino sequences;
4. validate outside-bar sequence resolution with lower-timeframe data;
5. add explicit timeframe/session anchor metadata to the data model;
6. validate configurable timeframe groups on real charts;
7. connect a low-cost historical data adapter and begin broader audited scenario backtesting.

The Research Console remains in sample-data mode until the real-market validation and data-semantics layers are materially complete.
