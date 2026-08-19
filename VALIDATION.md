# Engine Validation — v0.10

Date: 2026-08-19

## Current status

Synthetic deterministic layer: **PASS — 44/44 checks in the legacy v0.2 expanded harness.**

Corrected core-engine layer: **PASS — 15/15 focused checks in `tests/core-engine-v0.3-validation.js`.** This layer removes the old directional Scenario-3 conflation and uses the cleaned `midpointStop` / `magnitude` terminology.

Research Console integration layer: **WIRED.** `index.html` loads `core-engine-v0.3.js` as the deterministic source of truth instead of carrying the superseded inline setup engine.

Setup-specific first-magnitude layer: **ADDED — 10/10 focused checks pass locally.** `setup-magnitude.js` isolates the first objective for validated 2-2, 2-1-2, and 3-1-2 setup families from the later generic target stack.

Research outcome/scenario layer: **ADDED — 20/20 focused checks pass locally.** `research-outcomes.js` classifies magnitude-before-stop outcomes, preserves sequence ambiguity, calculates planned/realized R, summarizes win/loss rates, and compares arbitrary scenario groupings.

Real-market 2-2 validation layer: **ADDED — 23/23 focused checks pass locally.** `tests/real-example-spy-2021-08-2-2.js` validates one bullish and one bearish SPY daily 2-2 sequence from August 2021, including first-magnitude selection and stop-model/path-resolution differences.

Real-market validation layer also includes RM-001 (SPY September 2021 Outside 50 / potential outside month), which passes the stated rule geometry and sequence using consistent historical data.

SSS50 operational-state layer: **ADDED.** The focused validator models INVALID -> STANDBY -> ACTIVE -> COMPLETE in both bullish and bearish directions.

Magnitude target-stack layer: **ADDED — 11/11 deterministic checks pass locally.** The engine can maintain a directional stack of already-validated pivots, consume objectives as price reaches them, promote the next objective, and flag exhaustion when no directional targets remain.

## Real-market 2-2 validation — RM-002

### Bullish SPY daily 2-2, August 20 2021
The engine identifies:
- Aug 19 as the active 2D reference bar;
- Aug 20 as the reversing 2U;
- trigger = Aug 19 high 412.29;
- first magnitude = Aug 18 high 415.55;
- midpoint stop = 409.945.

Aug 20 did not reach the magnitude or midpoint stop. Aug 23 reached the magnitude. Outcome under the midpoint-stop model: **WIN**.

### Bearish SPY daily 2-2, August 26 2021
The engine identifies:
- Aug 25 as the active 2U reference bar;
- Aug 26 as the reversing 2D;
- trigger = Aug 25 low 418.49;
- first magnitude = Aug 24 low 418.16;
- midpoint stop = 419.28;
- structure stop = 420.07.

The Aug 26 daily bar traded through both the magnitude and midpoint stop. Daily OHLC cannot establish their order, so the midpoint-stop scenario is **AMBIGUOUS**. The same bar did not reach the structure stop, so the structure-stop scenario is **WIN**.

This confirms two important research behaviors:
1. first magnitude for these real 2-2 cases matches the setup-defined source range used by the engine;
2. stop-model comparison can materially change outcome classification, and coarse OHLC must not force a result when sequence is unknown.

See:
- `tests/real-example-spy-2021-08-2-2.js`
- `tests/REAL-MARKET-VALIDATION.md`

## Research scenario infrastructure

The historical research layer has an explicit outcome model instead of treating "success rate" as an undefined percentage.

Primary outcome:
- WIN = magnitude reached before stop;
- LOSS = stop reached before magnitude;
- AMBIGUOUS = both occurred but available data cannot establish order;
- OPEN/UNRESOLVED = no valid resolved result yet.

The scenario comparison engine can group the same preserved event set by any fields supplied to it, including later combinations such as:
- setup;
- direction;
- timeframe;
- FTFC;
- Minervini state;
- Elder state;
- market/sector alignment;
- exhaustion state;
- SSS50 involvement/entry mode;
- price bucket;
- stop model.

Every percentage must retain its sample size. Exploratory combinations are not promoted until they survive out-of-sample validation.

## Research Console v0.2 integration correction

The live sample console:
- loads `core-engine-v0.3.js` directly;
- no longer contains the old inline `detectSetup()` logic that treated a completed Scenario 3 as automatically bullish or bearish;
- displays `OUTSIDE PATH AMBIGUOUS` when completed OHLC cannot establish sequence;
- accepts optional `currentBarPathDirection` only when lower-timeframe/tick evidence establishes which side broke first;
- displays **Magnitude** for the setup-defined first objective;
- displays **Midpoint Stop** to distinguish the management midpoint from Sarah's SSS50 / 50% Potential Outside rule;
- displays explicit path-resolution state in the Monitor view;
- remains in SAMPLE DATA mode.

## Setup-specific first magnitude

For the currently validated setup families:
- bullish 2-2 -> source-range high;
- bearish 2-2 -> source-range low;
- bullish 2-1-2 -> source-range high;
- bearish 2-1-2 -> source-range low;
- bullish 3-1-2 -> source-range high;
- bearish 3-1-2 -> source-range low.

The selector returns `null` for unsupported setup families, missing source ranges, or unresolved direction instead of inventing an objective.

## Core correction: completed Scenario 3 is path-ambiguous

Correct behavior in `core-engine-v0.3.js`:
- a completed `3` proves both sides of the prior range traded;
- completed OHLC does not prove which side traded first;
- therefore a `3` is not automatically classified as bullish or bearish reversal continuation;
- if lower-timeframe/tick path proves sequence, the caller may pass `currentBarPathDirection` and resolve the setup;
- otherwise the engine returns `OUTSIDE PATH AMBIGUOUS` / `UNKNOWN`.

## Outside 50 correction

Outside 50 confirmation is a LIVE-PRICE / intrabar condition, not a candle-close confirmation.

Correct behavior:
- live engine compares `currentPrice` with the previous candle midpoint after one side has been taken;
- lower-timeframe historical OHLC may prove that the threshold traded intrabar by using the bar high/low;
- coarse completed OHLC cannot always establish first-side ordering.

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

## Scope note

These checks validate rule implementation and research accounting. They do **not** establish profitability, expectancy, or a historical win rate.

## Next validation work

1. build real historical OHLC fixtures for 2-1-2 and confirm first magnitude;
2. repeat for 3-1-2;
3. feed those events through the outcome engine under midpoint-stop and structure-stop scenarios;
4. validate price exhaustion after magnitude completion;
5. validate multi-timeframe domino sequences;
6. validate outside-bar sequence resolution with lower-timeframe data;
7. validate configurable timeframe groups on real charts;
8. connect a low-cost historical data adapter and begin broader audited scenario backtesting.

The Research Console remains in sample-data mode until the real-market validation layer is materially complete.
