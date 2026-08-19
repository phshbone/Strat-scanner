# Engine Validation — v0.22

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
- Normalized actionable-signal schema: focused harness added in `tests/signal-schema-validation.js`; execution was not re-run in the current tool session.
- Core setup -> signal -> lifecycle -> domino adapter: focused harness added in `tests/setup-signal-adapter-validation.js`; execution was not re-run in the current tool session.
- Real-market validation exists for 2-2, 2-1-2, 3-1-2, and SSS50 examples.
- Research Console remains wired to `core-engine-v0.3.js` and remains in SAMPLE DATA mode.

## Core setup -> signal -> domino integration — new in v0.22

New module:
- `setup-signal-adapter.js`

New focused harness:
- `tests/setup-signal-adapter-validation.js`

New spec:
- `SETUP-SIGNAL-ADAPTER-SPEC.md`

This is the first bridge from actual setup objects emitted by `core-engine-v0.3.js` into the newer signal/lifecycle/domino architecture.

Production path is now materially connected as:

`CORE SETUP -> NORMALIZED SIGNAL -> SIGNAL LIFECYCLE -> DOMINO / CARRIER STATE`

Rules and safeguards:
- core setup direction and trigger are preserved;
- setup-defined magnitude is preserved exactly when present;
- no Level of Reclaim is invented;
- signal start/end timestamps must come from the data/session layer;
- non-directional/pending/ambiguous setups do not become actionable signals;
- lifecycle state determines whether a timeframe is an active carrier;
- higher timeframes do not become active unless their own trigger is actually in force;
- mixed bullish/bearish timeframe states remain visible rather than being forced into artificial alignment;
- thesis and execution timeframe identity remain separate.

The focused adapter harness contains 23 checks. It includes a real `detectSetup()`-generated bullish 2-1-2 fixture plus multi-timeframe core-style setup objects. The harness is committed but is **not being reported as newly PASS-verified** in v0.22 because it was not executed in this tool session.

## TheStrat.ai documentation audit

Current audit file:
- `research/THESTRAT-AI-DOC-AUDIT-v0.2.md` (content advanced to v0.3)

Current high-value findings remain:
- continuity = evidence, signal = timing, broadening formation = map/magnitude;
- signal expiration and price completion are separate concepts;
- multiple timeframes can independently carry the same directional thesis;
- after magnitude, a completed signal cannot justify new size by itself; continuation needs a fresh signal or another active higher-timeframe carrier;
- 3-2 has no setup-defined magnitude and must borrow a validated higher-timeframe objective;
- kicker is not standalone and requires fast lower-timeframe reconfirmation;
- prior-range pivots are valid PMG/target-fuel context;
- exact per-pattern Level of Reclaim geometry remains under audit and must not be inferred from midpoint or structure stops.

## Normalized actionable-signal schema

`signal-schema.js` standardizes setup objects before lifecycle/domino/objective layers consume them.

Important fields include:
- setup id/family;
- direction/timeframe;
- trigger;
- magnitude and magnitude source;
- borrowed magnitude/timeframe;
- Level of Reclaim plus verification/source metadata;
- signal start/expiration metadata;
- reference/path metadata.

Unknown reclaim remains `null` until source-verified.

## Signal lifecycle

`signal-lifecycle.js` states:
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
3. execute the new schema/adapter harnesses in an available Node/CI environment and repair any failures;
4. connect PMG levels through the production target hierarchy/objective pipeline;
5. validate lower-to-higher timeframe advancement on real historical charts;
6. add explicit timeframe/session/anchor metadata to the data model;
7. connect a low-cost historical data adapter and begin broader audited scenario backtesting.

The Research Console remains in sample-data mode until the real-market validation and data-semantics layers are materially complete.
