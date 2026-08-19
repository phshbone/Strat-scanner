# Engine Validation — v0.23

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
- Normalized actionable-signal schema: focused harness exists in `tests/signal-schema-validation.js`; not re-run in this tool session.
- Core setup -> signal -> lifecycle -> domino adapter: focused harness exists in `tests/setup-signal-adapter-validation.js`; not re-run in this tool session.
- Real-market validation exists for 2-2, 2-1-2, 3-1-2, and SSS50 examples.
- Research Console remains wired to `core-engine-v0.3.js` and remains in SAMPLE DATA mode.

## PMG objective integration — new in v0.23

New module:
- `pmg-objective-pipeline.js`

New focused harness:
- `tests/pmg-objective-pipeline-validation.js`

New spec:
- `PMG-OBJECTIVE-PIPELINE-SPEC.md`

Production chain:

`PMG GEOMETRY -> MATCHING STRAT REVERSAL IN FORCE -> SETUP MAGNITUDE -> PMG TARGET STACK -> OBJECTIVE STATE -> PRICE EXHAUSTION`

Locked behavior:
- PMG geometry alone is not actionable;
- a matching reversal must already be in force;
- setup-defined magnitude remains the first objective;
- PMG levels beyond magnitude promote sequentially by actual price path;
- bullish and bearish traversal are symmetric;
- opposite-direction reversal does not activate the PMG target stack;
- out-of-force reversal does not create an objective state;
- no universal PMG spacing threshold is invented;
- clearing magnitude plus the current PMG stack sets price-exhaustion context but does not predict reversal.

Focused local Node execution: **16/16 PASS**.

## TheStrat.ai documentation audit — v0.4

Audit file:
- `research/THESTRAT-AI-DOC-AUDIT-v0.2.md` (content advanced to v0.4)

Current high-value findings:
- continuity = evidence, signal = timing, broadening formation = map/magnitude;
- time expiration and price completion remain separate concepts;
- multiple timeframes can independently carry the same thesis;
- a completed signal cannot justify new size by itself;
- 3-2 carries no setup-defined magnitude and must borrow a validated higher-timeframe objective;
- kicker is not standalone and requires fast lower-timeframe reconfirmation;
- prior-range pivots support PMG/target-fuel context;
- after magnitude, defense can tighten to the nearest valid Level of Reclaim;
- exact per-pattern Level of Reclaim geometry is still not sufficiently source-verified to encode universally.

### Level of Reclaim safeguard

The schema continues to store:
- `levelOfReclaim`
- `reclaimSource`
- `reclaimVerified`

Unknown reclaim remains `null`.

Do not silently substitute:
- midpoint stop;
- structure stop;
- an inferred pivot;
- a universal formula.

Exact 2-2 / 2-1-2 / 3-1-2 / hammer / shooter reclaim geometry remains the next source-validation target. If the dedicated site animation is inaccessible, request only that specific screen recording.

## Core setup -> signal -> domino integration

`setup-signal-adapter.js` connects actual core setup objects into the newer state architecture.

Production signal path:

`CORE SETUP -> NORMALIZED SIGNAL -> SIGNAL LIFECYCLE -> DOMINO / CARRIER STATE`

Safeguards:
- setup trigger/direction/magnitude are preserved;
- non-directional or ambiguous setups do not become actionable signals;
- lifecycle determines active carrier status;
- higher timeframes activate only through their own observable trigger;
- mixed-direction timeframe states remain visible;
- thesis and execution timeframe identity remain separate;
- Level of Reclaim is never invented by the adapter.

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
- Price exhaustion = magnitude completion / fresh-extreme / currently-cleared objective context.

Neither is an automatic reversal signal.

## PMG terminology safeguard

Keep separate:
- `PMG_STAIRCASE` = sequential higher-low/lower-high target geometry;
- `3-1-3` = separate pattern identifier unless dedicated current source material proves equivalence.

## Timeframe / domino state

Supported ladder:

`Y -> Q -> M -> W -> D -> 60 -> 30 -> 15 -> 5`

Yearly and Quarterly remain supported but not mandatory filters. Lower timeframes cannot falsely activate higher-timeframe triggers.

## Production paths

Signal path:

`CORE SETUP -> NORMALIZED SIGNAL -> SIGNAL LIFECYCLE -> DOMINO / CARRIER STATE`

Objective path:

`SETUP MAGNITUDE -> STRUCTURAL TARGETS / PMG LEVELS -> TARGET HIERARCHY -> OBJECTIVE STATE -> PRICE EXHAUSTION`

## Next validation/build work

1. finish exact Level of Reclaim source audit for 2-2 / 2-1-2 / 3-1-2 and related visuals;
2. execute the schema/adapter harnesses in an available local/CI environment and repair any failures;
3. validate lower-to-higher timeframe carrier advancement on real historical charts;
4. add explicit timeframe/session/bar-anchor metadata to the data model;
5. connect a low-cost historical data adapter and begin broader audited scenario backtesting;
6. use those historical records to measure management-card states rather than guessing their effectiveness.

The Research Console remains in sample-data mode until real-market validation and data-semantics layers are materially complete.
