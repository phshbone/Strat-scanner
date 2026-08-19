# Engine Validation — v0.35

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
- Twelve Data historical-provider adapter harness exists at `tests/twelve-data-adapter-validation.js`; **not yet reported as PASS** in this session because no repository-side completed CI result has been observed.
- Cloudflare market-data proxy harness exists at `tests/market-data-proxy-validation.mjs`; **not yet reported as PASS** until a completed execution result is observed.
- Real-market validation exists for 2-2, 2-1-2, 3-1-2, and SSS50 examples.
- Research Console remains wired to `core-engine-v0.3.js` and remains in SAMPLE DATA mode.

## v0.35 — Cloudflare secret-backed market-data proxy

New production file:
- `worker/market-data-proxy.mjs`

New specification:
- `CLOUDFLARE-MARKET-DATA-PROXY-SPEC.md`

New focused harness:
- `tests/market-data-proxy-validation.mjs`

Updated workflow:
- `.github/workflows/engine-validation.yml` now executes both `.js` and `.mjs` validation harnesses.

### Production path

`GITHUB PAGES FRONTEND -> CLOUDFLARE WORKER -> TWELVE DATA -> PROVIDER NORMALIZER -> PERIOD/SESSION RESOLVER -> DATA SEMANTICS -> STRAT ENGINE`

### Secret rule

Preferred Worker secret binding:
- `TWELVE_DATA_API_KEY`

Compatibility fallback:
- `A12_DATA_KEY`

The Worker reads the API key only from the Cloudflare `env` binding. No provider key is committed to GitHub or returned to the browser.

### Proxy restrictions

The Worker is deliberately narrow rather than a generic HTTP proxy.

Allowed route:
- `GET /time-series`

Health route:
- `GET /health`

Allowed provider intervals:
- `5min`
- `15min`
- `30min`
- `1h`
- `1day`
- `1week`
- `1month`

The Worker validates symbol, interval, output size and optional date inputs before constructing a Twelve Data request. Intraday requests force `timezone=UTC`, and all requests force ascending order.

The browser cannot supply an arbitrary upstream URL or provider endpoint.

### CORS

Production GitHub Pages origin is explicitly allowlisted:
- `https://phshbone.github.io`

Selected localhost origins are allowed for development. Unknown origins are not reflected dynamically.

### Secret exposure safeguards

- `/health` reports only whether a supported secret binding exists;
- the constructed provider URL is never returned because it contains the API key;
- API-key value is never included in error output;
- unsupported HTTP methods are rejected.

## v0.34 — historical provider adapter foundation

Production files:
- `providers/twelve-data.js`
- `market-data-adapter.js`

Specification:
- `HISTORICAL-DATA-ADAPTER-SPEC.md`

Focused harness:
- `tests/twelve-data-adapter-validation.js`

Provider path:

`TWELVE DATA RESPONSE -> PROVIDER NORMALIZER -> PERIOD/SESSION RESOLVER -> DATA SEMANTICS -> STRAT ENGINE`

Initial provider intervals:
- 5 minute
- 15 minute
- 30 minute
- 60 minute / 1 hour
- Daily
- Weekly
- Monthly

Quarterly and yearly bars are not synthesized yet. They should be generated only after explicit calendar/period aggregation semantics are implemented.

Intraday requests explicitly ask Twelve Data for UTC output so returned clock strings can be treated as absolute machine timestamps.

`market-data-adapter.js` refuses to create semantic engine bars without a `periodResolver` that supplies at least `periodOpenId` and `periodOpenTimestamp`.

## v0.33 verification consolidation

Verified locally on 2026-08-19:
- `tests/signal-schema-validation.js`: **20/20 PASS**;
- `tests/setup-signal-adapter-validation.js`: **23/23 PASS**;
- `tests/carrier-interpretation-validation.js`: **17/17 PASS**;
- `tests/data-semantics-signal-integration-validation.js`: **10/10 PASS**.

Invariant:

`PRESENT SETUP OBJECT != ACTIVE CARRIER`

## Production architecture

Signal path:

`CORE SETUP -> NORMALIZED SIGNAL -> SIGNAL LIFECYCLE -> DOMINO / CARRIER STATE`

Carrier interpretation path:

`ACTIVE HIGHER-TF CARRIER -> LOWER-TF CONFIRM / INSIDE / CONFLICT / REVERSAL / RANGE EXIT -> INTERPRETATION STATE -> GUIDANCE CARD`

Objective path:

`SETUP MAGNITUDE -> STRUCTURAL TARGETS / PMG LEVELS / VERIFIED RECLAIMED-RANGE OBJECTIVES -> TARGET HIERARCHY -> OBJECTIVE STATE -> PRICE EXHAUSTION`

Reclaim path:

`PRIOR VERIFIED RANGE -> RECLAIM BOUNDARY -> RANGE RE-ENTRY STATE -> OPPOSITE RANGE OBJECTIVE -> COMPLETION / FAILURE -> MANAGEMENT / GUIDANCE`

Data path:

`GITHUB PAGES -> CLOUDFLARE PROXY -> PROVIDER -> RAW OHLCV -> PROVIDER NORMALIZER -> PERIOD/SESSION RESOLVER -> SEMANTIC BAR -> STRAT ENGINE`

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

1. deploy `worker/market-data-proxy.mjs` to the Cloudflare Worker that owns the configured Twelve Data secret;
2. verify `/health` without exposing the secret value;
3. perform the first real SPY provider fetch through `/time-series`;
4. implement the exchange/session period resolver needed to promote provider rows into production semantic bars;
5. validate known SPY 2-2 / 2-1-2 / 3-1-2 / SSS50 cases against provider data;
6. validate lower-to-higher timeframe carrier advancement/negation on real historical charts using matched aggregation semantics;
7. implement simultaneous-break breadth as a separate scanner/ranking evidence layer, including explicit mixed breadth;
8. add `WAIT_NO_ACTIONABLE_SETUP` as a first-class advisory outcome;
9. keep Minervini, Elder, and user-plan rules as separate ranking/guardrail layers rather than changing pure Strat validity.

The Research Console remains in sample-data mode until real-market provider validation and period/session semantics are materially complete.
