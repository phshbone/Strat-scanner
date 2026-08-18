# Engine Validation — v0.4

Date: 2026-08-18

## Current status

Synthetic deterministic layer: **PASS — 44/44 checks in the v0.2 expanded harness.**

Real-market validation layer: **STARTED. RM-001 (SPY September 2021 Outside 50 / potential outside month) passes the stated rule geometry and sequence using consistent historical data.**

SSS50 operational-state layer: **ADDED.** The focused validator now models INVALID -> STANDBY -> ACTIVE -> COMPLETE in both bullish and bearish directions.

## Important correction discovered by real-market validation
The first real example exposed a semantic error in the focused Outside 50 implementation: the 50% condition is a LIVE-PRICE / intrabar condition, not a candle-close confirmation.

Correct behavior:
- live engine compares `currentPrice` with the previous candle midpoint after one side has been taken;
- lower-timeframe historical OHLC may prove that the threshold traded intrabar by using the bar high/low;
- coarse completed OHLC cannot always establish first-side ordering.

## SSS50 state clarification
Public implementation evidence further supports treating SSS50 as a progression rather than a single flag.

The Sarah-created TrendSpider scanner `Strat D 50% Rule Long` identifies the bullish active geometry as:
- current price/close above the middle of the previous daily range,
- current low below the previous low,
- current high still below the previous high.

That maps naturally to a failed 2D that has crossed 50% but has not yet completed the outside day.

The engine now records these states:
- `INVALID` — no failed-two condition yet,
- `STANDBY` — one side taken and failed back into prior range, midpoint not yet crossed,
- `ACTIVE` — failed two + prior midpoint crossed; opposite side is target,
- `COMPLETE` — both sides of prior candle taken.

See `tests/SSS50-STATE-MACHINE.md` and `tests/outside-50-rule-validation.js`.

## Synthetic coverage
- Scenario 1 / inside bar, including equality edges
- 2U, including equality at prior low
- 2D, including equality at prior high
- Scenario 3 / outside bar
- configurable FTFC group sizes
- neutral/tied FTFC state
- bullish and bearish 2-2 reversals
- bullish and bearish 2-1-2 reversals
- bullish and bearish 3-1-2 reversals
- pending inside-bar break
- bullish and bearish in-force behavior
- out-of-force behavior at the trigger
- midpoint stop calculation
- structure-stop calculation
- target-hit equality behavior
- time-exhaustion boundaries and clamping
- bullish and bearish Outside 50% confirmation
- Outside 50% non-confirmation before midpoint
- unknown outside-bar sequence when OHLC cannot reveal first side taken
- exhaustion state
- exhaustion + opposing reversal state
- Outside 50% target-active state
- Outside 50% target-hit state

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

See:
- `tests/real-example-spy-2021-09.js`
- `tests/REAL-MARKET-VALIDATION.md`

## Files
- `tests/engine-validation.js` — original core checks
- `tests/core-rule-validation-v0.2.js` — expanded 44-check synthetic harness; its embedded Outside 50 close-based helper is superseded by the corrected focused validator
- `tests/outside-50-rule-validation.js` — corrected focused Outside 50 checks using live-price / replay-range semantics plus explicit SSS50 states
- `tests/SSS50-STATE-MACHINE.md` — state-machine validation note
- `tests/real-example-spy-2021-09.js` — first real-market replay fixture
- `tests/REAL-MARKET-VALIDATION.md` — real-market validation log
- `tests/known-scenarios.json` — deterministic scenario fixtures
- `tests/KNOWN-SCENARIOS.md` — fixture documentation
- `tests/exhaustion-outside50-sequence.md` — exhaustion / reversal / Outside 50 sequence notes
- `OUTSIDE-50-RULE.md` — operational rule specification v0.3

## Scope note
These checks validate rule implementation. They do **not** establish profitability, expectancy, or general statistical edge.

## Next validation work
Continue with known real examples and historical OHLC to verify:
1. actionable 2-2 / 2-1-2 / 3-1-2 trigger selection,
2. live/in-force transitions,
3. pivot/magnitude selection,
4. price exhaustion after magnitude completion,
5. multi-timeframe domino sequences,
6. outside-bar sequence resolution with lower-timeframe data,
7. configurable timeframe groups on real charts.

The Research Console remains in sample-data mode until this layer is materially complete.
