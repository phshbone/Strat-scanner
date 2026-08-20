# Robinhood Real-Time Integration — Research / Adapter Spec

Date: 2026-08-20
Status: RESEARCH / NOT YET CONNECTED

## Goal
Use Robinhood as an optional real-time/account/broker source while keeping all charting, Strat calculations, scanner logic, ranking and management logic inside this project.

Robinhood must never become the source of truth for Strat rules. It is a transport/data/broker adapter only.

## Official Robinhood capability confirmed
Robinhood's current Agentic Trading / Trading MCP documentation exposes, among other tools:

- `get_equity_historicals` — OHLCV bars across a time range
- `get_equity_quotes` — real-time equity quotes and prior close for up to 20 symbols
- `get_equity_price_book` — real-time Level 2 bid/ask price levels and resting size for up to 4 stocks
- `get_equity_fundamentals`
- `get_equity_technical_indicators`
- `get_index_quotes` — real-time index values
- options chain / quote / historical tools
- account, position, watchlist, scanner and order tools

Official MCP endpoint documented by Robinhood:
`https://agent.robinhood.com/mcp/trading`

## Important account boundary
Robinhood Agentic Trading uses a dedicated Agentic account. A normal existing Robinhood individual account is not assumed to expose MCP trading/data access automatically.

The user must authenticate through Robinhood and create/authorize the Agentic account on desktop before account-bound MCP tools can be used.

## Architecture

Historical / research path:

`TWELVE DATA -> CACHE -> PERIOD/SESSION RESOLVER -> DATA SEMANTICS -> STRAT ENGINE`

Potential Robinhood real-time path:

`ROBINHOOD TRADING MCP -> ROBINHOOD TRANSPORT ADAPTER -> NORMALIZED QUOTE/BOOK/BAR EVENTS -> PERIOD/SESSION RESOLVER -> DATA SEMANTICS -> STRAT ENGINE -> OUR CHARTS`

Broker/execution path, disabled by default:

`DETERMINISTIC STRAT ENGINE -> EXPLICIT USER MANAGEMENT RULE -> BROKER ADAPTER -> ROBINHOOD MCP -> REVIEW/ORDER`

## Chart ownership
Robinhood chart UI is not required.

Our frontend can continue to render its own charts. Robinhood data, if available through the authenticated MCP connection in a form suitable for the requested timeframe, is normalized into our own bar/quote schema and rendered by our charting layer.

## Provider roles

### Twelve Data
Primary purpose:
- historical research
- deterministic backtesting
- bulk cached universe work
- reproducible validation

### Robinhood MCP
Potential purpose:
- real-time quotes
- Level 2 book context
- account / positions
- watchlists / scans
- options quote/chain context
- later broker execution

Robinhood does not replace Twelve Data at this stage.

## Real-time caveat
The current official Robinhood documentation clearly identifies real-time quote and Level 2 tools, but this project has not yet proven that Robinhood supplies a continuous streaming candle feed suitable for constructing 5/15/30/60 minute bars directly.

Therefore:
- do not assume WebSocket-like streaming;
- do not assume polling frequency or rate limits;
- do not synthesize intraday Strat bars until actual MCP responses, timestamps and query behavior are observed;
- if quotes are polled, preserve quote timestamp, retrieval timestamp and provider source separately;
- if historical intraday bars are requested from Robinhood, compare their session and anchor semantics with Twelve Data before using them interchangeably.

## Normalized event boundary (planned)
Transport-specific Robinhood objects should be converted into provider-neutral records before they reach the engine.

Planned record classes:
- `QUOTE_SNAPSHOT`
- `LEVEL2_BOOK_SNAPSHOT`
- `HISTORICAL_BAR`
- `INDEX_QUOTE`
- `OPTION_QUOTE`

Every normalized event should preserve:
- provider
- symbol / contract identifier
- source timestamp if supplied
- retrieval timestamp
- market timezone
- session
- whether data is real-time or historical
- raw provider provenance / request type

No Robinhood field names should leak into pure Strat setup logic.

## Security / authority
- Never commit Robinhood credentials, tokens or account identifiers to GitHub.
- Never proxy authenticated Robinhood account data through a public unauthenticated endpoint.
- Account access and order access stay behind authenticated MCP transport.
- Execution remains separate from analysis.
- Default execution mode remains OFF.
- A deterministic signal is not permission to trade.

## First Robinhood validation sequence
After the Twelve Data real-SPY path is confirmed:

1. Connect Robinhood Trading MCP on desktop through an approved MCP-capable client.
2. Authenticate and confirm Agentic account scope.
3. Read-only test only.
4. Call `get_equity_quotes` for SPY and record actual response shape, timestamps and freshness.
5. Call `get_equity_price_book` for SPY and record actual Level 2 response shape and freshness.
6. Call `get_equity_historicals` for SPY on one supported intraday range.
7. Compare Robinhood bars against Twelve Data for session, bar boundaries, timestamps and OHLC classification.
8. Only after semantics match or are explicitly separated, build the Robinhood adapter.
9. Do not enable order tools during data-validation work.

## Acceptance criteria before using Robinhood for live Strat decisions
- quote freshness is measured, not assumed;
- timestamp semantics are documented;
- intraday bar anchoring is documented;
- regular vs extended session behavior is documented;
- provider differences are preserved rather than silently merged;
- the same raw Robinhood inputs produce deterministic normalized events;
- no secret/account data reaches GitHub Pages or public logs;
- execution remains explicitly disabled during data validation.

## Current decision
Proceed with Robinhood as a second provider/broker adapter after Twelve Data SPY validation, while retaining our own charts and deterministic engine.
