# Historical Event Database — v1

## Decision

Use Cloudflare D1 as the durable historical-event store.

The existing application already uses a Cloudflare Worker as the server-side boundary for Twelve Data. D1 keeps the historical evidence backend at that same boundary and avoids putting credentials or writable database logic into GitHub Pages.

## Storage model

The database stores derived historical setup events, not raw provider bars as the primary record.

Every row preserves:
- stable event id;
- symbol and signal timestamp;
- setup, direction, timeframe and market type;
- entry, stop model, stop and magnitude;
- deterministic outcome/resolution fields;
- FTFC and later comparison context;
- market-data construction semantics;
- complete original event JSON for audit/reprocessing;
- schema version and import id.

Raw OHLC can be re-fetched from the provider when needed. This prevents a large duplicate raw-bar warehouse from being required on day one.

## Tables

historical_events is the authoritative derived-event table. event_id is the primary key, so rebuilding the same deterministic event is idempotent.

historical_imports tracks ingestion runs and will record source, symbol, timeframe, bars received and events written.

## Read API

GET /historical/health

Reports whether the D1 binding exists, whether the migration has been applied, event count and current date span.

GET /historical/evidence

Required query fields: setup, direction, timeframe.

Optional query fields: market_type, construction-profile fields, FTFC/context fields, stop_model and min_resolved. The default minimum resolved sample is 20.

The response always keeps the exact-context cohort separate from the broader setup baseline.

## Write API

POST /historical/events is administrative ingestion only.

It requires the D1 binding HISTORICAL_DB and secret HISTORICAL_DB_WRITE_TOKEN, passed as an Authorization Bearer token. The browser app must never contain that token.

Payload shape: {"events":[...],"importId":"..."}. Maximum batch: 500 events.

## Cloudflare bindings still required

Repository code cannot create account-side Cloudflare resources by itself. Before writes can become live:

1. create a D1 database;
2. apply worker/migrations/0001_historical_events.sql;
3. bind it to the existing Worker as HISTORICAL_DB;
4. add HISTORICAL_DB_WRITE_TOKEN as a Worker secret;
5. deploy the updated Worker.

Until those account bindings exist, the market-data proxy continues operating normally and /historical/health will report the database as unconfigured.

## Next ingestion phase

Build a deterministic dataset job:

Twelve Data -> normalized semantic bars -> Strat engine -> historical-event-builder -> D1

The first controlled population should be SPY, then QQQ/IWM, one validated timeframe at a time. No percentage is promoted into Trade Coach until exact-cohort sample-size and audit gates pass.