# Historical Data Adapter — v0.1

## Purpose

Introduce a provider-neutral historical OHLCV path without allowing provider bar construction to silently mutate Strat results.

Production direction:

`PROVIDER RESPONSE -> PROVIDER NORMALIZER -> PERIOD/SESSION RESOLVER -> DATA SEMANTICS -> STRAT ENGINE`

## Initial provider: Twelve Data

The first provider implementation is `providers/twelve-data.js`.

Supported initial intervals:
- 5 minute
- 15 minute
- 30 minute
- 60 minute / 1 hour
- Daily
- Weekly
- Monthly

The adapter deliberately does not yet synthesize Quarterly or Yearly bars. Those should be built later from normalized lower-period bars under explicit calendar semantics.

## Intraday timestamp rule

For intraday requests the provider adapter requests UTC output. This avoids treating a timezone-less clock string as an absolute instant.

Daily/weekly/monthly data remain provider/exchange calendar bars and must receive exact period identity from the period/session resolver before production comparison.

## API-key rule

No API key is committed to the repository.

The provider module accepts the key at runtime. A future browser UI must not present a client-side key as secret. For personal research a user-supplied runtime key may be acceptable; production/external use should route credentials through an appropriate server-side secret boundary.

## Semantic gate

`market-data-adapter.js` requires a `periodResolver` before provider bars can become semantic engine bars. The resolver must supply:
- `periodOpenId`
- `periodOpenTimestamp`
- optional exact bar open/close timestamps

This is intentional. The system must not guess session or aggregation boundaries simply because an OHLC row exists.

## Comparability rule

Series should not be used for direct historical equivalence tests unless their semantic profiles are compatible. Timeframe, market timezone, session, extended-hours policy, bar anchor/offset, provider aggregation and period identity remain auditable.

## Validation

Focused harness:
- `tests/twelve-data-adapter-validation.js`

The harness checks interval mapping, UTC intraday output requests, provider output limits, deterministic OHLCV normalization, ascending bar order, semantic attachment, and mismatch detection.
