# Scanner Card / Watchlist Context — v0.1

Date: 2026-08-20

## Purpose

Provide one compact, deterministic data model that the watchlist, candidate scanner, Practice Mode, and later Trade Coach can all consume without recalculating evidence independently.

## Flow

`DETERMINISTIC SIGNAL -> SETUP CONTEXT -> SCANNER CARD -> WATCHLIST / PRACTICE MODE / TRADE COACH`

The card is a presentation adapter, not a trading engine.

## Card fields

Core identity:
- symbol;
- timeframe;
- sector when supplied;
- observed timestamp;
- current price when supplied.

Setup state:
- setup label;
- direction;
- advisory state;
- actionable flag;
- trigger;
- stop;
- target;
- structural reward:risk and gate status.

Supporting evidence:
- FTFC alignment and evidence status;
- index breadth context and status;
- sector breadth context and status;
- compact historical evidence including sample size, measured success rate, definition, window, and source;
- full `Why?` evidence rows from `setup-context.js`.

Safeguards:
- `probabilityScore` is always null;
- `brokerAuthority` is always false;
- FTFC/breadth cannot manufacture an actionable setup;
- historical evidence remains descriptive;
- Practice Mode reuses an existing `practiceTrade.context.setupContext` when present rather than recomputing a divergent version.

## Ranking

`rankScannerCards()` performs only transparent descriptive ordering:

1. active Practice Mode context;
2. actionable deterministic setups;
3. wait/no-action cards;
4. within the same advisory class, count aligned FTFC/index/sector evidence;
5. then structural R:R when the R:R gate passes;
6. finally symbol as a stable tie-breaker.

This ranking is not setup validity and is not a predictive score.

No arbitrary confidence percentage is generated.

## UI intent

A compact card can show:

`SPY | 15m | 2-1-2U`

`FTFC: FULL BULLISH`

`Index: bullish majority | Sector: bullish majority`

`R:R: 2.5:1 PASS`

`Historical T1 rate: 68.3% (N=120)`

The historical line must include its definition/sample context in the expanded `Why?` view and must not be labeled as the probability that the current trade will win.

## Validation

Focused harness:
- `tests/scanner-card-validation.js`

Coverage includes card normalization, advisory propagation, R:R, FTFC, separate breadth layers, historical sample retention, Practice Mode context reuse, no broker/probability authority, no-setup safeguards, and transparent ranking order.
