# Rob Smith — Penny Lane interview — canonical Strat notes

Source supplied by user:
- YouTube: https://youtu.be/MK49c0xPtn4
- Interview format: Rob Smith discussing The Strat, magnitude, FTFC, simultaneous breaks, risk, continuation, and exhaustion.

## Source authority
Rob Smith is the creator of The Strat and is treated as the canonical source. Statements below are separated into deterministic/observable rules versus explanatory/discretionary commentary.

## Deterministic / observable rules extracted

### 1. Only three bar scenarios
- `1`: inside bar; neither prior high nor prior low is taken.
- `2`: one side of the previous range is taken.
- `3`: both sides of the previous range are taken.

These apply on every timeframe.

### 2. Scenario 3 implies broadening on a lower timeframe
Rob directly connects outside bars to broadening formations. Because an outside bar takes both sides of the previous range, lower-timeframe data must have produced higher-high / lower-low geometry to create it.

### 3. Failed two can progress to three
If price takes one side of the prior range and then fails/reverses back through the range, the opposite side becomes the outside-bar objective. This is the fundamental failed-2 -> 3 progression.

Historical note: completed Scenario 3 does not prove which side was taken first. Lower-timeframe or tick path is required when order matters.

### 4. 2-2 reversal magnitude
Rob gives a direct example: `2D -> 2U` has magnitude to take the high of the relevant original/prior bar. Bearish behavior mirrors this: `2U -> 2D` has magnitude to the relevant prior low.

### 5. Magnitude tells how far the setup is expected to travel
Rob frames inability to gauge magnitude as a major reason traders exit winners too early. His management logic is conditional: if the setup remains valid and there is no reversal against it, the magnitude thesis remains alive.

### 6. FTFC benchmark
Rob repeatedly uses Monthly / Weekly / Daily / 60-minute as benchmark timeframe continuity. He also states that timeframe choice can shift with volatility and trading horizon.

FTFC state is based on price relative to each timeframe open. Alignment indicates which side is acting more aggressively in observable price terms.

### 7. Simultaneous breaks
Rob defines simultaneous break as a concentration of signals in the same direction across a sector/group or across time. Examples include many sector names triggering 2s in the same direction.

For our scanner this should be an observable breadth/context metric, not a certainty rule.

### 8. When things occur matters
New period opens are information events in the Strat framework: new month, new week, second day of week, etc. A signal's timeframe and timing relative to the new period matter for interpretation.

### 9. Session / aggregation anchors matter
Rob explicitly discusses 30- and 60-minute chart boundaries. A 30-minute chart anchored at :00/:30 is not identical to one anchored at :15/:45. For U.S. equities he teaches regular-session aggregation from market open, e.g. 60-minute bars 9:30-10:30, 10:30-11:30, etc.

Data providers must therefore preserve session and aggregation anchor semantics.

### 10. Reversal-against-you logic
Rob says a thesis that is working remains valid until an actual Strat reversal appears against it. Examples he names include:
- 2-up then 2-down;
- 2-1-2 back the other way;
- failed 2 progressing to 3.

This is important for later deterministic Trade Coach state changes.

### 11. Exhaustion risk
Rob describes exhaustion risk after price reaches new highs/lows beyond a populated prior range. While price is moving back through a prior range, old positions/stops provide participation. Once those participants have been cleared and price is in new territory, continuation requires fresh aggressive buying/selling.

Deterministic interpretation:
- completed magnitude/target structure can create `exhaustionRisk`;
- exhaustion alone is NOT an opposing trade signal;
- a new Strat reversal is still required.

## Scanner/ranking concepts extracted

### Direction of the most twos / failed twos
Rob repeatedly describes the market tending to move in the direction of the dominant concentration of 2s and failed 2s. Because this is expressed colloquially and probabilistically, model it as breadth:
- count bullish 2s;
- count bearish 2s;
- count bullish failed-2 progressions;
- count bearish failed-2 progressions;
- calculate sector/index concentration.

Do not encode `most twos = guaranteed market direction`.

### Macro-to-micro workflow
Rob describes looking at Year / Quarter / Month / Week / Day / 60 and using smaller timeframes to detect the first stage of a larger change. This supports the architecture of storing thesis timeframe separately from entry timeframe.

### Set-up-the-next-shot logic
Rob compares timeframe progression to pool: if one signal works, ask what larger signal it will trigger next. This supports a `domino` state model rather than isolated signal detection.

## Management / psychology — preserve as configurable guidance, not core laws
Rob advocates:
- very tight stops;
- immediate loss cutting;
- re-entry if the setup becomes valid again;
- adding to winners after shorter-timeframe corrective activity reverses back with the main thesis;
- not exiting simply because of boredom/profit-taking while no reversal exists.

These are valuable management principles but should live in a selectable management/guardrail profile rather than redefine Strat bar/setup validity.

## Explanatory claims not to hard-code
Rob frequently explains price action through algorithms, institutional buying/selling, stop-outs, liquidity removal, trapped traders, and order aggression. These explanations may be useful educational context, but the engine should only encode observable price/time rules unless an external data source directly measures the claimed mechanism.

## Architecture implications
The interview strongly supports the current separation:

`OHLC/session engine -> Strat bar/setup engine -> in-force state -> magnitude/range engine -> FTFC -> simultaneous-break breadth -> scanner ranking -> guardrails/management`

It also supports later:
- domino / next-timeframe trigger tracking;
- exhaustion state;
- event-driven Trade Coach guidance;
- scanner breadth heat maps;
- regular-session aggregation configuration.

## Canonical confirmations that resolve prior uncertainty
1. Broadening and Scenario 3 are directly linked by Rob.
2. Failed 2 reversing through prior range targets the opposite side.
3. 2-2 reversal magnitude is tied to the relevant prior range, not an arbitrary global nearest pivot.
4. Exhaustion after clearing prior range is a context state, not a reversal signal.
5. M/W/D/60 is the benchmark FTFC grouping, but not a universal hard-coded set.
6. Chart/session aggregation boundaries are part of the rule semantics.

## Remaining open items
- exact PMG cluster spacing/qualification;
- exact cross-timeframe priority when multiple valid magnitude/target levels compete;
- formal treatment of non-standard anchored aggregations (`sideways 30`, 2D, 4D, 2W) in production;
- empirical weighting of simultaneous-break breadth;
- source-backed special magnitude rules for other setup families beyond the confirmed 2-2 / failed-2 progression.
