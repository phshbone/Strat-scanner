# Rob Smith FinTwit Seminar — Canonical Strat Notes

Date: 2026-08-19
Source: user-supplied transcript of Rob Smith FinTwit seminar (YouTube: Cb8j4lb_A6M)
Source tier: CANONICAL — direct Rob Smith teaching

## Why this source matters

This seminar is direct Rob Smith material and therefore has higher authority than later execution refinements from other Strat practitioners when a true rule conflict exists.

The transcript strongly reconfirms the deterministic architecture already in the engine and adds several implementation details that should be preserved explicitly.

## Canonical bar scenarios

From one bar to the next there are only three observable range relationships:

- Scenario 1: current bar remains completely inside the previous bar's range.
- Scenario 2: current bar takes one side of the previous bar's range.
- Scenario 3: current bar takes both sides of the previous bar's range.

Scenario 3 / outside bar is especially important because Rob explicitly states that it is necessarily a broadening formation on a shorter timeframe.

## Reversal families explicitly described

Rob directly describes:

- 2-2 reversal: a directional 2 followed by a 2 in the opposite direction.
- 2-1-2 reversal: directional 2, inside bar, then break in the opposite direction.
- failed 2 -> 3 / one-bar outside reversal: a one-sided break that fails and traverses through the other side.
- 3-1-2: outside bar, inside bar, then directional break.

The transcript directly supports the idea that the first three are not arbitrary chart patterns but different observable ways range transitions can reverse.

## Magnitude / failed-2 logic

A critical direct statement from Rob is that once a directional 2 fails and comes back through the prior range, the existence of outside bars tells us the opposite side of the range is the natural magnitude candidate.

Operationally:

`ONE SIDE TAKEN -> FAILURE BACK THROUGH RANGE -> POTENTIAL OUTSIDE BAR -> OPPOSITE SIDE = MAGNITUDE`

This strongly corroborates the current setup-specific magnitude logic and SSS50 / failed-2-to-3 architecture.

Important safeguard: this does not mean every arbitrary larger range becomes a target. The source range being converted toward an outside bar must be explicit.

## Timeframe continuity

Rob explicitly uses the canonical four-timeframe profile:

`M -> W -> D -> 60`

When all are green, he describes full timeframe continuity to the upside; when all are red, full timeframe continuity to the downside.

This is direct canonical support for the default M/W/D/60 preset.

However, the seminar also uses yearly and quarterly charts and says higher volatility can justify moving to shorter timeframes. Therefore M/W/D/60 remains a canonical default profile, not the limit of valid timeframe analysis.

## Signal lifetime / carrier behavior

Rob explicitly states that a signal is "in force" for as long as its bar remains open.

He also describes stacking signals across timeframes, for example:

`daily trigger -> weekly trigger -> monthly trigger`

and says shorter-term reversals can be used to reconfirm a still-open higher-timeframe signal.

This strongly confirms the current lifecycle/carrier model:

- each timeframe has its own independent in-force condition;
- multiple timeframes can simultaneously carry the thesis;
- a lower timeframe can reconfirm a higher timeframe without causally creating it;
- a monthly signal can remain a valid carrier throughout the open monthly bar if not negated.

## Simultaneous break

Rob directly identifies simultaneous break as a high-probability context where many Scenario 2 bars in the same sector or market group break in the same direction.

He interprets broad participation as evidence of institutional sector-wide participation.

Implementation consequence:
- simultaneous break belongs in ranking/breadth evidence, not setup validity;
- it should be calculated as observable breadth across a defined universe/sector;
- do not hard-code an anecdotal percentage threshold unless separately source-verified and historically tested.

## "Once a three, always a three"

Rob uses the phrase "once a three, always a three" to express that once a range has demonstrated two-sided expansion, future expansion across that range remains structurally relevant.

Engine interpretation:
- preserve completed outside-range objects as structural context;
- do not discard them merely because the current bar is no longer a 3;
- these prior ranges can remain important for broadening/reclaim/magnitude analysis.

This should not be interpreted as a prediction that price must immediately retake both sides.

## Session / bar anchoring — critical data rule

Rob explicitly warns that 60-minute charts can differ depending on whether the platform anchors the 60-minute bar at the top or bottom of the hour.

He says he asked TrendSpider whether its 60 updates at the top or bottom of the hour and specifically cared about the answer.

This makes bar-construction metadata a canonical implementation requirement, not a cosmetic provider detail.

Every intraday bar series should preserve at least:

- market timezone;
- session type;
- regular vs extended-hours inclusion;
- timeframe;
- bar anchor / offset;
- provider aggregation semantics.

Historical validation must compare like-for-like bar construction.

## New timeframe opens matter

Rob emphasizes that when something occurs matters, specifically referencing new quarter context and new timeframe openings.

He also explains his Tuesday process as learning which Monday moves reversed versus continued.

Implementation consequence:
- timeframe boundary/open events should be first-class metadata;
- a new timeframe open resets continuity measurement for that timeframe;
- day-of-week itself should not be hard-coded as an edge without testing;
- Tuesday's informational value is currently contextual/operational, not a universal rule.

## Winning vs losing trade state

Rob gives a compact deterministic checklist:

Losing states include:
- trading inside an unresolved Scenario 1 chop;
- Scenario 2 moving against the position;
- Scenario 3 expanding against the position;
- timeframe continuity against the trade.

Winning/supportive states include:
- Scenario 2 in the trade direction;
- Scenario 3 resolving in the trade direction;
- timeframe continuity in the trade direction.

This is useful for the future deterministic advisory engine, but should not be reduced to a single opaque score.

## Risk/behavior principles

Rob directly teaches:
- cut losers quickly;
- ride winners;
- add to winners rather than subsidizing losers.

These belong in the user guardrail/management layer, not the canonical pattern-validity engine.

## Source-separation consequence for hybrid system

Rob explicitly rejects indicators as necessary for pure Strat interpretation. That creates no conflict with the planned hybrid architecture if source boundaries remain strict:

- Strat = canonical setup / direction / magnitude / timeframe state.
- Minervini = structural quality/ranking overlay.
- Elder = trend/momentum/discipline overlay.
- user plan = risk and behavioral guardrails.

The overlays may change desirability or management, but must never mutate whether the pure Strat setup is valid.

## Architecture consequences

Confirmed production concepts:

`1/2/3 BAR STATE -> REVERSAL / CONTINUATION SETUP -> IN-FORCE STATE -> MTF CARRIERS -> MAGNITUDE / BROADENING OBJECTIVES`

Additional data requirement:

`OHLCV + TIMEFRAME + SESSION + TIMEZONE + BAR ANCHOR/OFFSET + PROVIDER AGGREGATION`

Additional ranking input:

`SIMULTANEOUS BREAK / BREADTH`

Additional persistent structure:

`PRIOR OUTSIDE RANGE / THREE -> BROADENING / RECLAIM CONTEXT`

## Do not over-encode

Do not:
- treat every opposing lower-timeframe bar as invalidating a higher-timeframe carrier;
- assume a 3 predicts immediate reversal;
- make simultaneous break part of base setup validity;
- ignore provider/session bar anchoring;
- convert Rob's anti-indicator stance into a ban on separate Minervini/Elder evidence layers;
- hard-code Tuesday as a superior trading day;
- infer institutional intent beyond the observable breadth condition.
