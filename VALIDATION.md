# Engine Validation — v0.26

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
- Real-market validation exists for 2-2, 2-1-2, 3-1-2, and SSS50 examples.
- Research Console remains wired to `core-engine-v0.3.js` and remains in SAMPLE DATA mode.

## Strat Soldier Levels of Reclaim — major conceptual refinement in v0.26

New research note:
- `research/STRAT-SOLDIER-LEVELS-OF-RECLAIM-NOTES.md`

User supplied a transcript from Jermaine / Strat Soldier explicitly describing Levels of Reclaim as material from Rob Smith's original 2018 course.

The transcript resolves the main conceptual ambiguity: **Level of Reclaim is best modeled as a range-relative structural threshold, not as one universal setup-only formula.**

Operational model:

`PRIOR OUTSIDE / BROADENING RANGE -> RECLAIM BOUNDARY -> RANGE RE-ENTERED -> OPPOSITE SIDE OF PRIOR RANGE -> RANGE COMPLETE / PRICE EXHAUSTION`

Confirmed safeguards:
- reclaim is not midpoint stop;
- reclaim is not structure stop;
- reclaim is not automatically the signal candle's open/close;
- reclaim by itself is not an entry signal;
- the source prior range/timeframe must be preserved;
- multiple nested reclaim levels can coexist;
- actionable signals + continuity remain the participation layer;
- after a verified reclaim into a prior range, the opposite side becomes the structural objective for that reclaim context;
- completion of the reclaimed range creates price-exhaustion context, not an automatic reversal prediction.

This changes the upstream reclaim-generation model but does **not** invalidate `reclaim-management.js`. That module can still select the nearest verified defensive reclaim; verified candidates should increasingly be generated from explicit prior-range objects.

Planned range-aware reclaim fields:
- `reclaimId`
- `sourceRangeId`
- `sourceTimeframe`
- `reclaimPrice`
- `direction`
- `rangeHigh`
- `rangeLow`
- `oppositeBoundary`
- `verified`
- `source`
- `consumed`
- `failed`

Planned structural states:
- `RANGE_RECLAIM_PENDING`
- `RANGE_RECLAIMED`
- `TRAVERSING_RECLAIMED_RANGE`
- `RECLAIM_RANGE_TARGET_HIT`
- `RECLAIM_RANGE_FAILED`

## Carrier/reconfirmation refinement

Recent Stat Trading material plus the Strat Soldier reclaim transcript support a cleaner lower-vs-higher-timeframe interpretation model.

A higher-timeframe carrier can remain intact while lower timeframes are:
- `CONFIRMING`
- `NEUTRAL_INSIDE`

Actual threat states remain distinct:
- `OPPOSING_REVERSAL_FORMING`
- `OPPOSING_REVERSAL_IN_FORCE`

Range reclaim adds a separate structural axis:
- `RANGE_RECLAIM_PENDING`
- `RANGE_RECLAIMED`
- `RECLAIM_RANGE_FAILED`

This is more precise than generic momentum-weakening warnings and should feed the guidance-card layer directly.

## TheStrat.ai documentation audit — v0.6

Audit file:
- `research/THESTRAT-AI-DOC-AUDIT-v0.2.md` (content advanced to v0.6)

The prior search for a universal reclaim formula has been reframed. Exact reclaim prices still require source-range geometry, but the architecture no longer depends on a single formula for every 2-2 / 2-1-2 / 3-1-2 variation.

Current high-value findings:
- continuity = evidence, signal = timing, broadening formation = map/magnitude;
- time expiration and price completion are separate;
- multiple timeframes can independently carry a thesis;
- a completed signal cannot justify fresh size by itself;
- 3-2 carries no setup-defined magnitude and must borrow a higher-timeframe objective;
- kicker is not standalone and requires fast lower-timeframe reconfirmation;
- prior-range pivots support PMG/target-fuel context;
- reclaim is a structural gateway into a prior range;
- the opposite side of that reclaimed range becomes the structural objective.

## Production paths

Signal path:

`CORE SETUP -> NORMALIZED SIGNAL -> SIGNAL LIFECYCLE -> DOMINO / CARRIER STATE`

Objective path:

`SETUP MAGNITUDE -> STRUCTURAL TARGETS / PMG LEVELS -> TARGET HIERARCHY -> OBJECTIVE STATE -> PRICE EXHAUSTION`

Reclaim path:

`PRIOR RANGE / OUTSIDE BAR -> VERIFIED RECLAIM BOUNDARY -> RANGE RE-ENTRY STATE -> OPPOSITE RANGE OBJECTIVE -> MANAGEMENT / GUIDANCE`

Management path:

`VERIFIED RECLAIM LEVELS -> NEAREST DEFENSIVE RECLAIM -> MANAGEMENT STATE -> GUIDANCE CARD / FUTURE RULE ENGINE`

## Next validation/build work

1. implement a range-aware reclaim state/schema module;
2. connect reclaim range completion into the objective/exhaustion layer;
3. implement carrier-relative lower-timeframe interpretation states;
4. inspect 2-2 / 2-1-2 / 3-1-2 visuals to map reclaim lines to explicit prior ranges;
5. validate lower-to-higher timeframe carrier advancement/negation on real historical charts;
6. add explicit timeframe/session/bar-anchor metadata to the data model;
7. connect a low-cost historical data adapter and begin broader audited scenario backtesting.

The Research Console remains in sample-data mode until real-market validation and data-semantics layers are materially complete.
