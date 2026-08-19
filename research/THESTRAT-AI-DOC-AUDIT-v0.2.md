# TheStrat.ai Documentation Audit v0.4

Date: 2026-08-19

## Purpose

Systematically cross-check the deterministic Trading System against current TheStrat.ai education/help material. TheStrat.ai is treated as a high-value operational source from Sara Strat Sniper / Alex's Options and TheStrat LLC, while Rob Smith remains the canonical authority if a conflict appears.

Audit method:

`DOC / VISUAL -> OBSERVABLE RULE -> ENGINE COMPARISON -> CONFIRM / REFINE / MISSING / CONFLICT -> TEST BEFORE MERGE`

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

`signal-schema.js` now represents all three while allowing reclaim to remain unknown.

## Level of Reclaim audit — refined in v0.4

The current indexed exhaustion material gives additional management semantics but still does **not** provide enough machine-readable detail to justify one universal reclaim formula.

Confirmed:
- when time exhaustion rises, the trader tightens the level of defense;
- after magnitude, defense can be tightened to the nearest valid Level of Reclaim;
- after a broadening range completes and price moves back inside a prior range, reclaim levels become active structural references;
- the material describes the directional relationship as failing one side of the prior range and targeting the other.

Not yet source-verified pattern-by-pattern:
- exact 2-2 reclaim price;
- exact 2-1-2 reclaim price;
- exact 3-1-2 reclaim price;
- exact hammer/shooter reclaim price;
- whether any reclaim rule changes by setup variation or context.

Therefore:
- `levelOfReclaim` remains `null` unless explicitly source-verified;
- midpoint stop is not silently substituted;
- structure stop is not silently substituted;
- reclaim provenance and verification remain explicit fields.

If the dedicated stop-loss / reclaim animation is not recoverable from the site, request that specific screen recording from the user.

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

Current help material supports the structural idea of movement back through prior ranges running pivot after pivot. The staircase detector remains based on Sara's directly published scanner geometry:
- higher lows -> bearish PMG traversal candidate;
- lower highs -> bullish PMG traversal candidate.

An older setup guide labels `3-1-3` as Pivot Machine Gun. Do not alias that historical/alternate label to `PMG_STAIRCASE` without a dedicated current source resolving the terminology.

### PMG objective integration — new in v0.4

PMG levels are now connected to the production objective machinery through `pmg-objective-pipeline.js`.

Locked order:

`PMG GEOMETRY -> MATCHING REVERSAL IN FORCE -> SETUP MAGNITUDE -> SEQUENTIAL PMG LEVELS -> PRICE EXHAUSTION`

Safeguards:
- PMG geometry alone cannot create a trade;
- setup-defined magnitude stays first;
- PMG levels only become post-magnitude targets when they lie beyond magnitude;
- price-path order controls promotion;
- no universal PMG spacing threshold is invented;
- clearing the current PMG stack creates price-exhaustion context, not an automatic reversal prediction.

Focused executable fixture: `tests/pmg-objective-pipeline-validation.js`.

## Timeframe support

The current scanner/docs independently support higher-timeframe analysis including Quarterly and Yearly context. The timeframe-agnostic engine ladder remains:

`Y -> Q -> M -> W -> D -> 60 -> 30 -> 15 -> 5`

Q/Y remain supported context, never mandatory universal filters.

## Current production paths

Signal path:

`CORE SETUP -> NORMALIZED SIGNAL -> SIGNAL LIFECYCLE -> DOMINO / CARRIER STATE`

Objective path:

`SETUP MAGNITUDE -> STRUCTURAL TARGETS / PMG LEVELS -> TARGET HIERARCHY -> OBJECTIVE STATE -> PRICE EXHAUSTION`

## Audit priority from here

1. dedicated Levels of Reclaim / stop-loss visual material;
2. exact 2-2 reclaim geometry;
3. exact 2-1-2 reversal/continuation geometry;
4. exact 3-1-2 geometry;
5. hammers and shooters;
6. take-action window;
7. dedicated PMG material / terminology resolution;
8. remaining expansion/gap setups.

## Do-not-assume list

- Do not infer a universal PMG spacing threshold.
- Do not alias `3-1-3` to PMG staircase geometry without confirmation.
- Do not treat price exhaustion as an automatic reversal.
- Do not treat time exhaustion as momentum weakness.
- Do not treat lower-timeframe activity as causally activating a higher timeframe.
- Do not assign 3-2 its own magnitude.
- Do not invent Level of Reclaim formulas.
- Do not make Q/Y mandatory alignment filters.

## Status

The deterministic architecture continues to match the current documentation well. PMG is now connected end-to-end to the objective stack. The largest unresolved foundational source item remains exact per-pattern Level of Reclaim geometry; the schema is already prepared to accept it safely once the dedicated visual/source is verified.
