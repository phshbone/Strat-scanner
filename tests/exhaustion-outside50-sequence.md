# Exhaustion -> Reversal -> Outside 50% Validation Sequence

Source example: Sarah / Stratification Lucid outside-day walkthrough supplied in project discussion.

## Purpose
Validate that the engine does not incorrectly require the Outside 50% threshold before recognizing an exhaustion-based opposing Strat reversal.

## Required state progression

1. Setup/higher timeframe sells through multiple downside pivot targets.
2. Relevant downside pivot stack becomes cleared.
3. Mark `downsideExhaustion = ACTIVE`.
4. No long entry yet solely because exhaustion is active.
5. Lower execution timeframe prints an actionable bullish Strat reversal (example: 15m 2D -> 2U).
6. Mark `exhaustionReversalCandidate = BULLISH` and store its trigger/stop.
7. Higher/setup timeframe continues retracing into the prior closed candle.
8. Once live price >= prior candle midpoint, mark `outside50Confirmed = true`.
9. Set outside-bar target to prior candle high.
10. When prior candle high is taken, mark `outsideTargetHit = true` and `upsideExhaustion = ACTIVE`.

## Assertions
- Exhaustion alone must not create a reversal trade.
- A valid lower-timeframe actionable reversal may occur before midpoint confirmation.
- Midpoint confirmation upgrades/activates the outside-bar target thesis; it is not required to retrospectively validate that the lower-timeframe reversal existed.
- Multiple lower-timeframe actionable entries may occur while the same higher-timeframe outside-bar target remains active.
- Every entry must be stored separately.
- Target hit ends the outside-bar magnitude objective; continuation beyond target requires fresh analysis.

## Research labels
Recommended entry-mode labels:
- `EXHAUSTION_REVERSAL_PRE50`
- `EXHAUSTION_REVERSAL_POST50`
- `DIRECT_50`

These must remain distinct in historical results so performance can be compared without mixing entry logic.

## Historical reconstruction caution
If the higher-timeframe candle is only available as completed OHLC, the first side taken and exact midpoint-cross sequence may be unknowable. Use lower-timeframe bars to reconstruct sequence when possible; otherwise mark sequence fields as unknown.
