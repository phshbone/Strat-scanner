# Outside 50% Rule — Operational Spec v0.2

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

## Exhaustion-first reversal sequence
Sarah's Lucid example adds an important operational sequence that must be modeled separately from a pure 50%-first entry:

1. Price moves in one direction and takes available pivot targets on the higher/setup timeframe.
2. If the relevant target stack is cleared and there are no additional nearby pivots in that direction, mark `priceExhaustion = ACTIVE` for that side.
3. Do NOT reverse merely because exhaustion is active.
4. Wait for a valid opposing actionable Strat reversal on the same or lower execution timeframe (for example 15m 2D -> 2U after downside exhaustion).
5. That reversal can become the entry mechanism before the higher/setup timeframe has crossed its 50% level.
6. If the higher/setup timeframe then retraces through the midpoint of the prior closed candle, activate the Outside 50% target logic.
7. The opposite side of the prior closed candle becomes the outside-bar target.
8. When that opposite side is taken, the outside-bar magnitude is complete and exhaustion risk becomes active on the new side.

This sequence is important because the actionable reversal may PRECEDE the 50% confirmation. Therefore the engine must not require the 50% threshold to be crossed before recognizing an exhaustion-reversal entry candidate.

Suggested state progression:
`TARGET_STACK_CLEARED -> EXHAUSTION_ACTIVE -> OPPOSING_REVERSAL_TRIGGERED -> MIDPOINT_CONFIRMED -> OUTSIDE_TARGET_ACTIVE -> TARGET_HIT`

## Pivot-stack exhaustion
For research, store whether exhaustion followed:
- one pivot target,
- multiple consecutive pivot targets,
- a fully cleared relevant pivot stack / no remaining nearby target in that direction.

Do not convert "no pivots left" into a prediction that price must reverse. It is only an exhaustion condition. A fresh actionable reversal is still required for a directional flip.

## Multiple lower-timeframe entries
Sarah's Lucid example also demonstrates that once the higher-timeframe thesis is active, more than one valid lower-timeframe actionable signal may appear on the route to the outside-bar target.

Store each entry independently with:
- thesis/outside timeframe
- execution timeframe
- trigger type
- trigger price
- stop
- whether the higher-timeframe 50% level had already been crossed at entry
- target state at entry

This lets research compare early exhaustion-reversal entries versus later 50%-confirmed entries.

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
- entryMode (`ACTIONABLE_SIGNAL`, `EXHAUSTION_REVERSAL`, or `DIRECT_50`)
- entryTimeframe
- entryBeforeMidpointConfirmation
- pivotsClearedCount
- relevantPivotStackCleared
- exhaustionTimestamp if known
- reversalTimestamp if known
- targetHit
- timeToTarget
- timeRemainingAtTrigger
- priceExhaustionAfterTarget

## Status
Core-rule validation item. Not a profitability claim.
