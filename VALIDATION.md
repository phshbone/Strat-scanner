# Engine Validation — v0.33

Date: 2026-08-19

## Current status

- Legacy synthetic regression layer: **44/44 PASS** in the v0.2 expanded harness. Superseded semantics in that file remain historical only.
- Corrected core engine: **15/15 PASS** in `tests/core-engine-v0.3-validation.js`.
- Setup-specific first magnitude: **10/10 PASS** in `tests/setup-magnitude-validation-v0.1.js`.
- Research outcome/scenario layer: **20/20 PASS** in `tests/research-outcomes-validation.js`.
- Explicit time/price exhaustion layer: **21/21 PASS locally** in `tests/exhaustion-validation.js`.
- Structural target qualification layer: **19/19 PASS** in `tests/target-qualification-validation.js`.
- Target hierarchy / de-duplication layer: **22/22 PASS locally** in `tests/target-hierarchy-validation.js` after cross-source provenance support.
- Integrated multi-timeframe objective pipeline regression: **20/20 PASS locally** in `tests/objective-pipeline-validation.js` after reclaim integration.
- Reclaimed-range -> objective integration: **19/19 PASS locally** in `tests/reclaim-objective-pipeline-validation.js`.
- Timeframe/domino state layer: **20/20 PASS** in `tests/timeframe-domino-validation.js`.
- PMG geometry/actionable-state layer: **21/21 PASS** in `tests/pmg-validation.js`.
- PMG -> production objective integration: **16/16 PASS locally** in `tests/pmg-objective-pipeline-validation.js`.
- Actionable signal lifecycle layer: **25/25 PASS locally** in `tests/signal-lifecycle-validation.js`.
- Level of Reclaim management selection layer: **19/19 PASS locally** in `tests/reclaim-management-validation.js`.
- Range-aware reclaim state/schema layer: **24/24 PASS locally** in `tests/range-reclaim-validation.js`.
- Data-semantics layer: **24/24 PASS locally** in `tests/data-semantics-validation.js`.
- Normalized actionable-signal schema: **20/20 PASS locally** in `tests/signal-schema-validation.js`.
- Core setup -> signal -> lifecycle -> domino adapter: **23/23 PASS locally** in `tests/setup-signal-adapter-validation.js` after correcting one stale test expectation.
- Carrier-relative interpretation engine: **17/17 PASS locally** in `tests/carrier-interpretation-validation.js`.
- Data-semantics -> signal provenance integration: **10/10 PASS locally** in `tests/data-semantics-signal-integration-validation.js`.
- Real-market validation exists for 2-2, 2-1-2, 3-1-2, and SSS50 examples.
- Research Console remains wired to `core-engine-v0.3.js` and remains in SAMPLE DATA mode.

## v0.33 verification consolidation

The previously unexecuted focused harnesses were run together against the current committed module logic.

Verified locally on 2026-08-19:
- `tests/signal-schema-validation.js`: **20/20 PASS**;
- `tests/setup-signal-adapter-validation.js`: **23/23 PASS**;
- `tests/carrier-interpretation-validation.js`: **17/17 PASS**;
- `tests/data-semantics-signal-integration-validation.js`: **10/10 PASS**.

### Adapter test correction

One stale assertion in `tests/setup-signal-adapter-validation.js` expected a `MIXED` dominant direction when:
- the 60-minute bearish signal was active/in force;
- the Daily bullish setup object was present but below trigger and therefore inactive.

The production domino engine correctly returned `BEARISH` because dominant direction is computed from **active/in-force carriers only**. The test was corrected rather than changing production logic.

This reinforces an important invariant:

`PRESENT SETUP OBJECT != ACTIVE CARRIER`

An opposing setup that is not in force remains observable context but does not become an active directional carrier.

## Automated validation infrastructure

New workflow:
- `.github/workflows/engine-validation.yml`

Purpose:
- run every `tests/*validation*.js` harness on pushes and pull requests;
- make future regressions visible automatically instead of relying only on one-off local execution.

The workflow file is committed. A repository-side workflow result is not being reported here unless GitHub exposes a completed run/status; local focused verification above is the current execution evidence.

## Production architecture now validated through the current deterministic stack

Signal path:

`CORE SETUP -> NORMALIZED SIGNAL -> SIGNAL LIFECYCLE -> DOMINO / CARRIER STATE`

Carrier interpretation path:

`ACTIVE HIGHER-TF CARRIER -> LOWER-TF CONFIRM / INSIDE / CONFLICT / REVERSAL / RANGE EXIT -> INTERPRETATION STATE -> GUIDANCE CARD`

Objective path:

`SETUP MAGNITUDE -> STRUCTURAL TARGETS / PMG LEVELS / VERIFIED RECLAIMED-RANGE OBJECTIVES -> TARGET HIERARCHY -> OBJECTIVE STATE -> PRICE EXHAUSTION`

Reclaim path:

`PRIOR VERIFIED RANGE -> RECLAIM BOUNDARY -> RANGE RE-ENTRY STATE -> OPPOSITE RANGE OBJECTIVE -> COMPLETION / FAILURE -> MANAGEMENT / GUIDANCE`

Data path:

`RAW PROVIDER BAR -> OHLCV + SYMBOL + TIMEFRAME + MARKET TIMEZONE + SESSION + BAR ANCHOR/OFFSET + PROVIDER AGGREGATION + PERIOD OPEN IDENTITY -> STRAT ENGINE`

Breadth path planned:

`DEFINED UNIVERSE/SECTOR -> COUNT DIRECTIONAL 2s + FAILED-2->3 EVENTS -> ALIGNED/MIXED BREADTH CONTEXT -> RANKING/GUIDANCE`

## Source/model safeguards still in force

- Rob Smith direct material remains canonical for pure Strat law.
- Purist/execution interpretations remain source-labelled and may not silently mutate canonical setup validity.
- Minervini and Elder remain separate desirability/ranking/context overlays.
- Reclaim is not inferred from midpoint or arbitrary stop geometry.
- A lower timeframe may confirm, conflict with, or execute a higher-timeframe thesis without automatically creating or negating that higher-timeframe signal.
- Scenario 3 path direction remains ambiguous from completed OHLC unless lower-timeframe/tick sequence resolves which side broke first.
- Intraday historical validation must use matched session/anchor/provider aggregation semantics.
- Price exhaustion is structural completion, not an automatic reversal prediction.
- `WAIT / NO_ACTION` remains a legitimate future advisory outcome.

## Next build work

1. validate lower-to-higher timeframe carrier advancement/negation on real historical charts using matched aggregation semantics;
2. implement simultaneous-break breadth as a separate scanner/ranking evidence layer, including an explicit mixed-breadth state;
3. add `WAIT_NO_ACTIONABLE_SETUP` as a first-class advisory outcome rather than forcing a trade suggestion;
4. connect a low-cost historical data adapter and begin broader audited scenario backtesting;
5. keep Minervini, Elder, and user-plan rules as separate ranking/guardrail layers rather than changing pure Strat validity.

The Research Console remains in sample-data mode until real-market validation and data-provider semantics are materially complete.
