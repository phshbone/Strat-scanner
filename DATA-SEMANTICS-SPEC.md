# Data Semantics Specification

Date: 2026-08-19

## Purpose

The Strat engine must not assume that two OHLCV series are equivalent merely because they share a symbol and nominal timeframe.

Rob Smith explicitly noted that 60-minute charts can differ when platforms anchor/aggregate bars differently. Since Strat setup classification depends on exact prior-bar highs/lows and period opens, bar-construction semantics are part of the trading logic, not display metadata.

## Required metadata

Each bar consumed by the deterministic engine should carry:

- symbol;
- normalized timeframe (`Y/Q/M/W/D/60/30/15/5`);
- market timezone;
- session (`REGULAR`, `EXTENDED`, or `ALL`);
- explicit extended-hours inclusion flag;
- bar anchor description;
- bar anchor offset in minutes;
- provider name;
- provider aggregation description;
- period-open identity;
- period-open timestamp;
- bar-open timestamp when available;
- bar-close timestamp when available.

## Period-open identity

Continuity is measured relative to the active timeframe open. New year/quarter/month/week/day/intraday periods therefore require a fresh identity.

`periodOpenId` must distinguish one live period from the next even when the nominal timeframe is the same.

Examples:

- `SPY|D|2026-08-19|RTH`
- `SPY|W|2026-W34|RTH`
- `SPY|60|2026-08-19|RTH|09:30`

The exact serialization can vary by adapter, but identity must be deterministic and stable for the life of that bar/period.

## Comparability rule

Historical or cross-provider bars are directly comparable only when these semantics match:

- timeframe;
- market timezone;
- session;
- extended-hours policy;
- bar anchor;
- bar anchor offset;
- provider aggregation semantics;
- period-open identity.

A provider name may differ while bars remain comparable if the actual aggregation semantics match.

## Semantic key

`data-semantics.js` emits a deterministic semantic key so research records can preserve the exact construction context used for setup classification.

## Safeguards

- do not silently mix RTH and extended-hours bars;
- do not compare differently anchored 60-minute histories as if they were identical;
- do not infer period continuity without an explicit period-open identity;
- do not let a data-provider adapter erase source aggregation semantics;
- do not use provider brand name as a substitute for explicit aggregation rules;
- do not normalize timestamps by dropping timezone information.

## Production path

`PROVIDER RAW DATA -> ADAPTER -> OHLCV + DATA SEMANTICS -> STRAT BAR CLASSIFICATION -> SETUP/SIGNAL/CONTINUITY/OBJECTIVE ENGINES`

This layer is provider-independent. Each future data adapter is responsible for mapping its raw feed into this contract.