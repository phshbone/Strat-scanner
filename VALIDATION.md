# Engine Validation — v0.1

Date: 2026-08-18

Status: **PASS — 20/20 deterministic checks**

Validated against controlled OHLC fixtures:

- Scenario 1 / inside bar
- 2U
- 2D
- Scenario 3 / outside bar
- FTFC 4/4 bullish
- FTFC 3/4 bearish
- Bullish 2-2 reversal
- Bearish 2-2 reversal
- Bullish 2-2 in-force state
- Bearish 2-2 in-force state
- 50% stop calculation
- Bullish structure stop
- Bearish structure stop
- Bullish 2-1-2 reversal
- Bearish 2-1-2 reversal
- Bullish 3-1-2 reversal
- Pending inside-bar break
- Time exhaustion LOW
- Time exhaustion MEDIUM
- Time exhaustion HIGH

## Scope note

These are deterministic unit checks using synthetic OHLC examples. They verify that the implementation returns the expected rule outputs for controlled inputs. They do **not** establish profitability, historical expectancy, or correctness against every real-market edge case.

## Next validation layer

Use known examples from Rob Smith / Sarah / Alex material and real historical OHLC to verify:

1. exact trigger and target selection,
2. live/in-force transitions,
3. ambiguous outside-bar sequencing using lower-timeframe data,
4. pivot/magnitude selection,
5. price exhaustion,
6. configurable timeframe groups.

The Research Console remains in sample-data mode until this next layer is complete.
