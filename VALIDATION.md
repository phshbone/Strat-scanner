# Engine Validation — v0.21

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
- Actionable signal lifecycle layer: **25/25 PASS locally** in `tests/signal-lifecycle-validation.js`.
- Normalized actionable-signal schema: focused harness added in `tests/signal-schema-validation.js`; execution could not be re-run in this tool session because the local runtime could not resolve GitHub.
- Real-market validation exists for 2-2, 2-1-2, 3-1-2, and SSS50 examples.
- Research Console remains wired to `core-engine-v0.3.js` and remains in SAMPLE DATA mode.

## TheStrat.ai documentation audit — expanded in v0.21

Current audit file:
- `research/THESTRAT-AI-DOC-AUDIT-v0.2.md` (content advanced to v0.3)

New confirmed/refined points:
- continuity = evidence, signal = timing, broadening formation = map/magnitude;
- signal expiration and price completion remain separate concepts;
- multiple timeframes can independently carry the same directional thesis;
- after magnitude, a completed signal cannot justify new size by itself; continuation needs a fresh signal or another active higher-timeframe carrier;
- 3-2 has no setup-defined magnitude and must borrow a validated higher-timeframe objective;
- kicker is not standalone and requires fast lower-timeframe reconfirmation;
- moves back through prior ranges are structurally preferred PMG/target-fuel contexts over fresh extremes;
- exact per-pattern Level of Reclaim geometry remains under audit and must not be inferred from midpoint or structure stops.

## Normalized actionable-signal schema — new in v0.21

New module:
- `signal-schema.js`

New focused harness:
- `tests/signal-schema-validation.js`

Purpose: standardize the setup object before lifecycle/domino/objective layers consume it.

Fields include:
- `setupId`
- `setupFamily`
- `direction`
- `timeframe`
- `trigger`
- `magnitude`
- `magnitudeSource`
- `borrowedMagnitude`
- `borrowedMagnitudeTimeframe`
- `levelOfReclaim`
- `reclaimSource`
- `reclaimVerified`
- signal start/expiration metadata
- reference/path metadata

Safeguards:
- unknown reclaim remains `null`;
- midpoint/structure stop is never silently substituted for reclaim;
- reclaim provenance and source verification are explicit;
- setup magnitude is preferred when present;
- expansion setups may carry `magnitude = null` and explicitly borrow a higher-timeframe magnitude;
- invalid direction/trigger input is rejected.

The focused harness contains 20 assertions. It was added to the repository, but this turn's local execution attempt could not run because the runtime could not resolve `github.com`; therefore this file is not being reported as newly PASS-verified in v0.21.

## Signal lifecycle

`signal-lifecycle.js` represents a signal as a time-bounded state:
- `NOT_STARTED`
- `STANDBY`
- `ACTIVE`
- `EXPIRED`
- `COMPLETED`

Rules:
- bullish in-force strictly above trigger;
- bearish in-force strictly below trigger;
- equality is not in force;
- signal expires when its triggering bar closes;
- magnitude completion is separate from time expiration;
- carrier timeframes include only currently active signals.

## Exhaustion terminology

Time exhaustion and price exhaustion remain separate.

- Time exhaustion = how much time remains in the active signal bar.
- Price exhaustion = magnitude completion / fresh-extreme context.

Neither is an automatic reversal signal.

## PMG terminology safeguard

Keep separate:
- `PMG_STAIRCASE` = sequential higher-low/lower-high target geometry;
- `3-1-3` = separate pattern identifier unless dedicated current source material proves equivalence.

PMG geometry itself is not a trade trigger.

## Timeframe / domino state

Supported ladder:

`Y -> Q -> M -> W -> D -> 60 -> 30 -> 15 -> 5`

Yearly and Quarterly remain supported but not mandatory filters. Lower timeframes cannot falsely activate higher-timeframe triggers.

## Production paths

Objective path:

`SETUP-DEFINED MAGNITUDE -> STRUCTURAL QUALIFICATION -> TARGET HIERARCHY -> OBJECTIVE STATE -> PRICE EXHAUSTION`

Signal path:

`CORE SETUP -> NORMALIZED SIGNAL -> SIGNAL LIFECYCLE -> DOMINO / CARRIER STATE -> OBJECTIVE / MANAGEMENT CONTEXT`

## Next validation/build work

1. continue the TheStrat.ai audit, prioritizing dedicated Level of Reclaim / stop-loss material and exact 2-2 / 2-1-2 / 3-1-2 visuals;
2. source-verify reclaim geometry pattern-by-pattern and populate `levelOfReclaim` only where proven;
3. integrate normalized signal/lifecycle metadata into actual core-engine setup objects;
4. feed those real setup objects into timeframe-domino carrier state;
5. integrate PMG levels through the production target hierarchy/objective pipeline;
6. validate lower-to-higher timeframe advancement on real historical charts;
7. add explicit timeframe/session/anchor metadata to the data model;
8. connect a low-cost historical data adapter and begin broader audited scenario backtesting.

The Research Console remains in sample-data mode until the real-market validation and data-semantics layers are materially complete.
