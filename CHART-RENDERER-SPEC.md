# Chart Renderer Specification — v0.1

Date: 2026-08-20

## Decision

Use TradingView Lightweight Charts as the chart-rendering engine.

This is a rendering dependency only. It is not a market-data source, strategy engine, scanner authority, or broker integration.

## Cost / license

TradingView Lightweight Charts is open-source under Apache-2.0. Current project documentation requires TradingView attribution and a TradingView link on a public page/application using the library.

Implementation requirement:
- preserve required attribution notice;
- include the required TradingView link in the app;
- do not imply TradingView supplies our market data or Strat logic.

## Data authority

The chart must render the exact same semantic bars consumed by the deterministic Strat engine.

Production path:

`MARKET DATA PROVIDER -> NORMALIZER -> PERIOD/SESSION RESOLVER -> DATA SEMANTICS -> STRAT ENGINE -> CHART RENDERER`

The renderer must never independently source or reinterpret candles.

## Initial data sources

- Twelve Data: historical and delayed/research bars.
- Robinhood or another future adapter: optional real-time market data after semantic compatibility is validated.

The renderer must be provider-agnostic once bars are normalized.

## Candle modes

### Standard candlesticks
Render normalized OHLC bars directly.

### Heikin-Ashi
Calculate Heikin-Ashi locally from the normalized OHLC sequence. Do not rely on a provider-specific HA feed.

HA output is a visualization / analysis transform and must never replace the canonical OHLC bars used for Strat scenario classification unless a future explicitly separate HA strategy module is created.

## Layout

Primary desktop layout:
- four charts simultaneously;
- default profile: M / W / D / 60 when those semantics are production-valid;
- configurable to D / 60 / 30 / 15 or other approved profiles;
- one active symbol/workspace across all panels;
- responsive compact mode for phone.

## Visual direction

Target a clean TradingView-like visual feel without copying proprietary branding or data.

Desired qualities:
- crisp candle bodies and wicks;
- restrained gridlines;
- clear price/time scales;
- dark navy default theme;
- smooth zoom and pan;
- crosshair;
- uncluttered labels;
- compact setup/state markers;
- readable at four-panel density.

## User customization

Planned settings:
- bullish candle color;
- bearish candle color;
- background/theme;
- grid intensity;
- wick visibility/thickness where supported;
- candle spacing/width where supported;
- standard vs Heikin-Ashi display;
- volume on/off;
- crosshair on/off/style where supported;
- setup markers on/off;
- magnitude/objective lines on/off;
- FTFC/context overlays on/off.

## Strat overlays

Renderer overlays may display deterministic engine outputs including:
- 1 / 2U / 2D / 3 labels;
- actionable setup labels;
- trigger level;
- magnitude / first objective;
- qualified target levels;
- reclaim range/objective markers;
- active-carrier state;
- FTFC state;
- practice-entry / stop / exit markers;
- paper-trade outcome annotations.

Overlay presence must not alter the underlying engine state.

## Synchronization

Planned optional synchronization across the four charts:
- active symbol;
- crosshair time;
- selected bar/time;
- zoom/time-range where useful;
- setup selection.

Timeframe axes should remain semantically independent even when user interaction is synchronized.

## Guardrails

- no TradingView market-data scraping;
- no dependence on TradingView chart data;
- no proprietary TradingView Advanced Charts requirement for v1;
- no custom chart renderer from scratch unless Lightweight Charts proves materially insufficient;
- no HA-derived Strat classification in the canonical engine;
- no unverified 60-minute rendering into Practice Mode until 60-minute aggregation semantics are validated.

## Implementation order

1. Finish real-provider semantic validation for Daily / 30 / 15 / 5.
2. Validate 60-minute aggregation semantics separately.
3. Add Lightweight Charts renderer shell.
4. Feed renderer normalized semantic bars.
5. Add four-panel workspace.
6. Add normal/HA toggle.
7. Add deterministic Strat overlays.
8. Add Practice Mode trade markers and result logging.
9. Add user visual customization.

## Status

Architecture decision: LOCKED.
Renderer integration: NOT YET IMPLEMENTED.
Market-data authority: remains outside the renderer.
