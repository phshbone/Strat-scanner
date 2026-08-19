# Magnitude / Pivot Target Spec v0.4

## Authority
Rob Smith is the canonical source for The Strat. Alex/Sarah material may operationalize or refine these rules, but when terminology or rule interpretation conflicts, Rob's observable price-action definitions take precedence.

## Purpose
Magnitude is the first expected objective produced by a valid Strat setup/reversal through a prior range. Additional unconsumed pivots beyond that first objective are targets.

Rob Smith's interview teaching directly confirms the core reason magnitude exists: outside bars exist, therefore shorter-timeframe price action forms broadening structures, and a failed directional break can reverse back through the previous range toward the opposite side.

## Canonical broadening rule
Broadening formation = higher highs + lower lows.

A Scenario 3 is an outside bar: it takes both the previous high and previous low. On a shorter timeframe, that same phenomenon appears as a broadening formation. Multiple visible candles may collectively form the equivalent of an outside bar depending on aggregation boundaries.

Broadening structure is therefore a magnitude map, not merely a visual trendline pattern.

## Canonical failed-two / opposite-side magnitude
Rob states the operational relationship directly:
- a bar first takes one side of the previous range (Scenario 2);
- if that move fails and price reverses back through the range, it can progress to Scenario 3;
- the opposite side of the relevant previous range becomes the magnitude objective.

This is path-dependent. A completed historical Scenario 3 does not reveal which side was taken first unless lower-timeframe/tick path data resolves the sequence.

## Canonical 2-2 reversal magnitude
Rob gives a direct 2-2 example: if price is `2D` and then reverses `2U`, the expected magnitude is the high of the original/prior bar that defined the range. Bearish behavior is symmetrical.

Therefore:
- bullish `2D -> 2U`: magnitude = relevant prior range high;
- bearish `2U -> 2D`: magnitude = relevant prior range low.

This confirms that the first magnitude is not an arbitrary nearest pivot selected from the entire chart. It is tied first to the active setup/range geometry.

## Pivot definition: raw vs structurally relevant
Alex explicitly states that a pivot can be the high or low of a previous candle, consistent with Rob's repeated references to prior ranges and obvious pivots.

For deterministic processing:

### Raw candle pivot
- prior candle high = `HIGH` pivot candidate;
- prior candle low = `LOW` pivot candidate.

### Structurally relevant pivot
A raw pivot that lies in the active reversal/continuation path and has not already been taken.

Direction determines which side is relevant:
- bullish path: prior highs above the active trigger/origin;
- bearish path: prior lows below the active trigger/origin.

## Magnitude vs target terminology
Use:
- `magnitude` = the first setup/range-defined expected objective;
- `targets[]` = additional valid objectives beyond magnitude.

Do not call every level in the directional stack a magnitude.

## Setup-specific first magnitude
### 2-1-2 bullish
Entry: break of the inside candle high.
First magnitude: high of the preceding directional `2D` candle / relevant prior range high.

### 2-1-2 bearish
Entry: break of the inside candle low.
First magnitude: low of the preceding directional `2U` candle / relevant prior range low.

### 2-2 reversal
After one side of the prior range has been taken and the reversal triggers, first magnitude is the opposite relevant prior range side.

### Failed 2 -> 3 / outside progression
If price first breaks one side, fails, and comes back through, the opposite side of that candle/range becomes the magnitude objective when sequence is known.

Historical completed `3` bars without lower-timeframe/path information remain directionally ambiguous.

## Range prerequisite
Do not project through an earlier larger range merely because additional pivots exist.

The first magnitude is constrained by the setup/range that actually triggered. Additional broader pivots become targets only if the active structure supports continued travel into that larger prior range.

## Deterministic target-stack behavior
Given:
- an origin/entry reference price,
- direction (`BULLISH` or `BEARISH`),
- setup-defined first magnitude,
- a set of structurally relevant unconsumed pivots,

build the directional path:
- bullish: relevant pivots strictly above origin, nearest first;
- bearish: relevant pivots strictly below origin, nearest first.

The setup-defined first objective is `magnitude`. Any subsequent valid objectives are `targets`.

As price reaches an objective, mark it consumed and promote the next remaining pivot.

When the relevant active target structure has been cleared, mark `exhaustionRisk = true`.

## Exhaustion risk — canonical confirmation
Rob explicitly describes exhaustion risk as occurring after price has moved into new highs/lows and has already cleared the prior participant group/range. At that point the move no longer benefits from the same stop-out/liquidity effect of moving back through a populated previous range; continued movement requires fresh directional aggression.

Therefore:
- clearing prior magnitude/target structure can create `exhaustionRisk`;
- exhaustion is not an automatic reversal signal;
- a fresh opposing Strat reversal is still required to justify a directional flip.

## Reversal-through-range behavior
When one side of a prior/broadening range has been taken and a valid opposing Strat reversal occurs, opposite-side pivots become candidate objectives.

Example:
1. a prior high is taken;
2. bearish reversal becomes actionable/in force;
3. relevant prior low/range side is magnitude;
4. further lower unconsumed pivots are targets;
5. taking those levels expands/clears the range;
6. clearing the active structure creates exhaustion risk, not an automatic reversal signal.

The bullish case is symmetrical.

