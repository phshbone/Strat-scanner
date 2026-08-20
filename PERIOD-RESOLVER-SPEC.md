# US Equity Daily Period Resolver — v0.1

## Purpose

Promote Twelve Data daily OHLC rows into auditable semantic bars without guessing intraday aggregation behavior.

Production path:

`TWELVE DATA DAILY -> normalizeValues() -> US equity daily period resolver -> market-data-adapter -> data-semantics -> Strat engine`

## Current production scope

Enabled:
- U.S. equity / ETF Daily bars
- `America/New_York`
- regular session identity
- exact local 09:30 session-open conversion to UTC with DST handled by `Intl.DateTimeFormat`

Not yet production-enabled:
- 60 / 30 / 15 / 5 minute period resolution
- Weekly / Monthly period identity
- Quarterly / Yearly synthesis
- extended-hours session identity

Those remain blocked until provider/session aggregation semantics are verified rather than inferred.

## Daily identity

For a provider calendar date such as `2026-08-20` and symbol `SPY`:

- `periodOpenId = SPY|D|2026-08-20|REGULAR`
- `periodOpenTimestamp = 2026-08-20T13:30:00.000Z` during EDT
- `barOpenTimestamp = periodOpenTimestamp`
- `barCloseTimestamp = null`

Daily close time is intentionally not guessed because early-close sessions exist. The current engine needs exact period-open identity first; close/session-calendar handling will be added separately when needed.

## Safeguards

- rejects malformed provider calendar dates;
- rejects non-New-York market timezone in the current U.S. equity resolver;
- rejects non-regular-session usage;
- refuses to create an intraday resolver silently;
- no holiday calendar or early-close schedule is fabricated.

## Validation

Focused harness:
- `tests/period-resolver-validation.js`

The harness checks summer/winter DST conversion, daily period identity, deliberate absence of guessed close time, and rejection of unsupported intraday/session configurations.

## Live smoke path

`scripts/live-spy-smoke.js` calls the deployed Cloudflare proxy for 120 SPY Daily bars, normalizes Twelve Data payloads, attaches daily semantic provenance, and runs the core scenario/setup detector over the returned history.

`.github/workflows/live-market-smoke.yml` runs this as a narrow real-provider smoke test. It is intentionally separate from the deterministic unit suite because it consumes a live provider request and depends on external availability.
