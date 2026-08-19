# Real-Market 3-1-2 Validation — RM-004

Historical source: adjusted SPY daily OHLC from StatMuse for November 2022.

Code fixture: `tests/real-example-spy-2022-11-3-1-2.js`

## Bearish SPY daily 3-1-2 — November 17, 2022

Relevant bars:
- Nov 14: H 380.89 / L 375.80
- Nov 15: H 382.92 / L 375.47 => Scenario 3 / outside vs Nov 14
- Nov 16: H 378.61 / L 375.76 => Scenario 1 / inside vs Nov 15
- Nov 17: H 375.91 / L 371.33 => 2D vs Nov 16

Engine geometry:
- setup = bearish `3-1-2`
- trigger = Nov 16 low = 375.76
- source range for first magnitude = Nov 15 outside bar
- first magnitude = Nov 15 low = 375.47
- midpoint stop = (378.61 + 375.76) / 2 = 377.185
- structure stop = Nov 16 high = 378.61

Outcome:
- Nov 17 traded below the 375.47 first magnitude;
- Nov 17 high 375.91 remained below both the 377.185 midpoint stop and 378.61 structure stop;
- midpoint-stop scenario = **WIN**;
- structure-stop scenario = **WIN**.

This is a clean daily example because the magnitude and both stop levels are not crossed in the same bar. No lower-timeframe ordering is required to score the primary magnitude-before-stop outcome.

## Status

PASS for real bearish 3-1-2 detection, setup-defined first magnitude, midpoint-stop outcome, and structure-stop outcome.

This is implementation validation on one real 3-1-2 example. It is not a historical success-rate or profitability claim.

Source retrieved 2026-08-19.
