# SSS50 State Machine — Validation Note

Date: 2026-08-18

## Purpose
Make the Outside 50% rule explicit as a live-state progression rather than a single boolean.

## Source corroboration
Sara Strat Sniper's public TrendSpider scanner `Strat D 50% Rule Long` uses these daily criteria:
- current close above the middle of the previous day's range,
- current low below the previous day's low,
- current high below the previous day's high.

That is the bullish active condition: the current candle first behaves as a 2D, fails back through the prior range, crosses the prior candle midpoint, but has not yet taken the prior high.

A separately published SSS50 status indicator on TradingView describes four operational conditions: INVALID, STANDBY (failed 2), ACTIVE (failed 2 + 50% crossed), and COMPLETE (outside bar finished). This is useful corroboration of the state-machine interpretation, but the rule source of truth remains Sarah / Rob material and direct Sarah-created scanner logic when available.

## Engine states

### INVALID
No valid failed-two condition yet.
Examples:
- inside bar,
- 2U still holding above the prior high,
- 2D still holding below the prior low,
- wrong sequence / insufficient path information.

### STANDBY
One side has been taken, then live price has failed back into the prior candle's range, but the 50% threshold has not yet been crossed.

Bearish example:
- prior high taken first,
- live price falls back below prior high,
- live price remains above prior midpoint.

Bullish mirror:
- prior low taken first,
- live price rises back above prior low,
- live price remains below prior midpoint.

### ACTIVE
Failed-two condition plus live price crosses the previous candle midpoint.

Bearish:
- prior high taken first,
- live price <= previous midpoint,
- target = previous low.

Bullish:
- prior low taken first,
- live price >= previous midpoint,
- target = previous high.

### COMPLETE
Both sides of the previous candle have been taken. The outside-bar magnitude objective is complete.

After completion, mark price-exhaustion risk on the completed side. Do not automatically reverse; wait for a valid opposing actionable signal.

## Important implementation note
Live status uses current price, not candle close. Historical replay may use lower-timeframe high/low to prove that a threshold traded intrabar, but ordering remains unknown when multiple sequence-critical events occur inside the same replay bar.

## Status
Rule-state clarification for deterministic validation. Not a profitability claim.
