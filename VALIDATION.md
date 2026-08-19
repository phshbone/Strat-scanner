# Engine Validation — v0.28

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

## Rob Smith FinTwit seminar — canonical reinforcement in v0.28

New direct-source research note:
- `research/ROB-SMITH-FINTWIT-SEMINAR-CANONICAL-NOTES.md`

The user supplied a transcript of a Rob Smith FinTwit seminar. Because this is direct Rob Smith teaching, it has canonical authority over later execution refinements where a true rules conflict appears.

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

Bar construction is now treated as a canonical implementation requirement, not a provider cosmetic detail.

Intraday data must preserve:
- market timezone;
- session type;
- regular vs extended-hours inclusion;
- timeframe;
- bar anchor / offset;
- provider aggregation semantics.

Historical validation must compare identical aggregation rules. A 60-minute Strat setup from one provider cannot be assumed equivalent to a differently anchored 60-minute series.

### Simultaneous-break consequence

Future scanner/ranking layer should calculate observable breadth across a defined sector/universe. Do not invent a universal percentage threshold before source verification and historical testing.

### Hybrid-overlay safeguard reinforced

Rob's direct teaching rejects indicators as necessary for pure Strat interpretation. The project therefore keeps strict source separation:
- Strat = canonical setup/direction/magnitude/timeframe state;
- Minervini = structural quality/ranking overlay;
- Elder = trend/momentum/discipline overlay;
- user plan = risk/behavioral guardrails.

Those overlays may change trade desirability or management, but may not mutate pure Strat validity.

## Jermaine / Benzinga purist baseline

Research note:
- `research/JERMAINE-BENZINGA-PURIST-BASELINE-NOTES.md`

Important baseline observations remain:
- three universal truths = actionable signals, timeframe continuity, broadening formations;
- forming inside bars are unresolved/no-trade contexts until a valid break;
- mother-bar confinement is chop context, not automatic setup invalidation;
- M/W/D/60 is Jermaine's primary profile;
- small initial size, tight stops, add-to-winners, re-entry, and loss-limit rules are execution/risk preferences rather than universal setup law.

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

The new Rob transcript further supports keeping ordinary lower-timeframe opposition distinct from actual higher-timeframe negation.

## Strat Soldier Levels of Reclaim — current conceptual model

Operational model remains:

`PRIOR OUTSIDE / BROADENING RANGE -> RECLAIM BOUNDARY -> RANGE RE-ENTERED -> OPPOSITE SIDE OF PRIOR RANGE -> RANGE COMPLETE / PRICE EXHAUSTION`

The Rob seminar's failed-2/outside-bar discussion further supports preserving the exact source range whenever the opposite boundary is promoted as magnitude.

## Production paths

Signal path:

`CORE SETUP -> NORMALIZED SIGNAL -> SIGNAL LIFECYCLE -> DOMINO / CARRIER STATE`

Carrier interpretation path:

`ACTIVE HIGHER-TF CARRIER -> LOWER-TF CONFIRM / INSIDE / CONFLICT / REVERSAL / RANGE EXIT -> INTERPRETATION STATE -> GUIDANCE CARD`

Objective path:

`SETUP MAGNITUDE -> STRUCTURAL TARGETS / PMG LEVELS -> TARGET HIERARCHY -> OBJECTIVE STATE -> PRICE EXHAUSTION`

Reclaim path:

`PRIOR RANGE / OUTSIDE BAR -> VERIFIED RECLAIM BOUNDARY -> RANGE RE-ENTRY STATE -> OPPOSITE RANGE OBJECTIVE -> MANAGEMENT / GUIDANCE`

Data path requirement (expanded):

`OHLCV + SYMBOL + TIMEFRAME + MARKET TIMEZONE + SESSION + BAR ANCHOR/OFFSET + PROVIDER AGGREGATION`

## Next validation/build work

1. implement a range-aware reclaim state/schema module;
2. add explicit timeframe/session/bar-anchor metadata to the data model before broader intraday historical validation;
3. connect reclaim range completion into the objective/exhaustion layer;
4. execute carrier-interpretation/schema/adapter harnesses in Node or CI and repair failures;
5. validate lower-to-higher timeframe carrier advancement/negation on real historical charts using matched aggregation semantics;
6. implement simultaneous-break breadth as a separate scanner/ranking evidence layer;
7. connect a low-cost historical data adapter and begin broader audited scenario backtesting;
8. keep Minervini, Elder, and user-plan rules as separate ranking/guardrail layers rather than changing pure Strat validity.

The Research Console remains in sample-data mode until real-market validation and data-semantics layers are materially complete.
