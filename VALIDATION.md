# Engine Validation — v0.30

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
- Range-aware reclaim state/schema layer: **24/24 PASS locally** in `tests/range-reclaim-validation.js`.
- Normalized actionable-signal schema: focused harness exists in `tests/signal-schema-validation.js`; not re-run in this tool session.
- Core setup -> signal -> lifecycle -> domino adapter: focused harness exists in `tests/setup-signal-adapter-validation.js`; not re-run in this tool session.
- Carrier-relative interpretation engine: focused harness added in `tests/carrier-interpretation-validation.js`; not yet executed in this tool session.
- Real-market validation exists for 2-2, 2-1-2, 3-1-2, and SSS50 examples.
- Research Console remains wired to `core-engine-v0.3.js` and remains in SAMPLE DATA mode.

## Range-aware reclaim engine — new in v0.30

New module:
- `range-reclaim.js`

New focused harness:
- `tests/range-reclaim-validation.js`

New specification:
- `RANGE-RECLAIM-SPEC.md`

This is the first production module that implements reclaim as an explicit structural range traversal rather than as a setup-only placeholder.

Structural path:

`PRIOR VERIFIED RANGE -> RECLAIM BOUNDARY -> RANGE RE-ENTRY -> OPPOSITE BOUNDARY OBJECTIVE -> COMPLETION / FAILURE`

### Bullish reclaim traversal

For an upstream-verified prior range `[low, high]`:
- reclaim boundary = range low;
- re-entry requires price strictly above the low;
- opposite-boundary objective = range high;
- target is complete at or above the high;
- after a previously active reclaim, returning to or below the low marks reclaim failure.

### Bearish reclaim traversal

For an upstream-verified prior range `[low, high]`:
- reclaim boundary = range high;
- re-entry requires price strictly below the high;
- opposite-boundary objective = range low;
- target is complete at or below the low;
- after a previously active reclaim, returning to or above the high marks reclaim failure.

### Reclaim states

- `NO_VERIFIED_RECLAIM_RANGE`
- `RANGE_RECLAIM_PENDING`
- `TRAVERSING_RECLAIMED_RANGE`
- `RECLAIM_RANGE_TARGET_HIT`
- `RECLAIM_RANGE_FAILED`

### Objective emission

An actively reclaimed range emits a structural objective with:
- source type `RECLAIMED_RANGE_OPPOSITE_BOUNDARY`;
- exact opposite range boundary as price;
- source range ID;
- source timeframe;
- consumed state when the opposite side is reached.

`buildReclaimStack()` also supports multiple nested verified ranges and orders active objectives by actual price path rather than timeframe prestige.

### Safeguards

- the module does not declare every historical range a valid reclaim range;
- source range must be explicit and `verified=true`;
- reclaim is not midpoint stop;
- reclaim is not structure stop;
- reclaim is not automatically a setup-candle open/close;
- reclaim alone is not an entry signal;
- nested prior ranges may coexist;
- completion produces price-exhaustion context, not an automatic reversal.

Focused local Node execution on 2026-08-19: **24/24 PASS**.

## Rob Smith Tuesday Strat Attack — operational refinement

Direct-source research note:
- `research/ROB-SMITH-TUESDAY-STRAT-ATTACK-OPERATIONAL-NOTES.md`

High-value operational confirmations/refinements:
- breadth / simultaneous-break logic is explicitly based on counting which weekly/daily ranges are being taken in each direction;
- mixed directional participation can correspond to broader-index chop while aligned participation is stronger context;
- inside-day / inside-range conditions remain unresolved until the relevant side breaks;
- waiting for a real setup is explicitly part of the method — `WAIT / NO_ACTION` is a valid system outcome;
- Rob may let the opening settle because gaps/early movement can create noise, but this is execution guidance rather than a universal signal-validity rule;
- new year / quarter / month / week / day periods create new continuity reference opens and therefore require exact calendar/session boundary handling;
- macro thesis and tactical execution remain separate lanes;
- 60-minute signals can remain principal while 30-minute reversals supply tactical entries;
- outside-range side tests, rejection, reclaim, and reversal should remain distinct structural states;
- holiday / year-end participation context may matter as advisory metadata but should not imply direction.

## Rob Smith FinTwit seminar — canonical reinforcement

Direct-source research note:
- `research/ROB-SMITH-FINTWIT-SEMINAR-CANONICAL-NOTES.md`

