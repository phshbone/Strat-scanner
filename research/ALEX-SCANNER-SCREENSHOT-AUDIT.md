# Alex / StratAlerts Scanner Screenshot Audit

Date started: 2026-08-20

Purpose: Extract observable scanner/UI behavior from user-supplied screenshots. This file is implementation/reference evidence only. It does not override canonical Strat law. Source-derived behavior should remain labeled as operational UI, scanner logic, or execution preference unless independently confirmed by stronger source material.

## Batch 1 — 2026-08-20

### 1. Candle Snapshot
Observed mobile panel labeled `CANDLE SNAPSHOT` with market selector `Stocks` and columns for D / W / M / Q / Y.

Rows visible:
- `3G`
- `F2D`
- `2U`
- `1`
- `2D`

Each cell displays a count for that candle/state category on the selected timeframe. Counts update live between consecutive screenshots, confirming this is dynamic market-state aggregation rather than a static report.

Implementation implications:
- Maintain per-timeframe market-wide state counts.
- Keep raw scenario counts separate from directional breadth percentages.
- `3G` and `F2D` terminology must be researched before encoding semantics; do not guess.
- Support market scope selection and user-selectable ticker groups/watchlists.

### 2. Market Breadth
Observed `MARKET BREADTH` panel for Stocks with D / W / M / Q / Y rows.

Each timeframe is shown as a stacked distribution of:
- `1`
- `2U`
- `2D`
- `3`

The screenshots show explicit percentages for each category, e.g. Daily roughly 20% `1`, 26% `2U`, 49% `2D`, 4% `3` at the captured moment.

Implementation implications:
- Breadth should be computed from deterministic per-symbol candle classifications.
- Store both count and percentage.
- Breadth must be timeframe-specific.
- Mixed breadth is a first-class state; do not collapse to a single bullish/bearish score.
- This directly supports the planned simultaneous-break / sector-pressure evidence layer.

### 3. Ticker Matrix
Observed `TICKER MATRIX` table showing symbols such as SPY, QQQ, DIA, IWM and major crypto pairs, with current price plus Strat state by timeframe.

Visible timeframe states include D / W / M / Q / Y. Horizontal scrolling reveals additional columns.

Notable UI behavior:
- States are rendered as compact pills containing `1`, `2U`, `2D`, or `3`.
- Some pills use dashed borders while others use solid borders. Meaning is not yet verified and must not be inferred.
- Matrix can combine multiple asset classes in one view.

Implementation implications:
- Our scanner should support a compact multi-timeframe matrix view in addition to setup rows.
- Underlying state for each timeframe must remain independently calculated.
- Add configurable symbol groups such as broad-market ETFs, sectors, custom watchlists, and later crypto/futures only if data support is added.
- Investigate dashed vs solid pill semantics before adopting.

### 4. Ticker Matrix filters
Observed filter modal supports:
- timeframes: 15, 30, 60, 4H, 12H, D, W, M, Q, Y, All
- optional Price column
- preset markets: Stocks, Futures, Crypto
- custom Watchlists
- Alert Groups

Observed Stocks preset symbols: SPY, QQQ, DIA, IWM.
Observed Futures examples: ES=F, NQ=F, RTY=F, YM=F.
Observed Crypto examples: BTCUSDT, ETHUSDT, SOLUSDT, BNBUSDT, XRPUSDT.

Implementation implications:
- User-configurable timeframe set should be core UI behavior.
- Preset universes and custom watchlists should be separate concepts.
- Alert groups can be modeled later as saved condition sets tied to universes.
- 4H / 12H introduce aggregation-semantics requirements; do not enable until provider bar anchoring is verified.

### 5. Candle Snapshot settings / sector groups
Observed `CANDLE SNAPSHOT SETTINGS` modal with:
- Market: Stocks / Futures / Crypto
- `Show details` toggle
- `Ticker Group`
- `Watchlist`

The Ticker Group dropdown visibly contains sector ETF groups including:
- XLI — Industrials
- XLK — Information Technology
- XLP — Consumer Staples
- XLRE — Real Estate
- XLU — Utilities
- XLV — Health Care
- XLY — Consumer Discretionary

Implementation implications:
- Sector breadth is not merely a separate statistics page; the same candle-snapshot engine can be scoped to a sector constituent group.
- We should model `universe/group -> timeframe -> state counts -> percentages` generically.
- Sector ETF should be both a symbol with its own Strat state and a selector for its constituent group; keep those concepts separate.

### 6. Economic/news context panels
Observed panels for:
- FinancialJuice News
- Economic Events with Low / Medium / High impact filters
- FinancialJuice Squawk
- Market Schedule

Implementation implications:
- External event/news data is contextual evidence, not setup validity.
- Event impact and market schedule should live in the Market Context layer and can power caution banners around high-impact events.
- No rule should automatically invalidate a Strat setup solely because an economic event exists unless a user guardrail explicitly says so.

### 7. Crypto majors / Fear-Greed
Observed:
- `CRYPTO MAJORS TAPE` with symbol, price, 24h move
- Crypto Fear/Greed gauge

Implementation implications:
- Useful reference for modular market-context cards.
- Not needed for first equity-focused build.
- If crypto support is added, sentiment metrics remain advisory/contextual rather than core Strat logic.

### 8. Top Movers / Top Gappers
Observed:
- Top Gainers / Top Decliners panels
- Top Gappers with Gap Up / Gap Down
- settings for number of tickers per side

Implementation implications:
- These are generic discovery modules and can be implemented after core scanner validation.
- Gappers may be especially useful as premarket context, but gap percentage itself must not alter canonical Strat classification.
- User-configurable row count is a useful low-friction UI pattern.

## Confirmed design consequences from Batch 1

1. Build scanner statistics from the same deterministic candle-state store used by symbol analysis.
2. Add a generic aggregation model:
   `Universe/Group -> Timeframe -> State Counts -> Percentages`.
3. Treat Market Breadth and Sector Breadth as views of the same underlying aggregation engine.
4. Add a compact multi-timeframe Ticker Matrix alongside the main setup scanner.
5. Support preset universes, sector groups, and custom watchlists independently.
6. Keep context modules (economic calendar, news, squawk, sentiment) separate from pure Strat validity.
7. Do not encode unknown labels or visual states (`3G`, `F2D`, dashed pills) until sourced.

## Open questions from Batch 1

- Exact definition of `3G`.
- Exact definition of `F2D`.
- Meaning of dashed vs solid state-pill border.
- Whether percentages are based on all symbols in the group or only symbols with valid/current data.
- How sector constituent membership is maintained and whether ETFs themselves are included in their groups.
- Update cadence of Candle Snapshot and Market Breadth.
- Whether 4H/12H are exchange/session anchored or provider-native clock bars.
