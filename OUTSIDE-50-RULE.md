# Outside 50% Rule — Operational Spec v0.1

Source basis: Sarah / Stratification transcripts supplied in project discussion.

## Core rule
A potential outside bar becomes actionable context after the live candle:
1. takes one side of the previous closed candle, then
2. retraces at least 50% through the previous candle's full wick-to-wick range.

The opposite side of the previous closed candle becomes the potential outside-bar target.

## Calculations
Previous candle midpoint:
`mid = (previousHigh + previousLow) / 2`

Bearish potential outside:
- live candle takes previous high first
- live price retraces to or below previous midpoint
- target = previous low

Bullish potential outside:
- live candle takes previous low first
- live price retraces to or above previous midpoint
- target = previous high

## Important distinction
This is NOT the same thing as the optional midpoint/50% stop used for trade management.

Use separate names in code and UI:
- `outside50Rule` = anticipatory outside-bar context/target logic
- `midpointStop` = optional stop model

## Entry modes
Sarah's material shows two operational uses that must remain distinct:

### A. Actionable-signal entry
Use lower- or same-timeframe Strat reversal (2-2, 2-1-2, 3-1-2, etc.) to enter in the direction of the potential outside bar.

### B. Direct 50% anticipation
Sarah also describes being positioned from around the 50% retracement once one side has already been taken, with the opposite side as the outside-bar target.

For v0.1 research, these must be recorded as separate entry modes so historical testing can compare them rather than silently merging them.

## Target / exhaustion behavior
- Objective is to complete the outside bar by taking the opposite side of the prior candle.
- Once that opposite side is taken, the outside-bar magnitude is complete.
- Price is then at exhaustion risk on that side.
- Do not automatically reverse position at the target.
- Wait for a valid opposing actionable Strat reversal before considering a flip.

## Multi-timeframe domino effect
A lower-timeframe actionable reversal can trigger a higher-timeframe reversal or continuation that pushes the higher timeframe through its 50% threshold and toward an outside-bar target.

Track separately:
- thesis timeframe
- entry timeframe
- outside-50 timeframe
- outside-bar target

## Time constraint
The outside-bar objective is tied to the active candle's timeframe. Remaining candle time matters. If insufficient time remains, flag higher time exhaustion; do not assume the target will be reached before the candle closes.

## Historical-data limitation
Completed OHLC can show that both sides were eventually taken, but it cannot always reveal which side traded first. For sequence-dependent outside-50 validation, use intrabar/lower-timeframe data when available. Otherwise mark first-side sequence as unknown rather than inventing it.

## Research fields
Store at minimum:
- symbol
- timeframe
- previousHigh
- previousLow
- previousMidpoint
- firstSideTaken
- firstSideTimestamp if known
- midpointCrossTimestamp if known
- direction
- target
- entryMode (`ACTIONABLE_SIGNAL` or `DIRECT_50`)
- entryTimeframe
- targetHit
- timeToTarget
- timeRemainingAtTrigger
- priceExhaustionAfterTarget

## Status
Core-rule validation item. Not a profitability claim.