High-confidence canonical confirmations/refinements:
- Scenario 1 / 2 / 3 definitions are exactly the current engine model;
- Scenario 3 is necessarily a shorter-timeframe broadening formation;
- 2-2, 2-1-2, failed-2 -> 3, and 3-1-2 reversal structures are directly described;
- when one side of a range is taken and the move fails back through, the opposite side is the natural potential-outside magnitude for that source range;
- canonical default continuity profile is M/W/D/60;
- signals remain in force while their signal bar remains open, subject to negation;
- shorter-timeframe signals can reconfirm an already-live higher-timeframe signal;
- multiple signals can stack across D -> W -> M without a lower timeframe falsely creating higher-timeframe activation;
- simultaneous break is a breadth/high-probability context rather than setup validity;
- completed outside/three ranges remain structurally relevant later (`once a three, always a three` concept);
- new timeframe openings matter mechanically;
- Rob explicitly warns that 60-minute charts differ depending on bar anchoring/aggregation.

### Critical data-semantics consequence

Intraday data must preserve:
- market timezone;
- session type;
- regular vs extended-hours inclusion;
- timeframe;
- bar anchor / offset;
- provider aggregation semantics;
- exact period-open identity for Y/Q/M/W/D/Intraday continuity resets.

Historical validation must compare identical aggregation rules. A 60-minute Strat setup from one provider cannot be assumed equivalent to a differently anchored 60-minute series.

## Carrier-relative interpretation engine

Module:
- `carrier-interpretation.js`

States include:
- `CONFIRMING`
- `NEUTRAL_INSIDE`
- `CONFLICT`
- `OPPOSING_REVERSAL_FORMING`
- `OPPOSING_REVERSAL_IN_FORCE`
- `HIGHER_TF_CHANGE`
- `MOTHER_BAR_CONFINED`
- `RANGE_EXIT_CONFIRMING`

## Production paths

Signal path:

`CORE SETUP -> NORMALIZED SIGNAL -> SIGNAL LIFECYCLE -> DOMINO / CARRIER STATE`

Carrier interpretation path:

`ACTIVE HIGHER-TF CARRIER -> LOWER-TF CONFIRM / INSIDE / CONFLICT / REVERSAL / RANGE EXIT -> INTERPRETATION STATE -> GUIDANCE CARD`

Objective path:

`SETUP MAGNITUDE -> STRUCTURAL TARGETS / PMG LEVELS / RECLAIMED-RANGE OBJECTIVES -> TARGET HIERARCHY -> OBJECTIVE STATE -> PRICE EXHAUSTION`

Reclaim path:

`PRIOR VERIFIED RANGE -> RECLAIM BOUNDARY -> RANGE RE-ENTRY STATE -> OPPOSITE RANGE OBJECTIVE -> COMPLETION / FAILURE -> MANAGEMENT / GUIDANCE`

Data path requirement:

`OHLCV + SYMBOL + TIMEFRAME + MARKET TIMEZONE + SESSION + BAR ANCHOR/OFFSET + PROVIDER AGGREGATION + PERIOD OPEN IDENTITY`

Breadth path requirement:

`DEFINED UNIVERSE/SECTOR -> COUNT DIRECTIONAL 2s + FAILED-2->3 EVENTS -> ALIGNED/MIXED BREADTH CONTEXT -> RANKING/GUIDANCE`

## Next validation/build work

1. connect range-reclaim objectives into the existing target hierarchy / objective-exhaustion pipeline;
2. add explicit timeframe/session/bar-anchor/period-open metadata to the data model before broader intraday historical validation;
3. execute carrier-interpretation/schema/adapter harnesses in Node or CI and repair failures;
4. validate lower-to-higher timeframe carrier advancement/negation on real historical charts using matched aggregation semantics;
5. implement simultaneous-break breadth as a separate scanner/ranking evidence layer, including an explicit mixed-breadth state;
6. add `WAIT_NO_ACTIONABLE_SETUP` as a first-class advisory outcome rather than forcing a trade suggestion;
7. connect a low-cost historical data adapter and begin broader audited scenario backtesting;
8. keep Minervini, Elder, and user-plan rules as separate ranking/guardrail layers rather than changing pure Strat validity.

The Research Console remains in sample-data mode until real-market validation and data-semantics layers are materially complete.
