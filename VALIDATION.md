# Engine Validation — v0.8

Date: 2026-08-19

## Current status

Synthetic deterministic layer: **PASS — 44/44 checks in the legacy v0.2 expanded harness.**

Corrected core-engine layer: **PASS — 15/15 focused checks in `tests/core-engine-v0.3-validation.js`.** This layer removes the old directional Scenario-3 conflation and uses the cleaned `midpointStop` / `magnitude` terminology.

Research Console integration layer: **WIRED.** `index.html` loads `core-engine-v0.3.js` as the deterministic source of truth instead of carrying the superseded inline setup engine.

Setup-specific first-magnitude layer: **ADDED — 10/10 focused checks pass locally.** `setup-magnitude.js` now isolates the first objective for validated 2-2, 2-1-2, and 3-1-2 setup families from the later generic target stack.

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
- displays **Midpoint Stop** to distinguish the management midpoint from Sarah's SSS50 / 50% Potential Outside rule;
- displays explicit path-resolution state in the Monitor view;
- remains in SAMPLE DATA mode.

## Setup-specific first magnitude

A separate selector now expresses the sourced setup geometry before the general pivot stack is considered.

For the currently validated setup families:
- bullish 2-2 -> source-range high;
- bearish 2-2 -> source-range low;
- bullish 2-1-2 -> source-range high;
- bearish 2-1-2 -> source-range low;
- bullish 3-1-2 -> source-range high;
- bearish 3-1-2 -> source-range low.

The selector returns `null` for unsupported setup families, missing source ranges, or unresolved direction instead of inventing an objective.

See:
- `setup-magnitude.js`
- `tests/setup-magnitude-validation-v0.1.js`
- `tests/SETUP-MAGNITUDE-VALIDATION.md`

## Core correction: completed Scenario 3 is path-ambiguous

Correct behavior in `core-engine-v0.3.js`:
- a completed `3` proves both sides of the prior range traded;
- completed OHLC does not prove which side traded first;
- therefore a `3` is not automatically classified as bullish or bearish reversal continuation;
- if lower-timeframe/tick path proves sequence, the caller may pass `currentBarPathDirection` and resolve the setup;
- otherwise the engine returns `OUTSIDE PATH AMBIGUOUS` / `UNKNOWN`.

## Important correction discovered by real-market validation

Outside 50 confirmation is a LIVE-PRICE / intrabar condition, not a candle-close confirmation.

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
- `midpointStop` = optional management midpoint stop; do not confuse it with SSS50.

The magnitude system is split into three responsibilities:
1. **Setup-specific first magnitude** — deterministic for the currently validated setup families.
2. **Pivot/target identification** — source-backed rules are substantially locked; real-chart validation continues.
3. **Target-stack mechanics** — deterministic and tested.

Exhaustion remains context only, not an automatic reversal signal.

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

## Scope note

These checks validate rule implementation. They do **not** establish profitability, expectancy, or general statistical edge.

## Next validation work

1. build real historical OHLC fixtures for 2-2 and confirm the selected source range / first magnitude;
2. repeat for 2-1-2;
3. repeat for 3-1-2;
4. validate price exhaustion after magnitude completion;
5. validate multi-timeframe domino sequences;
6. validate outside-bar sequence resolution with lower-timeframe data;
7. validate configurable timeframe groups on real charts;
8. then connect a low-cost historical data adapter for broader backtesting.

The Research Console remains in sample-data mode until this layer is materially complete.
