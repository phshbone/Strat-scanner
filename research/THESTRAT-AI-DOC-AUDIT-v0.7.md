# TheStrat.ai Documentation Audit v0.7

Date: 2026-09-23

## Purpose

Refresh the Trading System against the current TheStrat.ai documentation without allowing documentation changes to silently alter production behavior.

TheStrat remains the core trading methodology. External methods such as Minervini and Elder may support selection, context, psychology, or risk, but they do not redefine Strat setup validity.

Audit method:

`CURRENT DOC -> OBSERVABLE RULE -> EXISTING ENGINE -> CONFIRM / REFINE / MISSING / CONFLICT -> TEST BEFORE MERGE`

Source priority:
1. Rob Smith recorded teaching when available.
2. Current TheStrat.ai documentation as TheStrat LLC's actively maintained operational reference.
3. Educator material as supporting evidence, never as authority over a conflicting primary rule.

## Current documentation state

The current TheStrat.ai site explicitly frames the method around three universal truths:

1. price can only trade 1 / 2 / 3 relative to the prior bar;
2. price must trade in the direction of the most 2s and 2s going 3 across multiple timeframes;
3. price discovery occurs as a broadening formation.

The current site also makes an important distinction between:
- Most 2s = directional evidence;
- opening-price relationships = continuity/conflict/override/uncoupling;
- FTFC = unanimous same-side relationship to four aligned opens;
- actionable signal = trigger/timing;
- broadening / prior range = structural map and magnitude.

These layers must remain separate in the engine.

## CONFIRMED — current architecture remains aligned

### 1 / 2U / 2D / 3 classification

Existing deterministic scenario classification remains foundational.

### FTFC as context, not setup creation

Current docs confirm that FTFC is related to, but not identical with, the Most-2s principle. Existing separation between setup validity and timeframe continuity remains correct.

The UI should show the actual timeframe states rather than only an `ALIGNED` label.

### Signal lifetime

Current documentation continues to support trigger-based actionable signals with time-bounded bar life. Existing `signal-lifecycle.js` remains conceptually aligned.

### Broadening / prior-range structure

The current docs continue to frame price discovery as range expansion and reversals back through previous ranges. Existing broadening, range-reclaim, target-hierarchy and exhaustion architecture remains useful.

### 3-2 safeguard

Expansion setups must not receive an invented magnitude. Existing null/borrowed-magnitude protection remains correct.

### PMG

PMG remains a reversal-through-stacked-pivots / forced-covering target-fuel concept. Existing PMG geometry + matching Strat reversal requirement remains appropriate.

## REFINE — current documentation is more specific than our implementation

### Most 2s

This is the highest-priority refinement.

Current docs define the operating count as:
- classify each constituent on a higher timeframe;
- sample that higher-timeframe state using the timeframe below;
- count 2U, 2D, 1 and 3 states across the universe;
- treat a 3 as zero directional evidence once both sides have broken;
- retain the direction of a 2 going 3 as rejection evidence before the full 3 completes.

Example operating pattern:
- daily 2s sampled every 5 minutes;
- weekly 2s sampled on the 60;
- monthly 2s sampled on the daily.

Our current breadth module is generic participation context. It is not yet a faithful Most-2s implementation.

Required action:
- build a separate `MOST_2S` research module;
- do not mutate existing generic breadth until equivalence is proven;
- preserve 1 and unresolved 3 states explicitly;
- do not let Most 2s create a trade without an actionable Strat signal.

### FTFC / conflict / override / uncoupling

Current docs distinguish:
- FTFC;
- conflict;
- Day + 60 override for immediate control;
- opening-price flip;
- uncoupling timing.

Our continuity engine models open-relative states and flips, but these named control relationships are not yet fully encoded as a dedicated deterministic state machine.

Required action:
- audit exact definitions and timing rules;
- add only after deterministic fixtures exist;
- preserve the visual timeframe-dot UI independently of deeper control-state logic.

### 2-2-2 continuation / continuation trading

New documentation dated 2026-09-10 defines repeated same-direction 2s as continuation and recommends entering the higher-timeframe run through a lower-timeframe reversal rather than chasing the third completed 2.

