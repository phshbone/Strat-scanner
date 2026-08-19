# Engine Validation — v0.7

Date: 2026-08-19

## Current status

Synthetic deterministic layer: **PASS — 44/44 checks in the legacy v0.2 expanded harness.**

Corrected core-engine layer: **PASS — 15/15 focused checks in `tests/core-engine-v0.3-validation.js`.** This layer removes the old directional Scenario-3 conflation and uses the cleaned `midpointStop` / `magnitude` terminology.

Research Console integration layer: **WIRED.** `index.html` now loads `core-engine-v0.3.js` as the deterministic source of truth instead of carrying the superseded inline setup engine.

Real-market validation layer: **STARTED. RM-001 (SPY September 2021 Outside 50 / potential outside month) passes the stated rule geometry and sequence using consistent historical data.**

SSS50 operational-state layer: **ADDED.** The focused validator models INVALID -> STANDBY -> ACTIVE -> COMPLETE in both bullish and bearish directions.

Magnitude target-stack layer: **ADDED — 11/11 deterministic checks pass locally.** The engine can maintain a directional stack of already-validated pivots, consume objectives as price reaches them, promote the next objective, and flag exhaustion when no directional targets remain.

## Research Console v0.2 integration correction

The live sample console now:
- loads `core-engine-v0.3.js` directly;
- no longer contains the old inline `detectSetup()` logic that treated a completed Scenario 3 as automatically bullish or bearish;
- displays `OUTSIDE PATH AMBIGUOUS` when completed OHLC cannot establish sequence;
- accepts optional `currentBarPathDirection` only when lower-timeframe/tick evidence establishes which side broke first;
- displays **Magnitude** rather than generic T1/target wording for the setup-defined first objective;
- displays **Midpoint Stop** rather than `50% stop`, keeping it distinct from Sarah's SSS50 rule;
- displays explicit path-resolution state in the Monitor view;
- keeps the console in SAMPLE DATA mode.

The browser-side inline UI script was syntax-checked before commit.

## Core correction: completed Scenario 3 is path-ambiguous

Correct behavior in `core-engine-v0.3.js`:
- a completed `3` proves both sides of the prior range traded;
- completed OHLC does not prove which side traded first;
- therefore a `3` is not automatically classified as bullish or bearish reversal continuation;
- if lower-timeframe/tick path proves sequence, the caller may pass `currentBarPathDirection` and resolve the setup;
- otherwise the engine returns `OUTSIDE PATH AMBIGUOUS` / `UNKNOWN`.

This aligns the core engine with the same sequence discipline already used for failed-2 / SSS50 historical replay.

## Important correction discovered by real-market validation

The first real example exposed a semantic error in the focused Outside 50 implementation: the 50% condition is a LIVE-PRICE / intrabar condition, not a candle-close confirmation.

Correct behavior:
- live engine compares `currentPrice` with the previous candle midpoint after one side has been taken;
- lower-timeframe historical OHLC may prove that the threshold traded intrabar by using the bar high/low;
- coarse completed OHLC cannot always establish first-side ordering.

## SSS50 state clarification

The engine records:
- `INVALID` — no failed-two condition yet,
- `STANDBY` — one side taken and failed back into prior range, midpoint not yet crossed,
- `ACTIVE` — failed two + prior midpoint crossed; opposite side is target,
- `COMPLETE` — both sides of prior candle taken.

## Magnitude / pivot-stack clarification

Terminology:
- `magnitude` = first expected objective tied to the active setup/range;
- `targets` = further valid objectives beyond magnitude;
- `midpointStop` = optional management midpoint stop; do not call it the 50% rule.

The magnitude engine is split into two responsibilities:
1. **Pivot/setup objective identification** — source-backed rules are substantially locked from Rob Smith and Alex material; real-chart validation continues.
2. **Target-stack mechanics** — deterministic and tested.

Given an origin price, direction, and list of validated pivots:
- bullish stack = pivots above origin, nearest first;
- bearish stack = pivots below origin, nearest first;
- reached objectives are consumed;
- next remaining objective is promoted;
- no remaining directional pivots => `exhaustionRisk = true`.

