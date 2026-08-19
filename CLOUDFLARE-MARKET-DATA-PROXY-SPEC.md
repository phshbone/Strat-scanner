# Cloudflare Market Data Proxy — v0.1

## Purpose

Keep the Twelve Data API key out of the GitHub Pages frontend and out of the repository while allowing the trading workstation to request approved historical time-series data.

Production path:

`GITHUB PAGES FRONTEND -> CLOUDFLARE WORKER -> TWELVE DATA -> PROVIDER NORMALIZER -> DATA SEMANTICS -> STRAT ENGINE`

## Worker

File:
- `worker/market-data-proxy.mjs`

Routes:
- `GET /health`
- `GET /time-series`
- `OPTIONS` for CORS preflight

The Worker is intentionally not a generic proxy. It only targets Twelve Data's `time_series` endpoint and only forwards a narrow allowlist of parameters.

## Secret binding

Preferred Worker secret name:
- `TWELVE_DATA_API_KEY`

Compatibility fallback:
- `A12_DATA_KEY`

The Worker reads the secret from the Cloudflare `env` binding. The provider URL containing the API key is never returned to the browser.

## Allowed request inputs

- `symbol`
- `interval`: `5min`, `15min`, `30min`, `1h`, `1day`, `1week`, `1month`
- `outputsize`: 1-5000
- `start_date`
- `end_date`

The Worker itself adds:
- `apikey`
- `format=JSON`
- `order=ASC`
- `timezone=UTC` for intraday intervals

## CORS

Allowed production origin:
- `https://phshbone.github.io`

Local development origins are also allowlisted for ports 3000 and 5173 on localhost/127.0.0.1.

Unknown origins are never reflected back dynamically.

## Security rules

- no API key in GitHub;
- no API key in frontend JavaScript;
- no arbitrary upstream URL parameter;
- no arbitrary provider endpoint;
- no reflection of the constructed provider URL;
- invalid symbols/intervals/output sizes/dates are rejected before provider fetch;
- POST/PUT/etc. are rejected;
- `/health` reports only whether a secret is configured, never its value.

## Validation

Focused harness:
- `tests/market-data-proxy-validation.mjs`

The GitHub Actions workflow now executes both `.js` and `.mjs` validation harnesses.
