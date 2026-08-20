# US Equity Period Resolver — v0.2

## Purpose

Promote Twelve Data OHLC rows into auditable semantic bars without silently guessing provider aggregation behavior.

Production paths:

`TWELVE DATA DAILY -> normalizeValues() -> US equity daily period resolver -> market-data-adapter -> data-semantics -> Strat engine`

`TWELVE DATA 5/15/30 UTC -> normalizeValues() -> 09:30-anchored RTH intraday resolver -> market-data-adapter -> data-semantics -> Strat engine`

## Current production scope

Enabled:
- U.S. equity / ETF Daily bars
- 5-minute RTH bars
- 15-minute RTH bars
- 30-minute RTH bars
- `America/New_York`
- regular-session identity
- exact local 09:30 conversion/anchoring with DST handled by `Intl.DateTimeFormat`
- explicit intraday bar-open and bar-close timestamps
- deterministic intraday period identity including local bar-open time

Still intentionally disabled:
- 60-minute period resolution
- Weekly / Monthly period identity
- Quarterly / Yearly synthesis
- extended-hours session identity

The 60-minute resolver remains blocked because Rob Smith directly noted that 60-minute Strat results can change when platforms aggregate from different anchors. We will not choose a 60-minute convention until Twelve Data and any later real-time provider are empirically compared.

## Daily identity

For provider calendar date `2026-08-20` and symbol `SPY`:

- `periodOpenId = SPY|D|2026-08-20|REGULAR`
- `periodOpenTimestamp = 2026-08-20T13:30:00.000Z` during EDT
- `barOpenTimestamp = periodOpenTimestamp`
- `barCloseTimestamp = null`

Daily close time is intentionally not guessed because early-close sessions exist.

## Intraday identity

Twelve Data intraday requests are normalized to UTC by the provider adapter. The resolver converts each timestamp to `America/New_York`, requires the bar to lie inside the regular session, and requires the open to align exactly to the 09:30 RTH anchor.

Examples during EDT:

- first 5m bar: `SPY|5|2026-08-20|REGULAR|09:30`
- 10:45 15m bar: `SPY|15|2026-08-20|REGULAR|10:45`
- final 30m normal-session bar: opens 15:30 and closes 16:00

Each intraday result carries:
- `periodOpenId`
- `periodOpenTimestamp`
- `barOpenTimestamp`
- `barCloseTimestamp`
- `calendarDate`
- `intervalMinutes`
- `anchorLocalTime = 09:30`
- `anchorOffsetMinutes`
- resolver provenance

## Safeguards

- rejects malformed provider dates/timestamps;
- rejects non-New-York market timezone in the current U.S. equity resolver;
- rejects non-regular-session usage;
- rejects premarket/after-hours intraday bars;
- rejects 5/15/30 bars not aligned to the 09:30 regular-session anchor;
- rejects bars extending beyond 16:00 on a normal session;
- keeps 60-minute resolution disabled rather than fabricating an aggregation convention;
- no holiday calendar or early-close schedule is fabricated.

Early-close days are a separate market-calendar concern. The current resolver will not generate nonexistent bars, but a future session-calendar layer should supply the true close boundary for those dates.

## Validation

Focused harness:
- `tests/period-resolver-validation.js`

Current focused harness coverage includes:
- summer/winter DST conversion;
- Daily period identity;
- deliberate absence of a guessed Daily close;
- 5-minute 09:30 anchor;
- 15-minute slot identity;
- 30-minute final normal-session close;
- winter intraday DST handling;
- rejection of misaligned bars;
- rejection of premarket bars;
- explicit rejection of unresolved 60-minute semantics;
- resolver factory behavior.

Local validation at implementation time: `21/21 PASS`.

## Live validation path

`scripts/live-spy-smoke.js` currently exercises SPY Daily through the deployed Cloudflare/Twelve Data path.

Next live-data step is an intraday semantics probe that requests SPY 5/15/30/60 bars, records the provider-returned timestamps, validates 5/15/30 against this resolver, and leaves 60 as observation-only until its exact aggregation convention is confirmed.
