# Alex — Broadening, Pivots, Magnitude, FTFC Q&A

Source supplied by user:
- https://youtu.be/CpNZRLRrnuA

## High-confidence rule extractions

### 1. Broadening formation
Broadening formation is the creation of higher highs and lower lows. A Scenario 3 is the direct one-bar expression of that geometry. Multiple bars can create a compound outside bar / higher-timeframe outside structure.

### 2. Why broadening is used
Alex explicitly says broadening is used to gauge where price may travel by tracking prior range pivots. The practical use is not the trendline drawing itself; it is understanding the range-expansion behavior and the pivots created inside that range.

### 3. Raw pivot definition
Alex answers the question `how to find the pivots` directly:
- a pivot is the low or high of a previous candle;
- when trading back through a range to the downside, use prior candle lows;
- symmetrically, when trading through a range to the upside, use prior candle highs.

This supports a two-layer model:
- raw pivot = any prior candle high/low;
- structurally relevant pivot = raw pivot in the current directional path that has not already been taken.

### 4. Magnitude vs target
Alex distinguishes the terminology:
- magnitude = first expected objective;
- anything after magnitude = additional target.

This is a correction to treating an entire ordered stack as `magnitudes`.

### 5. Setup-specific magnitude
For a bullish 2-1-2, Alex says the entry is the break of the inside candle high and the magnitude is to take out the high of the previous `2` candle.

The bearish case is the directional mirror.

For a 2-2 reversal / failed side of a range, once the reversal back through the prior range becomes actionable, the opposite relevant side becomes the magnitude objective.

### 6. Do not over-project
Alex gives a crucial limitation: if the setup did not take out the prerequisite side of a broader prior candle/range, the magnitude may only be to go outside the immediate inside/setup bar. Do not automatically expect price to take the larger earlier range just because it is visible.

This means magnitude selection must be range-aware, not merely `nearest sorted pivot` across all history.

### 7. Compound outside / alternate timeframe
Multiple candles on the visible chart can represent an outside bar on a higher or alternate aggregation. This is why Alex sometimes uses 2-day, 2-week, 4-day and other alternate timeframes to reveal the compound structure.

### 8. FTFC interaction
Alex repeatedly says broadening/magnitude should be considered together with timeframe continuity. However FTFC changes expectation/quality, not the existence of the pivot target itself.

Implementation consequence:
- magnitude logic remains deterministic and independent;
- FTFC is a ranking/context layer;
- conflicting FTFC does not invalidate the raw target geometry.

### 9. In-force
A setup is only in force while price is through the trigger in the intended direction. If price crosses back through the trigger, it is no longer in force.

### 10. PMG
Alex describes Pivot Machine Gun as many pivots close together in the direction of travel. This supports ordered pivot clustering, but he does not give a numeric spacing threshold in this source.

## Important non-rule commentary
Alex also explains moves in terms of stops, order vacuums, algorithmic aggression, and market participants getting trapped. These explanations are useful context but are not required to calculate Strat setups or magnitude and should not be encoded as deterministic facts.

## Architecture impact
This source materially narrows the remaining magnitude problem.

We can now treat:
- prior candle highs/lows as raw pivot candidates;
- active direction/range/consumption state as the filter for relevant pivots;
- nearest valid setup-defined objective as `magnitude`;
- subsequent objectives as `targets`;
- FTFC as ranking/context rather than magnitude definition.

Remaining validation is mainly multi-timeframe conflict resolution, PMG spacing/ranking, and production de-duplication of equal/overlapping pivots.