## PMG relationship
A Pivot Machine Gun is a cluster/sequence of nearby unconsumed pivots in the direction of travel.

Current locked behavior:
- identify the ordered pivot stack;
- expose closely spaced pivots as a cluster candidate;
- do not invent a numeric spacing threshold or acceleration probability without source/empirical validation.

## Right-to-left structural scan
Read/draw broadening structure from right to left:
- determine what the recent high took out;
- determine what the recent low took out;
- identify the new range extremes;
- on reversal, trade back through the prior range toward unconsumed pivots.

This supports deterministic sweep tracking:
- new high -> mark prior highs below it as swept;
- new low -> mark prior lows above it as swept.

## Timeframe continuity interaction
Rob treats M/W/D/60 as the benchmark FTFC group while also stating that the useful timeframe set can shift with volatility and trader horizon.

Magnitude and FTFC remain separate concepts:
- magnitude validity comes from setup/range geometry;
- FTFC measures directional alignment/aggression context;
- aligned FTFC increases confidence/expectation that the range traversal can continue;
- conflicting FTFC does not erase an otherwise valid setup or magnitude.

## Simultaneous-break context
Rob repeatedly uses simultaneous breaks: a high concentration of Scenario 2 / failed-2 signals in the same direction across a sector, market group, or timeframe set.

This belongs in scanner/breadth ranking, not core setup validity.

Recommended research fields:
- bullish two count / universe size;
- bearish two count / universe size;
- bullish failed-two count;
- bearish failed-two count;
- sector/index concentration;
- timeframe of the simultaneous break.

Do not encode Rob's colloquial statements such as "the market will trade in the direction of the most twos" as certainty. Model this as an observable breadth/context statistic.

## In-force and reversal management
Rob reinforces that a setup is actionable only while its trigger remains in force. If a winning thesis has no valid reversal against it, the original directional thesis remains intact.

Observable opposing events include:
- `2U -> 2D` against a bullish position;
- `2D -> 2U` against a bearish position;
- opposing `2-1-2`;
- path-resolved failed `2 -> 3` reversal.

This supports the later Trade Coach architecture: guidance should react to meaningful state changes rather than arbitrary profit-taking.

## Time/session aggregation
Rob emphasizes that chart aggregation boundaries matter. For U.S. equities his teaching uses regular-session candles and 60-minute bars anchored to the market open/bottom-of-hour sequence (9:30, 10:30, 11:30, etc.).

Provider adapters must therefore preserve:
- regular-session vs extended-hours policy;
- timezone/session calendar;
- aggregation anchor;
- timeframe open timestamp.

A mathematically correct OHLC feed with the wrong session/anchor can generate different Strat bars.

## Important constraints
- `exhaustionRisk = true` is not a reversal signal.
- broadening does not mean every visible pivot must be hit.
- additional targets beyond magnitude are possibilities, not guarantees.
- raw pivots must be filtered by active setup/range/direction/consumption state.
- a completed Scenario 3 does not reveal which side broke first unless path data is available.
- FTFC and simultaneous-break breadth are context/ranking, not setup-definition overrides.
- Rob's order-flow/algo explanations are explanatory theory; deterministic rules must be based on observable price/time behavior.
- discretionary position sizing, tight-stop practices, adding to winners, and options selection belong to management profiles/guardrails rather than core Strat classification.

## What is now sufficiently locked
- broadening = higher highs + lower lows;
- Scenario 3 = one-bar outside/broadening event;
- shorter-timeframe broadening can represent an outside bar hidden by chart aggregation;
- prior candle highs/lows are raw pivots;
- first objective = magnitude; later objectives = targets;
- 2-2 reversal first magnitude is the opposite side of the relevant prior range;
- failed-2-to-3 direction is path dependent;
- setup/range geometry limits first magnitude before broader targets are promoted;
- clearing active magnitude/target structure creates exhaustion risk, not automatic reversal;
- FTFC provides directional context but does not define magnitude;
- simultaneous-break breadth belongs in scanner ranking/context;
- session/aggregation anchors are required data semantics, not cosmetic chart settings.

## What is still not fully locked
- numeric PMG spacing/cluster threshold;
- exact hierarchy when multiple timeframes provide competing candidate targets at similar prices;
- whether any setup families beyond the explicitly sourced examples override setup-defined first magnitude;
- formal pivot de-duplication when several candles share the same high/low;
- production policy for optional non-standard aggregations such as sideways 30, 2D, 4D, 2W;
- exact scanner weighting for simultaneous-break breadth.

## Research fields
Store at minimum:
- pivot id
- pivot price
- pivot timeframe
- pivot timestamp
- pivot type (`HIGH` / `LOW`)
- raw vs structurally relevant status
- source candle/range id
- compound-outside structure id if applicable
- swept state
- consumed state
- direction
- setup id
- trigger/origin price
- magnitude flag
- target order
- consumption timestamp if known
- remaining target count
- exhaustion risk
- session/aggregation anchor

## Status
The broadening/magnitude relationship and first-magnitude behavior are now confirmed not only by Alex's operational teaching but directly by Rob Smith's canonical explanation. Remaining work is implementation validation, competing multi-timeframe target hierarchy, PMG ranking, and real-market replay.