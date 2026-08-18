# Engine Validation — v0.2

Date: 2026-08-18

Status: **PASS — 44/44 deterministic checks in expanded core validation**

Validated with controlled synthetic OHLC/state fixtures. This layer now covers:

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

Files:

- `tests/engine-validation.js` — original core checks
- `tests/core-rule-validation-v0.2.js` — expanded 44-check validation harness
- `tests/outside-50-rule-validation.js` — focused SSS50 checks
- `tests/known-scenarios.json` — deterministic scenario fixtures
- `tests/KNOWN-SCENARIOS.md` — fixture documentation
- `tests/exhaustion-outside50-sequence.md` — exhaustion / reversal / Outside 50 sequence notes
- `OUTSIDE-50-RULE.md` — operational rule specification

## Scope note

These are deterministic unit checks using synthetic OHLC/state examples. They verify that the implementation returns the expected rule outputs for controlled inputs. They do **not** establish profitability, historical expectancy, or correctness against every real-market edge case.

The expanded v0.2 harness was executed locally with Node and returned **44 pass / 0 fail** before being committed.

## Next validation layer

Use known examples from Rob Smith / Sarah / Alex material and real historical OHLC to verify:

1. exact trigger and target selection on real charts,
2. live/in-force transitions,
3. ambiguous outside-bar sequencing using lower-timeframe data,
4. pivot/magnitude selection,
5. price exhaustion after magnitude completion,
6. configurable timeframe groups,
7. Outside 50% behavior in real multi-timeframe sequences,
8. lower-timeframe actionable entries that drive higher-timeframe objectives.

The Research Console remains in sample-data mode until this next layer is complete.
