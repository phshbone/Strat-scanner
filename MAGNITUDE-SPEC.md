# Magnitude / Pivot Target Spec v0.2

## Purpose
Magnitude is modeled as a directional stack of prior range/pivot targets. Alex's broadening-formation material gives us a stronger source-backed rule for WHY those pivots matter: higher highs and lower lows create compound outside-bar structure across visible and non-standard/hidden time aggregations.

## Source-backed broadening rule
Alex defines broadening formation operationally as price creating higher highs and lower lows. Multiple visible candles may collectively form a `compound outside bar` around an earlier set of candles.

A broadening formation therefore represents a larger range in which one side of prior ranges may be taken and price can later reverse back through the range toward prior pivots on the opposite side.

Important implications:
- a single Scenario 3 is an outside bar and therefore a one-bar broadening formation;
- multiple bars can collectively create the same geometry as an outside bar on a higher or differently anchored timeframe;
- standard chart boundaries are arbitrary, so 2-day, 2-week, 4-day, etc. aggregation can reveal an outside-bar structure that is only visible as a compound range on the ordinary chart;
- broadening structure is therefore a magnitude map, not merely a visual trendline pattern.

## Deterministic target behavior
Given:
- an origin/entry reference price,
- direction (`BULLISH` or `BEARISH`),
- a list of validated pivot prices,

build a directional target stack:
- bullish: pivots strictly above origin, nearest first;
- bearish: pivots strictly below origin, nearest first.

As price reaches a target, mark it consumed and promote the next remaining pivot.

When no directional targets remain, mark `exhaustionRisk = true`.

## Reversal-through-range behavior
When one side of a prior/broadening range has been taken and a valid opposing Strat reversal occurs, the opposite-side prior pivots become magnitude candidates.

Example logic:
- downside pivots are taken;
- a valid bullish reversal triggers;
- bullish magnitude is evaluated through prior overhead pivots/range structure;
- each consumed pivot is removed from the active stack;
- the engine does not assume every intermediate pivot MUST be hit.

The system must distinguish:
- `candidateMagnitude` — a valid prior pivot/range level in the direction of the reversal;
- `nextMagnitude` — nearest unconsumed candidate;
- `consumed` — price has traded through the level;
- `exhaustionRisk` — no remaining validated directional magnitude in the active structure.

## Right-to-left structural scan
Alex repeatedly describes drawing/reading the structure from right to left: determine what the current or recent high took out and what the current or recent low took out.

This gives us a deterministic primitive:
- for a new high, identify prior highs strictly below that high that have been taken;
- for a new low, identify prior lows strictly above that low that have been taken.

This DOES NOT by itself decide which of those levels are important/actionable pivots. It only identifies which prior levels were swept by the expanding range.

## Hidden-timeframe / compound-outside principle
A compound range on one chart may be an explicit Scenario 3 on a higher or differently anchored timeframe.

For research, store enough data to reproduce this:
- source timeframe;
- aggregation span/anchor if non-standard;
- aggregate high/low;
- inner range high/low;
- whether aggregate range is outside the inner range;
- which prior pivots were swept on each side.

This matters because magnitude may be clearer on the corresponding higher/alternate aggregation even when the standard chart looks noisy.

## Important constraint
`exhaustionRisk = true` is not a reversal signal. A new opposing actionable Strat setup is still required before a directional flip is considered.

Likewise, broadening structure does not mean price must take every visible pivot. It identifies valid range/pivot objectives; actual progression is determined by price.

## Multi-timeframe behavior
Pivots may carry timeframe metadata (for example 15m, 60m, D, W, M, 2D, 2W, 4D). The engine may promote from a lower-timeframe pivot to a higher-timeframe pivot as nearer targets are consumed, but it must preserve each pivot's source timeframe and identity.

## What is now sufficiently locked
Source-backed concepts:
- broadening = higher highs + lower lows;
- Scenario 3 = one-bar broadening / outside bar;
- multiple bars can form a compound outside bar;
- compound structures can correspond to higher/alternate-timeframe outside bars;
- after one side/range is taken and an actionable reversal occurs, prior pivots on the opposite side are magnitude candidates;
- consumed pivots promote the next candidate;
- clearing the relevant directional target stack creates exhaustion risk, not an automatic reversal.

## What is still NOT fully locked
We still need exact source-backed/empirical rules for automatic pivot qualification:
- how to distinguish an `obvious swing pivot` from consolidation noise;
- minimum left/right-bar confirmation, if any;
- whether different setup families prioritize specific pivots differently;
- exact PMG acceleration rules;
- how to rank competing pivots across overlapping timeframe structures.

Until those are validated, the magnitude engine accepts pivots as validated inputs rather than pretending every local high/low is equally meaningful.

## Research fields
Store at minimum:
- pivot id
- pivot price
- pivot timeframe
- pivot timestamp if known
- pivot type (`HIGH` / `LOW`)
- source range/structure id
- compound-outside structure id if applicable
- swept state
- direction
- origin price
- consumed state
- consumption timestamp if known
- target order
- next target
- remaining target count
- exhaustion risk

## Status
Target-stack mechanics are validated synthetically. Broadening/magnitude relationship is now source-backed from Alex's explanation. Automatic importance-ranking of pivots remains the principal unresolved rule-validation item.
