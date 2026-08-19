# TheStrat.ai Documentation Audit v0.5

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

`signal-schema.js` represents all three while allowing reclaim to remain unknown.

## Level of Reclaim audit — refined in v0.5

Current indexed material confirms the management role of reclaim more clearly than its per-pattern derivation.

Confirmed:
- when time exhaustion rises, the level of defense can be tightened;
- after magnitude, defense can be tightened to the nearest valid Level of Reclaim;
- once price is back inside a previous range, reclaim levels become active structural references;
- a completed signal cannot justify fresh size by itself unless another active carrier is taking over;
- trigger, magnitude, and reclaim are distinct prices.

Still not source-verified pattern-by-pattern:
- exact 2-2 reclaim price;
- exact 2-1-2 reclaim price;
- exact 3-1-2 reclaim price;
- exact hammer/shooter reclaim price;
- whether reclaim geometry changes by variation/context.

Implementation consequence:
- `levelOfReclaim` remains `null` unless explicitly source-verified;
- midpoint stop is not substituted;
- structure stop is not substituted;
- inferred pivots are not silently promoted to reclaim.

### Reclaim management layer — new in v0.5

Added `reclaim-management.js` to handle verified reclaim levels without pretending to know their unsourced origin.

Deterministic rule:
- bullish position -> nearest defensive reclaim = highest verified reclaim below current price;
- bearish position -> nearest defensive reclaim = lowest verified reclaim above current price;
- equality at the selected reclaim counts as a breach;
- unverified reclaim candidates cannot drive management guidance.

After magnitude, with no higher-timeframe carrier active, the management state can emit `TIGHTEN_TO_NEAREST_RECLAIM` when a verified defensive level exists.

This is a selection/management rule, not a reclaim-generation formula.

See:
- `reclaim-management.js`
- `tests/reclaim-management-validation.js`
- `RECLAIM-MANAGEMENT-SPEC.md`

If the dedicated stop-loss / reclaim animation is not recoverable from the site, request only that specific screen recording from the user.

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

PMG is now connected through `pmg-objective-pipeline.js`:

`PMG GEOMETRY -> MATCHING REVERSAL IN FORCE -> SETUP MAGNITUDE -> SEQUENTIAL PMG LEVELS -> PRICE EXHAUSTION`

## Timeframe support

The timeframe-agnostic ladder remains:

`Y -> Q -> M -> W -> D -> 60 -> 30 -> 15 -> 5`

Q/Y remain supported context, never mandatory universal filters.

## Current production paths

Signal path:

`CORE SETUP -> NORMALIZED SIGNAL -> SIGNAL LIFECYCLE -> DOMINO / CARRIER STATE`

Objective path:

`SETUP MAGNITUDE -> STRUCTURAL TARGETS / PMG LEVELS -> TARGET HIERARCHY -> OBJECTIVE STATE -> PRICE EXHAUSTION`

Management path now begins:

`VERIFIED RECLAIM LEVELS -> NEAREST DEFENSIVE RECLAIM -> MANAGEMENT STATE -> GUIDANCE CARD / FUTURE RULE ENGINE`

## Audit priority from here

1. exact 2-2 reclaim visual/geometry;
2. exact 2-1-2 reclaim visual/geometry;
3. exact 3-1-2 reclaim visual/geometry;
4. hammers and shooters;
5. take-action window;
6. dedicated PMG terminology material;
7. remaining expansion/gap setups.

## Do-not-assume list

- Do not infer a universal PMG spacing threshold.
- Do not alias `3-1-3` to PMG staircase geometry without confirmation.
- Do not treat price exhaustion as an automatic reversal.
- Do not treat time exhaustion as momentum weakness.
- Do not treat lower-timeframe activity as causally activating a higher timeframe.
- Do not assign 3-2 its own magnitude.
- Do not invent Level of Reclaim formulas.
- Do not allow unverified reclaim candidates to drive management.
- Do not make Q/Y mandatory alignment filters.

## Status

The deterministic architecture continues to match the current documentation well. PMG is connected end-to-end to the objective stack, and reclaim management can now consume verified reclaim levels safely. The remaining source gap is exact per-pattern reclaim geometry; once verified, those formulas can feed the existing schema/management layer without redesigning the architecture.
