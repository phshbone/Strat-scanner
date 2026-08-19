# Engine Validation — v0.12

Date: 2026-08-19

## Current status

Synthetic deterministic layer: **PASS — 44/44 checks in the legacy v0.2 expanded harness.**

Corrected core-engine layer: **PASS — 15/15 focused checks in `tests/core-engine-v0.3-validation.js`.** This layer removes the old directional Scenario-3 conflation and uses the cleaned `midpointStop` / `magnitude` terminology.

Research Console integration layer: **WIRED.** `index.html` loads `core-engine-v0.3.js` as the deterministic source of truth instead of carrying the superseded inline setup engine.

Setup-specific first-magnitude layer: **ADDED — 10/10 focused checks pass locally.** `setup-magnitude.js` isolates the first objective for validated 2-2, 2-1-2, and 3-1-2 setup families from the later generic target stack.

Research outcome/scenario layer: **ADDED — 20/20 focused checks pass locally.** `research-outcomes.js` classifies magnitude-before-stop outcomes, preserves sequence ambiguity, calculates planned/realized R, summarizes win/loss rates, and compares arbitrary scenario groupings.

Real-market 2-2 validation layer: **ADDED.** `tests/real-example-spy-2021-08-2-2.js` validates bullish and bearish SPY daily 2-2 sequences from August 2021, including first-magnitude selection and stop-model/path-resolution differences.

Real-market 2-1-2 validation layer: **ADDED.** `tests/real-example-spy-2021-11-2-1-2.js` validates one bearish and one bullish SPY daily 2-1-2 sequence from November 2021, including first magnitude, midpoint-stop ambiguity, and structure-stop comparison.

Real-market 3-1-2 validation layer: **ADDED.** `tests/real-example-spy-2022-11-3-1-2.js` validates a clean bearish SPY daily 3-1-2 sequence from November 2022. The source OHLC independently confirms Scenario 3 -> inside -> 2D, first magnitude, and that magnitude was reached without either stop being touched on the signal bar.

Real-market validation also includes RM-001 (SPY September 2021 Outside 50 / potential outside month), which passes the stated rule geometry and sequence using consistent historical data.

SSS50 operational-state layer: **ADDED.** The focused validator models INVALID -> STANDBY -> ACTIVE -> COMPLETE in both bullish and bearish directions.

Magnitude target-stack layer: **ADDED — 11/11 deterministic checks pass locally.** The engine can maintain a directional stack of already-validated pivots, consume objectives as price reaches them, promote the next objective, and flag exhaustion when no directional targets remain.

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
- Nov 5 = 2U
- Nov 8 = inside (`1`)
- Nov 9 = 2D
- trigger = Nov 8 low 438.99
- first magnitude = Nov 5 low 437.78
- midpoint stop = 439.94
- structure stop = 440.89
- Nov 9 traded through both magnitude and midpoint stop in the same daily bar => midpoint-stop scenario **AMBIGUOUS**;
- structure stop was not reached => structure-stop scenario **WIN**.

### Bullish SPY daily 2-1-2, November 12 2021
- Nov 10 = 2D
- Nov 11 = inside (`1`)
- Nov 12 = 2U
- trigger = Nov 11 high 436.26
- first magnitude = Nov 10 high 438.22
- midpoint stop = 435.535
- structure stop = 434.81
- Nov 12 traded through both magnitude and midpoint stop in the same daily bar => midpoint-stop scenario **AMBIGUOUS**;
- structure stop was not reached => structure-stop scenario **WIN**.

These cases reinforce an important backtest rule: coarse daily OHLC must not force an intrabar ordering when both stop and magnitude occur in the same bar.

## Real-market 3-1-2 validation — RM-004

### Bearish SPY daily 3-1-2, November 17 2022
Using adjusted StatMuse daily OHLC:
- Nov 14: H 380.89 / L 375.80
- Nov 15: H 382.92 / L 375.47 => Scenario 3 / outside vs Nov 14
- Nov 16: H 378.61 / L 375.76 => Scenario 1 / inside vs Nov 15
- Nov 17: H 375.91 / L 371.33 => 2D vs Nov 16

Engine geometry:
- setup = bearish `3-1-2`
- trigger = Nov 16 low 375.76
- first magnitude = Nov 15 low 375.47
- midpoint stop = 377.185
- structure stop = 378.61

Outcome:
- Nov 17 traded below first magnitude;
- Nov 17 high remained below both stop levels;
- midpoint-stop scenario = **WIN**;
- structure-stop scenario = **WIN**;
- no lower-timeframe path resolution is needed for this case.

See `tests/real-example-spy-2022-11-3-1-2.js` and `tests/REAL-MARKET-3-1-2.md`.

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

1. validate price exhaustion immediately after setup-defined magnitude completion;
2. validate promotion from completed magnitude to only structurally valid additional targets;
3. validate multi-timeframe domino sequences;
4. validate outside-bar sequence resolution with lower-timeframe data;
5. validate configurable timeframe groups on real charts;
6. connect a low-cost historical data adapter and begin broader audited scenario backtesting.

The Research Console remains in sample-data mode until the real-market validation layer is materially complete.