Exhaustion is context only, not an automatic reversal signal.

## Synthetic coverage

- Scenario 1 / inside bar, including equality edges
- 2U, including equality at prior low
- 2D, including equality at prior high
- Scenario 3 / outside bar
- completed Scenario-3 path ambiguity
- path-resolved bullish and bearish 3 transitions
- configurable FTFC group sizes
- neutral/tied FTFC state
- bullish and bearish 2-2 reversals
- bullish and bearish 2-1-2 reversals
- bullish and bearish 3-1-2 reversals
- pending inside-bar break
- bullish and bearish in-force behavior
- strict out-of-force behavior at the trigger
- midpoint-stop calculation
- structure-stop calculation
- magnitude-hit equality behavior
- time-exhaustion boundaries and clamping
- bullish and bearish Outside 50% confirmation
- Outside 50% non-confirmation before midpoint
- unknown outside-bar sequence when OHLC cannot reveal first side taken
- exhaustion state
- exhaustion + opposing reversal state
- Outside 50% target-active state
- Outside 50% target-hit state
- bullish and bearish directional pivot-stack ordering
- target consumption and promotion
- exhaustion after directional stack is cleared

## Real-market case RM-001 — SPY September 2021

Using a consistent adjusted StatMuse series:
- August high 423.44
- August low 407.58
- midpoint 415.51
- September 2 high 424.36 => prior high taken
- September 13 low 415.07 => midpoint crossed intraday
- September 13 close 417.38 => back above midpoint, proving close confirmation must not be required
- September 20 low 402.10 => prior-month low target taken

A separate unadjusted monthly series corroborates the outside-month geometry. Adjustment conventions differ, so adjusted and unadjusted prices must never be mixed inside one calculation.

## Files

- `index.html` — Research Console v0.2, now wired to corrected core engine
- `core-engine-v0.3.js` — corrected core engine; Scenario-3 direction requires path evidence
- `tests/core-engine-v0.3-validation.js` — 15 focused checks for path ambiguity, setup preservation, strict in-force semantics, magnitude, and midpoint-stop terminology
- `tests/engine-validation.js` — original core checks
- `tests/core-rule-validation-v0.2.js` — legacy expanded 44-check synthetic harness; retained for regression history, but its completed-3 directional shortcuts and embedded Outside 50 close-based helper are superseded
- `tests/outside-50-rule-validation.js` — corrected focused Outside 50 checks using live-price / replay-range semantics plus explicit SSS50 states
- `tests/SSS50-STATE-MACHINE.md` — state-machine validation note
- `tests/real-example-spy-2021-09.js` — first real-market replay fixture
- `tests/REAL-MARKET-VALIDATION.md` — real-market validation log
- `tests/known-scenarios.json` — deterministic scenario fixtures
- `tests/KNOWN-SCENARIOS.md` — fixture documentation
- `tests/exhaustion-outside50-sequence.md` — exhaustion / reversal / Outside 50 sequence notes
- `OUTSIDE-50-RULE.md` — operational rule specification
- `magnitude.js` — deterministic target-stack engine
- `tests/magnitude-validation.js` — magnitude stack tests
- `MAGNITUDE-SPEC.md` — source-backed magnitude/pivot specification

## Scope note

These checks validate rule implementation. They do **not** establish profitability, expectancy, or general statistical edge.

## Next validation work

1. validate setup-specific first magnitude on real 2-2 examples;
2. validate setup-specific first magnitude on real 2-1-2 examples;
3. validate setup-specific first magnitude on real 3-1-2 examples;
4. validate price exhaustion after magnitude completion;
5. validate multi-timeframe domino sequences;
6. validate outside-bar sequence resolution with lower-timeframe data;
7. validate configurable timeframe groups on real charts;
8. then connect a low-cost historical data adapter for broader backtesting.

The Research Console remains in sample-data mode until this layer is materially complete.
