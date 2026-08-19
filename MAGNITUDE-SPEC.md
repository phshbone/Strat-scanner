# Magnitude / Pivot Target Spec v0.3

## Purpose
Magnitude is the first expected objective produced by a valid Strat setup/reversal through a prior range. Additional unconsumed pivots beyond that first objective are targets.

Alex's broadening-formation teaching gives a source-backed reason these levels matter: higher highs and lower lows create outside/compound-outside structure, and reversals back through prior ranges are measured using the prior candle/range pivots that price has not yet taken.

## Source-backed broadening rule
Broadening formation = higher highs + lower lows.

A single Scenario 3 is a one-bar broadening formation. Multiple visible candles may collectively form a `compound outside bar` around earlier candles and may correspond to an outside bar on a higher or differently aggregated timeframe.

Broadening structure is therefore a magnitude map, not merely a visual trendline pattern.

## Pivot definition: raw vs structurally relevant
Alex explicitly states that a pivot can be the high or low of a previous candle.

For deterministic processing we therefore distinguish:

### Raw candle pivot
- prior candle high = `HIGH` pivot candidate;
- prior candle low = `LOW` pivot candidate.

### Structurally relevant pivot
A raw pivot that lies in the active reversal/continuation path and has not already been taken.

Direction determines which side is relevant:
- bullish path: prior highs above the active trigger/origin;
- bearish path: prior lows below the active trigger/origin.

This resolves the earlier ambiguity around `obvious pivots`: every prior candle high/low is a raw pivot candidate, while structure, direction, consumption state, timeframe, and active range determine which pivots matter for the current trade.

## Magnitude vs target terminology
Alex distinguishes these terms:
- `magnitude` = the first expected objective for the active setup/range;
- `target` = additional objective(s) beyond magnitude.

The engine should therefore not call every level in the stack a magnitude.

Recommended fields:
- `magnitude` = nearest valid unconsumed pivot/range objective tied to the setup;
- `targets[]` = further valid unconsumed objectives beyond magnitude.

## Setup-specific first magnitude
Source examples support setup-specific first objectives rather than assuming an unlimited pivot run.

### 2-1-2 bullish
Entry: break of the inside candle high.
First magnitude: high of the preceding directional `2D` candle / relevant prior range high.

### 2-1-2 bearish
Entry: break of the inside candle low.
First magnitude: low of the preceding directional `2U` candle / relevant prior range low.

### 2-2 reversal
After one side of the prior range has been taken and the reversal triggers, first magnitude is the opposite relevant prior pivot/range side.

### Failed 2 -> 3 / outside progression
A 2 must exist before a 3. If price first breaks one side, fails, and comes back through, the opposite side of that candle/range becomes the magnitude objective when sequence is known.

Historical completed `3` bars without lower-timeframe/path information remain directionally ambiguous.

## Range prerequisite
Do not project through an earlier larger range merely because pivots exist.

Alex gives an important constraint: if the setup has not taken the prerequisite side of the larger range, the first magnitude may be only the opposite side of the immediate setup/inside bar. The engine must not automatically assume that a broader previous candle/range will also be taken.

This means target projection is conditional on the active range geometry, not merely price sorting.

## Deterministic target-stack behavior
Given:
- an origin/entry reference price,
- direction (`BULLISH` or `BEARISH`),
- setup-defined first magnitude,
- a set of structurally relevant unconsumed pivots,

build the directional path:
- bullish: relevant pivots strictly above origin, nearest first;
- bearish: relevant pivots strictly below origin, nearest first.

The first valid objective is `magnitude`. Any subsequent valid objectives are `targets`.

As price reaches an objective, mark it consumed and promote the next remaining pivot.

When the relevant active target structure has been cleared, mark `exhaustionRisk = true`.

## Reversal-through-range behavior
When one side of a prior/broadening range has been taken and a valid opposing Strat reversal occurs, opposite-side pivots become candidate objectives.

Example:
1. a prior high is taken;
2. bearish reversal becomes actionable/in force;
3. nearest relevant prior low is magnitude;
4. further lower unconsumed pivots are targets;
5. taking those levels expands/clears the range;
6. clearing the active structure creates exhaustion risk, not an automatic reversal signal.

The bullish case is symmetrical.

## PMG relationship
A Pivot Machine Gun is a cluster/sequence of nearby unconsumed pivots in the direction of travel.

The current locked behavior is limited to:
- identify the ordered pivot stack;
- expose closely spaced pivots as a cluster candidate;
- do not yet invent a numeric spacing threshold or acceleration probability.

Exact PMG ranking/spacing remains a separate validation task.

## Right-to-left structural scan
Alex describes reading/drawing broadening structure from right to left:
- determine what the recent high took out;
- determine what the recent low took out;
- identify the new range extremes;
- on reversal, trade back through the prior range toward unconsumed pivots.

This supports deterministic sweep tracking:
- new high -> mark prior highs below it as swept;
- new low -> mark prior lows above it as swept.

## Timeframe continuity interaction
Magnitude and FTFC are separate concepts.

A valid magnitude may exist without full timeframe continuity, but Alex treats FTFC alignment as increasing the expectation that price can travel through the projected range. Therefore:
- magnitude validity must not depend on FTFC;
- FTFC belongs in ranking/confidence/context;
- conflicting FTFC should not erase an otherwise valid setup or pivot objective.

## Hidden-timeframe / compound-outside principle
A compound range on one chart may be an explicit Scenario 3 on a higher or differently anchored timeframe.

For research, preserve:
- source timeframe;
- aggregation span/anchor if non-standard;
- aggregate high/low;
- inner range high/low;
- whether aggregate range is outside the inner range;
- which prior pivots were swept on each side.

## Important constraints
- `exhaustionRisk = true` is not a reversal signal.
- broadening does not mean every visible pivot must be hit.
- additional targets beyond magnitude are possibilities, not guarantees.
- raw pivots must be filtered by active direction/range/consumption state.
- a completed Scenario 3 does not reveal which side broke first unless path data is available.
- order-flow/algo explanations are commentary, not deterministic rules.

## What is now sufficiently locked
- broadening = higher highs + lower lows;
- Scenario 3 = one-bar broadening / outside bar;
- multiple bars can form a compound outside bar;
- prior candle highs/lows are raw pivots;
- directional unconsumed pivots through the active prior range are structurally relevant;
- first objective = magnitude; later objectives = targets;
- setup/range geometry can limit first magnitude to the immediate prior range;
- after one side is taken and an actionable reversal occurs, the opposite relevant side/pivot is the magnitude candidate;
- consumed pivots promote subsequent targets;
- clearing active magnitude/target structure creates exhaustion risk, not automatic reversal;
- FTFC ranks/qualifies expectation but does not define magnitude validity.

## What is still not fully locked
- numeric PMG spacing/cluster threshold;
- exact hierarchy when multiple timeframes provide competing candidate magnitudes at similar prices;
- whether any setup families beyond the explicitly sourced examples override nearest relevant pivot selection;
- formal pivot de-duplication when several candles share the same high/low;
- non-standard timeframe aggregation policy for production scanning.

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

## Status
Broadening, raw pivot definition, first-magnitude terminology, reversal-through-range logic, and setup-limited target projection are now source-backed from Alex's teaching. The remaining work is implementation validation and multi-timeframe/PMG ranking—not basic pivot definition.
