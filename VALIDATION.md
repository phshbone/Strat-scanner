# Engine Validation — v0.27

Date: 2026-08-19

## Current status

- Legacy synthetic regression layer: **44/44 PASS** in the v0.2 expanded harness. Superseded semantics in that file remain historical only.
- Corrected core engine: **15/15 PASS** in `tests/core-engine-v0.3-validation.js`.
- Setup-specific first magnitude: **10/10 PASS** in `tests/setup-magnitude-validation-v0.1.js`.
- Research outcome/scenario layer: **20/20 PASS** in `tests/research-outcomes-validation.js`.
- Explicit time/price exhaustion layer: **21/21 PASS locally** in `tests/exhaustion-validation.js`.
- Structural target qualification layer: **19/19 PASS** in `tests/target-qualification-validation.js`.
- Target hierarchy / de-duplication layer: **18/18 PASS** in `tests/target-hierarchy-validation.js`.
- Integrated multi-timeframe objective pipeline: **20/20 PASS** in `tests/objective-pipeline-validation.js`.
- Timeframe/domino state layer: **20/20 PASS** in `tests/timeframe-domino-validation.js`.
- PMG geometry/actionable-state layer: **21/21 PASS** in `tests/pmg-validation.js`.
- PMG -> production objective integration: **16/16 PASS locally** in `tests/pmg-objective-pipeline-validation.js`.
- Actionable signal lifecycle layer: **25/25 PASS locally** in `tests/signal-lifecycle-validation.js`.
- Level of Reclaim management selection layer: **19/19 PASS locally** in `tests/reclaim-management-validation.js`.
- Normalized actionable-signal schema: focused harness exists in `tests/signal-schema-validation.js`; not re-run in this tool session.
- Core setup -> signal -> lifecycle -> domino adapter: focused harness exists in `tests/setup-signal-adapter-validation.js`; not re-run in this tool session.
- Carrier-relative interpretation engine: focused harness added in `tests/carrier-interpretation-validation.js`; not yet executed in this tool session.
- Real-market validation exists for 2-2, 2-1-2, 3-1-2, and SSS50 examples.
- Research Console remains wired to `core-engine-v0.3.js` and remains in SAMPLE DATA mode.

## Jermaine / Benzinga purist baseline — new in v0.27

New research note:
- `research/JERMAINE-BENZINGA-PURIST-BASELINE-NOTES.md`

The user supplied a long early Jermaine / Benzinga interview that is useful as a purist baseline cross-check against Rob Smith's original Strat teaching.

High-confidence baseline observations:
- three universal truths = actionable signals, timeframe continuity, broadening formations;
- Scenario 1 = inside bar, Scenario 2 = one-side range break, Scenario 3 = outside bar;
- Scenario 3 is a lower-timeframe broadening/battleground context and helps define magnitude;
- hammer goes in force when the next live bar breaks its high;
- shooter goes in force when the next live bar breaks its low;
- the actionable break is live; waiting for the triggering bar to close is not required;
- hammer/shooter morphology is preferred evidence but not required for a valid 2-2 reversal;
- a forming inside bar is not yet an actionable breakout; after close, its range becomes the equilibrium/reference for the next break;
- higher-timeframe inside-bar / mother-bar confinement is a chop context and should reduce trade desirability until price exits the range;
- 2-2, 2-1-2, and 3-1-2 reversals are all explicitly shown;
- M/W/D/60 is Jermaine's primary profile, not a universal timeframe requirement;
- Strat reversals are described as fractal and usable on any timeframe;
- Jermaine's risk style uses small initial size, adds to winners, tight stops, progressive defense, re-entry after failed attempts, and a daily loss limit.

Important source-separation safeguard:
- exact tight-stop placement and dollar daily-loss examples are Jermaine execution/risk preferences, not universal canonical Strat law;
- pure Strat validity remains separate from execution preference and hybrid overlays.

## Carrier-relative interpretation engine — new in v0.27

New module:
- `carrier-interpretation.js`

New focused harness:
- `tests/carrier-interpretation-validation.js`

Purpose: classify lower-timeframe behavior relative to an already-active higher-timeframe carrier without mutating the canonical setup detector.

