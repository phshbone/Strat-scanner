# TheStrat.ai Documentation Audit v0.6

Date: 2026-08-19

## Purpose

Systematically cross-check the deterministic Trading System against current TheStrat.ai education/help material and high-value Strat educator material. TheStrat.ai is treated as a high-value operational source from Sara Strat Sniper / Alex's Options and TheStrat LLC, while Rob Smith remains the canonical authority if a conflict appears.

Audit method:

`DOC / VISUAL / TRANSCRIPT -> OBSERVABLE RULE -> ENGINE COMPARISON -> CONFIRM / REFINE / MISSING / CONFLICT -> TEST BEFORE MERGE`

Animations and diagrams are valid audit evidence for price sequence and geometry. If a specific embedded animation cannot be inspected reliably, request only that clip from the user rather than the full library.

## Confirmed architecture

### Continuity + signals + broadening formations

Current material separates:
- continuity = evidence;
- actionable signal = timing;
- broadening formation = map / magnitude.

Lower-timeframe signals can time movement into higher-timeframe objectives, but they do not automatically place the higher timeframe in force. Each timeframe remains an independent observable carrier.

### Signal lifetime / time exhaustion

An actionable signal is tied to the bar in which it exists. Time exhaustion measures the time remaining in that signal bar. Multiple timeframes can independently carry the same thesis.

Implemented in `signal-lifecycle.js` and `exhaustion.js` without invented universal time thresholds.

### Price exhaustion / magnitude completion

Magnitude completion is separate from time expiration. A completed signal cannot justify new size by itself. Continued participation requires fresh evidence, such as another active carrier or a new signal.

### Three-price signal model

Current material explicitly describes:
1. trigger / signal;
2. target / magnitude;
3. Level of Reclaim.

`signal-schema.js` represents all three while allowing reclaim to remain unknown.

## Level of Reclaim audit — materially refined in v0.6

A user-supplied Strat Soldier / Jermaine transcript materially resolves the main conceptual ambiguity around Levels of Reclaim. Jermaine states that the concept comes from Rob Smith's original 2018 course and explains that reclaim levels are used to represent re-entry into prior outside-bar / broadening ranges without drawing a dense web of diagonal broadening lines.

The most important conclusion is that Level of Reclaim is best modeled as **range-relative structural geometry**, not as one universal setup-only formula.

Confirmed from the transcript and current docs:
- price can reclaim back into a prior Scenario 3 / outside-bar / broadening range;
- once that prior range is re-entered, the opposite side of that range becomes the active structural objective;
- multiple reclaim levels can exist across nested/fractal prior ranges;
- actionable signals and timeframe continuity still control participation; a reclaim line by itself is not an entry signal;
- hitting the opposite side completes that reclaimed range and creates price-exhaustion context;
- reclaim is not synonymous with midpoint stop or structure stop;
- reclaim provenance must preserve the prior range/timeframe that created the level.

This means the prior audit question, "what is the universal reclaim formula for 2-2 / 2-1-2 / 3-1-2?", was likely framed too narrowly. The safer production model is:

`PRIOR RANGE / OUTSIDE BAR -> RECLAIM BOUNDARY -> RANGE RE-ENTERED -> OPPOSITE RANGE BOUNDARY / MAGNITUDE`

Exact reclaim prices still must be extracted from the relevant source range geometry, but the engine no longer needs to wait for one universal formula that may not exist.

### Required range-aware reclaim object

Planned / recommended fields:

```text
reclaimId
sourceRangeId
sourceTimeframe
reclaimPrice
direction
rangeHigh
rangeLow
oppositeBoundary
verified
source
consumed
failed
```

Potential structural states:
- `RANGE_RECLAIM_PENDING`
- `RANGE_RECLAIMED`
- `TRAVERSING_RECLAIMED_RANGE`
- `RECLAIM_RANGE_TARGET_HIT`
- `RECLAIM_RANGE_FAILED`

### Existing reclaim management remains valid

`reclaim-management.js` can continue selecting the nearest verified defensive reclaim. The change is upstream: verified reclaim candidates should increasingly come from explicit prior-range objects rather than from a setup-only formula.

## 3-2 safeguard

Current docs define 3-2 as an outside bar followed directly by a directional 2. It can be reversal or continuation depending on the side broken.

Critical rule:
- 3-2 expands range and has no magnitude of its own;
- it must borrow a valid higher-timeframe objective;
- the engine must never fabricate a setup-defined magnitude for 3-2.

