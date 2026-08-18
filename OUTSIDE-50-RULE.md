# Outside 50% Rule — Operational Spec v0.3

Source basis: Sarah / Stratification transcripts supplied in project discussion, plus the SPY September 2021 example used for historical validation.

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
- live CURRENT PRICE retraces to or below previous midpoint
- target = previous low

Bullish potential outside:
- live candle takes previous low first
- live CURRENT PRICE retraces to or above previous midpoint
- target = previous high

## Critical implementation correction
The 50% condition is an intrabar/live-price condition. It does NOT require the live candle to close beyond the midpoint.

Therefore:
- live engine: compare `currentPrice` with the prior midpoint
- historical replay with lower-timeframe bars: a bar's low/high can prove that the midpoint was touched/crossed during that bar
- completed higher-timeframe OHLC alone may prove that the midpoint was crossed sometime during the candle, but may not establish the required sequence if both sides were taken in that same coarse bar

Do not use the higher-timeframe candle's eventual `close` as the 50% trigger. That would introduce a false close-confirmation requirement that is not part of Sarah's stated rule.

## Important distinction
This is NOT the same thing as the optional midpoint/50% stop used for trade management.

Use separate names in code and UI:
- `outside50Rule` = anticipatory outside-bar context/target logic
- `midpointStop` = optional stop model

## Entry modes
Sarah's material shows multiple operational uses that must remain distinct.

### A. Actionable-signal entry
Use lower- or same-timeframe Strat reversal (2-2, 2-1-2, 3-1-2, etc.) to enter in the direction of the potential outside bar.

### B. Direct 50% anticipation
Position from around the 50% retracement after one side has already been taken, with the opposite side as the outside-bar target.

### C. Exhaustion-reversal before 50%
After a relevant pivot stack is cleared, an opposing lower-timeframe actionable reversal may provide an entry before the higher-timeframe midpoint is crossed. If the higher timeframe later crosses 50%, the outside-bar target becomes active.

For research, record these entry modes separately so historical testing can compare them rather than silently merging them.

## Exhaustion-first reversal sequence
1. Price moves in one direction and takes available pivot targets on the higher/setup timeframe.
2. If the relevant target stack is cleared and there are no additional nearby pivots in that direction, mark `priceExhaustion = ACTIVE` for that side.
3. Do NOT reverse merely because exhaustion is active.
4. Wait for a valid opposing actionable Strat reversal on the same or lower execution timeframe.
5. That reversal can become the entry mechanism before the higher/setup timeframe has crossed its 50% level.
6. If the higher/setup timeframe then retraces through the midpoint of the prior closed candle, activate the Outside 50% target logic.
7. The opposite side of the prior closed candle becomes the outside-bar target.
8. When that opposite side is taken, the outside-bar magnitude is complete and exhaustion risk becomes active on the new side.

Suggested state progression:
`TARGET_STACK_CLEARED -> EXHAUSTION_ACTIVE -> OPPOSING_REVERSAL_TRIGGERED -> MIDPOINT_CONFIRMED -> OUTSIDE_TARGET_ACTIVE -> TARGET_HIT`

## Pivot-stack exhaustion
For research, store whether exhaustion followed:
- one pivot target,
- multiple consecutive pivot targets,
- a fully cleared relevant pivot stack / no remaining nearby target in that direction.

Do not convert "no pivots left" into a prediction that price must reverse. It is only an exhaustion condition. A fresh actionable reversal is still required for a directional flip.

## Multiple lower-timeframe entries
Once the higher-timeframe thesis is active, more than one valid lower-timeframe actionable signal may appear on the route to the outside-bar target.

Store each entry independently with:
- thesis/outside timeframe
- execution timeframe
- trigger type
- trigger price
- stop
- whether the higher-timeframe 50% level had already been crossed at entry
- target state at entry

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
Completed OHLC can show that both sides were eventually taken, but it cannot always reveal which side traded first. For sequence-dependent Outside 50 validation, use intrabar/lower-timeframe data when available. Otherwise mark first-side sequence as unknown rather than inventing it.

A lower-timeframe historical bar can prove that the midpoint threshold was crossed if its range passes through the midpoint. It still cannot reveal the exact tick ordering inside that lower-timeframe bar if multiple sequence-critical events occur within it.

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
- currentPrice at live evaluation
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
- sequenceResolution (`TICK`, `LOWER_TF`, `COARSE_OHLC`, or `UNKNOWN`)

## Status
Core-rule validation item. Not a profitability claim.
