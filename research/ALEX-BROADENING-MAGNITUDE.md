# Alex — Broadening Formations and Magnitude

Source: user-supplied transcript from Alex video `7IYnExps0SQ`.

## Operational statements extracted

Alex describes broadening formation as the only price pattern he considers structurally significant because it is produced by outside-bar behavior.

Core geometry:
- higher highs;
- lower lows;
- a visible series of candles can collectively be a `compound outside bar` around an earlier range.

He explicitly uses broadening structure to gauge magnitude.

## Why alternate timeframes matter
Alex points out that standard candle boundaries are arbitrary. A structure that looks like a compound broadening formation on a daily/weekly chart may become an explicit Scenario 3/outside bar on a 2-day, 2-week, 4-day, or other aggregation.

For our engine this means:
- do not treat non-standard aggregation as a different market truth;
- use it as an alternate lens for the same underlying OHLC path;
- keep real price/range data authoritative;
- store aggregation span and anchor whenever an alternate timeframe is used for research.

## Right-to-left reading
Alex repeatedly says the easiest way to read/draw the structure is right to left:
- determine what the recent high took out;
- determine what the recent low took out;
- those swept levels define the expanding/compound range.

This supports implementing strict swept-level detection (`>` prior high, `<` prior low).

## Magnitude implication
When one side of the range has been taken and a valid reversal occurs, Alex looks back through prior pivots/range structure for the move's magnitude.

Examples described in the transcript include:
- 2-down -> green/time-continuity change coming back through the previous range;
- weekly and 2-week outside-bar structures providing magnitude context;
- ROKU reversing from prior lows and then moving back through prior pivots;
- hammer / 2-2 reversal entries with previous pivots overhead as magnitude candidates.

Important caution from Alex:
- price does not have to take every obvious pivot in a simple one-for-one sequence;
- broadening tells us both sides of ranges are taken over time, not that every visible intermediate level is guaranteed to trade.

Therefore our engine should rank/track valid pivot objectives without turning each pivot into a prediction.

## What this source resolves
Sufficiently supported:
- broadening = higher highs + lower lows;
- outside bar = one-bar broadening;
- multiple bars can form a compound outside range;
- alternate aggregations can reveal the same structure as explicit outside bars;
- broadening structure is used to gauge magnitude;
- after a valid reversal, prior pivots on the opposite side of the range are magnitude candidates.

Still unresolved precisely:
- exact algorithm for an `obvious pivot` versus consolidation noise;
- exact left/right-bar swing confirmation requirement, if any;
- how to rank overlapping pivots from multiple timeframes;
- exact PMG acceleration rules.

## Engine consequence
Added deterministic primitives in `broadening.js` for:
- aggregate ranges;
- outside-range testing;
- compound outside testing;
- strict swept-level detection;
- higher-high/lower-low broadening state.

Synthetic checks live in `tests/broadening-validation.js`.

This source is rule-definition evidence, not profitability evidence.