`signal-schema.js` supports `magnitude = null` plus explicit borrowed magnitude/timeframe provenance.

## Kicker — later module

Current docs define a kicker as a gap-plus-reversal structure.

Locked safeguards:
- kicker is not a standalone entry;
- fast 1/3/5-minute reconfirmation supplies the actual entry/out mechanics;
- kicker does not create its own magnitude;
- prior-range pivots and broadening structure supply objectives.

## PMG — target/fuel concept

The staircase detector remains based on Sara's directly published scanner geometry:
- higher lows -> bearish PMG traversal candidate;
- lower highs -> bullish PMG traversal candidate.

An older setup guide labels `3-1-3` as Pivot Machine Gun. Do not alias that alternate label to `PMG_STAIRCASE` without dedicated current confirmation.

PMG is connected through `pmg-objective-pipeline.js`:

`PMG GEOMETRY -> MATCHING REVERSAL IN FORCE -> SETUP MAGNITUDE -> SEQUENTIAL PMG LEVELS -> PRICE EXHAUSTION`

## Carrier / reconfirmation refinement

Recent Stat Trading material plus the Strat Soldier transcript support a cleaner distinction between confirmation and negation across timeframes.

A higher-timeframe thesis can remain intact while lower timeframes print:
- confirming directional 2s;
- inside bars that do not reverse against the carrier;
- fresh lower-timeframe actionable signals that reconfirm the higher-timeframe direction.

A meaningful opposing reversal / reclaim failure is different from ordinary pullback noise.

Carrier-relative states remain appropriate:
- `CONFIRMING`
- `NEUTRAL_INSIDE`
- `OPPOSING_REVERSAL_FORMING`
- `OPPOSING_REVERSAL_IN_FORCE`

Range-aware reclaim adds another orthogonal state axis:
- `RANGE_RECLAIM_PENDING`
- `RANGE_RECLAIMED`
- `RECLAIM_RANGE_FAILED`

## Timeframe support

The timeframe-agnostic ladder remains:

`Y -> Q -> M -> W -> D -> 60 -> 30 -> 15 -> 5`

Q/Y remain supported context, never mandatory universal filters.

Jermaine's personal implementation preference of month -> week -> day/60 reconfirmation should be treated as a configurable strategy profile/evidence rule, not a universal hard filter.

## Current production paths

Signal path:

`CORE SETUP -> NORMALIZED SIGNAL -> SIGNAL LIFECYCLE -> DOMINO / CARRIER STATE`

Objective path:

`SETUP MAGNITUDE -> STRUCTURAL TARGETS / PMG LEVELS -> TARGET HIERARCHY -> OBJECTIVE STATE -> PRICE EXHAUSTION`

Reclaim path (refined):

`PRIOR RANGE / OUTSIDE BAR -> VERIFIED RECLAIM BOUNDARY -> RANGE RE-ENTRY STATE -> OPPOSITE RANGE OBJECTIVE -> MANAGEMENT / GUIDANCE`

Management path:

`VERIFIED RECLAIM LEVELS -> NEAREST DEFENSIVE RECLAIM -> MANAGEMENT STATE -> GUIDANCE CARD / FUTURE RULE ENGINE`

## Audit priority from here

1. build range-aware reclaim state/schema from source range objects;
2. inspect exact 2-2 / 2-1-2 / 3-1-2 visuals to see how their reclaim lines map to prior ranges;
3. hammers and shooters;
4. take-action window;
5. dedicated PMG terminology material;
6. remaining expansion/gap setups.

## Do-not-assume list

- Do not infer a universal PMG spacing threshold.
- Do not alias `3-1-3` to PMG staircase geometry without confirmation.
- Do not treat price exhaustion as an automatic reversal.
- Do not treat time exhaustion as momentum weakness.
- Do not treat lower-timeframe activity as causally activating a higher timeframe.
- Do not assign 3-2 its own magnitude.
- Do not force Level of Reclaim into one setup-only formula.
- Do not equate reclaim with midpoint stop or structure stop.
- Do not allow unverified reclaim candidates to drive management.
- Do not make Q/Y mandatory alignment filters.

## Status

The largest conceptual Level-of-Reclaim ambiguity is now substantially resolved: reclaim is best treated as a verified structural gateway back into a prior range, with the opposite side of that range becoming the active objective. Exact price derivation still needs source-range geometry, but the architecture no longer depends on discovering one universal reclaim formula.
