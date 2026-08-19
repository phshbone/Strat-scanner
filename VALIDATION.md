# Engine Validation — v0.24

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

## Level of Reclaim management — new in v0.24

New module:
- `reclaim-management.js`

New focused harness:
- `tests/reclaim-management-validation.js`

New spec:
- `RECLAIM-MANAGEMENT-SPEC.md`

Current TheStrat.ai material confirms that trigger, magnitude, and Level of Reclaim are distinct prices, and that after magnitude the level of defense can be tightened to the nearest valid reclaim when no higher-timeframe carrier is taking over.

The public indexed docs still do not expose enough detail to derive one universal per-pattern reclaim formula. Therefore this layer consumes only explicit verified reclaim candidates.

Deterministic selection:
- bullish trade -> nearest defensive reclaim = highest verified reclaim below current price;
- bearish trade -> nearest defensive reclaim = lowest verified reclaim above current price;
- equality at reclaim counts as a defensive-boundary breach;
- unverified candidates cannot drive guidance.

Management states:
- `NO_RECLAIM_GUIDANCE`
- `RECLAIM_AVAILABLE`
- `TIGHTEN_TO_NEAREST_RECLAIM`
- `RECLAIM_BREACHED`

The module does not derive reclaim from midpoint stop, structure stop, or arbitrary pivots.

Focused local Node execution: **19/19 PASS**.

## TheStrat.ai documentation audit — v0.5

Audit file:
- `research/THESTRAT-AI-DOC-AUDIT-v0.2.md` (content advanced to v0.5)

Current high-value findings:
- continuity = evidence, signal = timing, broadening formation = map/magnitude;
- time expiration and price completion are separate;
- multiple timeframes can independently carry a thesis;
- a completed signal cannot justify fresh size by itself;
- 3-2 carries no setup-defined magnitude and must borrow a higher-timeframe objective;
- kicker is not standalone and requires fast lower-timeframe reconfirmation;
- prior-range pivots support PMG/target-fuel context;
- after magnitude, defense can tighten to the nearest valid reclaim;
- exact reclaim geometry for 2-2 / 2-1-2 / 3-1-2 / hammer / shooter remains source-unresolved.

## PMG objective integration

Production chain:

`PMG GEOMETRY -> MATCHING STRAT REVERSAL IN FORCE -> SETUP MAGNITUDE -> PMG TARGET STACK -> OBJECTIVE STATE -> PRICE EXHAUSTION`

PMG geometry alone is not actionable, and no universal PMG spacing threshold is invented.

## Core setup -> signal -> domino integration

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

## Exhaustion terminology

Time exhaustion and price exhaustion remain separate.

- Time exhaustion = how much time remains in the active signal bar.
- Price exhaustion = magnitude completion / fresh-extreme / currently-cleared objective context.

Neither is an automatic reversal signal.

## Timeframe / domino state

Supported ladder:

`Y -> Q -> M -> W -> D -> 60 -> 30 -> 15 -> 5`

Yearly and Quarterly remain supported but not mandatory filters. Lower timeframes cannot falsely activate higher-timeframe triggers.

## Production paths

Signal path:

`CORE SETUP -> NORMALIZED SIGNAL -> SIGNAL LIFECYCLE -> DOMINO / CARRIER STATE`

Objective path:

`SETUP MAGNITUDE -> STRUCTURAL TARGETS / PMG LEVELS -> TARGET HIERARCHY -> OBJECTIVE STATE -> PRICE EXHAUSTION`

Management path:

`SOURCE-VERIFIED RECLAIM LEVELS -> NEAREST DEFENSIVE RECLAIM -> MANAGEMENT STATE -> GUIDANCE CARD / FUTURE RULE ENGINE`

## Next validation/build work

1. source-verify exact reclaim geometry from the 2-2 / 2-1-2 / 3-1-2 visuals; request only the specific clip if the site animation cannot be recovered;
2. execute the schema/adapter harnesses in the local Node environment and repair any failures;
3. validate lower-to-higher timeframe carrier advancement on real historical charts;
4. add explicit timeframe/session/bar-anchor metadata to the data model;
5. connect a low-cost historical data adapter and begin broader audited scenario backtesting;
6. use those historical records to measure management-card states rather than guessing their effectiveness.

The Research Console remains in sample-data mode until real-market validation and data-semantics layers are materially complete.