States:
- `CONFIRMING`
- `NEUTRAL_INSIDE`
- `CONFLICT`
- `OPPOSING_REVERSAL_FORMING`
- `OPPOSING_REVERSAL_IN_FORCE`
- `HIGHER_TF_CHANGE`
- `MOTHER_BAR_CONFINED`
- `RANGE_EXIT_CONFIRMING`
- neutral fallback

Stack-level interpretations:
- `CONFIRMED`
- `STABLE`
- `CAUTION`
- `REVERSAL_AGAINST`
- `CHANGED`
- `NO_ACTIVE_CARRIER`

This formalizes Jermaine's useful continuity language around Control / Confirm / Conflict / Change while preserving the more precise state distinctions developed from the Stat Trading transcript.

Safeguards:
- an inside bar is neutral until its break resolves direction;
- ordinary lower-timeframe conflict is not automatically equivalent to higher-timeframe change;
- an opposing reversal in force is distinct from a merely forming reversal;
- mother-bar confinement is context/ranking, not setup invalidation;
- range exit in the carrier direction is confirming evidence;
- lower timeframes cannot be passed as the carrier itself or a higher timeframe.

The focused harness currently contains 17 checks. It is committed but is **not being reported as PASS-verified** because it has not been executed in this tool session.

## Strat Soldier Levels of Reclaim — current conceptual model

The reclaim transcript remains the strongest conceptual source so far for range-relative reclaim.

Operational model:

`PRIOR OUTSIDE / BROADENING RANGE -> RECLAIM BOUNDARY -> RANGE RE-ENTERED -> OPPOSITE SIDE OF PRIOR RANGE -> RANGE COMPLETE / PRICE EXHAUSTION`

Safeguards:
- reclaim is not midpoint stop;
- reclaim is not structure stop;
- reclaim is not automatically the signal candle's open/close;
- reclaim by itself is not an entry signal;
- the source prior range/timeframe must be preserved;
- multiple nested reclaim levels can coexist;
- actionable signals + continuity remain the participation layer;
- after a verified reclaim into a prior range, the opposite side becomes the structural objective for that reclaim context;
- completion of the reclaimed range creates price-exhaustion context, not an automatic reversal prediction.

## Production paths

Signal path:

`CORE SETUP -> NORMALIZED SIGNAL -> SIGNAL LIFECYCLE -> DOMINO / CARRIER STATE`

Carrier interpretation path:

`ACTIVE HIGHER-TF CARRIER -> LOWER-TF CONFIRM / INSIDE / CONFLICT / REVERSAL / RANGE EXIT -> INTERPRETATION STATE -> GUIDANCE CARD`

Objective path:

`SETUP MAGNITUDE -> STRUCTURAL TARGETS / PMG LEVELS -> TARGET HIERARCHY -> OBJECTIVE STATE -> PRICE EXHAUSTION`

Reclaim path:

`PRIOR RANGE / OUTSIDE BAR -> VERIFIED RECLAIM BOUNDARY -> RANGE RE-ENTRY STATE -> OPPOSITE RANGE OBJECTIVE -> MANAGEMENT / GUIDANCE`

Management path:

`VERIFIED RECLAIM LEVELS -> NEAREST DEFENSIVE RECLAIM -> MANAGEMENT STATE -> GUIDANCE CARD / FUTURE RULE ENGINE`

## Next validation/build work

1. implement a range-aware reclaim state/schema module;
2. connect reclaim range completion into the objective/exhaustion layer;
3. execute the carrier-interpretation/schema/adapter harnesses in Node or CI and repair any failures;
4. inspect 2-2 / 2-1-2 / 3-1-2 visuals to map reclaim lines to explicit prior ranges;
5. validate lower-to-higher timeframe carrier advancement/negation on real historical charts;
6. add explicit timeframe/session/bar-anchor metadata to the data model;
7. connect a low-cost historical data adapter and begin broader audited scenario backtesting;
8. keep Minervini, Elder, and user-plan rules as separate ranking/guardrail layers rather than changing pure Strat validity.

The Research Console remains in sample-data mode until real-market validation and data-semantics layers are materially complete.