Required action:
- add a research-only continuation detector;
- separate `HTF continuation state` from `LTF entry signal`;
- do not promote to production until trigger/stop/target and bar-color requirements are fully tested.

### Momentum vs retracement classification

New documentation dated 2026-08-27 classifies an actionable entry by the color of the bar before the signal:
- same color as intended direction -> momentum;
- opposite color -> retracement.

This classification cuts across reversal/continuation labels.

Required action:
- add as descriptive context only at first;
- no ranking or scoring until historical evidence exists;
- preserve the separation between scenario direction and candle color.

### Simultaneous breaks

Current docs treat correlated assets breaking 2 in the same direction at the same time as important participation evidence.

Required action:
- research as a separate market/sector confirmation layer;
- do not allow it to manufacture a setup;
- exact simultaneity window and universe definition must be explicit.

## MISSING / NOT YET PRODUCTION-COMPLETE

The following current documented concepts are not yet complete production modules:

- Hammer
- Shooter
- Inside-Outside-Inside (I-O-I)
- Kicker
- 30/60 gapper
- Gap-up buy / gap-down sell range-reentry variants
- Measured Move
- 2-2-2 Continuation
- Momentum vs Retracement labels
- Simultaneous Breaks
- dedicated Most-2s engine
- full conflict / override / uncoupling state model
- complete 1-3 / 1-3-2 family
- complete 1-2-2 / 3-2-2 family
- dedicated Natural Buyers / Natural Sellers implementation

Some of these concepts overlap existing broadening, reclaim, PMG, target and exhaustion modules. Do not duplicate existing logic merely to match terminology.

## UI implications

The current docs reinforce the simplified candidate-card direction.

Primary surface:
- symbol / timeframe;
- current Strat setup;
- actual FTFC timeframe states as green/red/neutral dots;
- ACTIONABLE only when a deterministic setup is in force and required context gates are satisfied;
- trigger and magnitude;
- Why? / Chart / Paper Trade.

Secondary detail:
- Most-2s;
- market/sector participation;
- exact FTFC/control-state explanation;
- historical comparable evidence;
- optional Minervini/Elder context;
- provider/semantic diagnostics.

The first screen should not expose research-engine internals unless the user expands Details.

## Do-not-merge rules

- Do not convert new documentation into production code on wording alone.
- Do not let Most 2s, FTFC, breadth, Minervini or Elder create a Strat setup.
- Do not equate candle color with 2U / 2D scenario direction.
- Do not convert descriptive historical percentages into prediction/confidence.
- Do not assume a documented educator heuristic is a universal Strat law.
- Do not duplicate an existing engine module just because the new docs use different terminology.
- Do not import external-method rules into the Strat core.

## Next implementation order

1. Current-doc inventory and source snapshot — COMPLETE in this audit.
2. Most-2s deterministic research spec and fixtures.
3. FTFC conflict / override / uncoupling audit.
4. 2-2-2 continuation + LTF-entry research spec.
5. Momentum vs Retracement context label.
6. Simultaneous Breaks research spec.
7. Hammer / Shooter / I-O-I / Kicker / Measured Move family.
8. Gap-specific setups.
9. Re-run historical evidence against only promoted deterministic definitions.

## External-method boundary

Minervini and Elder remain support layers.

Minervini may contribute:
- stock selection;
- trend-template context;
- leadership / relative-strength context;
- volatility / contraction observations;
- candidate discovery.

Elder may contribute:
- psychology;
- discipline;
- risk/process framing.

Neither may alter:
- 1 / 2 / 3 classification;
- Strat setup validity;
- trigger/magnitude geometry;
- FTFC facts;
- historical event truth.

Any new Minervini handoff should enter a research-only lane first:

`MINERVINI SOURCE -> EXTRACT RULE -> TAG PURPOSE -> CHECK OVERLAP -> KEEP / ADAPT / REJECT -> ONLY THEN INTEGRATE`

A useful Minervini idea may be retained even if it is never surfaced in the production app. Research intake does not imply adoption.

## Status

The Trading System remains Strat-first. The September 2026 documentation refresh adds meaningful research work, especially Most 2s, control-state timeframe logic, 2-2-2 continuation, momentum/retracement classification and simultaneous breaks. None of these should silently change current production behavior until isolated tests pass.
