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

## Batch 2 — Setup Help screenshots

### 9. Strat IDs are explicitly documented
Help page defines:
- `1` Inside = high <= prior high; low >= prior low
- `2U` Two Up = higher high; low >= prior low
- `2D` Two Down = lower low; high <= prior high
- `3` Outside = higher high; lower low

This exactly matches the current deterministic core classifier.

### 10. C2 / C1 terminology resolved
Help page states:
- `C2 = target bar (previous)`
- `C1 = trigger bar (latest)`

This is important because Alex's scanner vocabulary is not simply `two bars ago / prior / current`. Their setup-filter model is specifically target-vs-trigger oriented.

### 11. Setup filter grammar documented
Visible setup filters include:
- `1-1`: C2=1, C1=1
- `1-2`: C2=1, C1=2U or 2D
- `1-3`: C2=1, C1=3
- `2-1`: C2=2U or 2D, C1=1
- `2-2`: C2=2U or 2D, C1=2U or 2D
- `3-1`: C2=3, C1=1
- `3-2`: C2=3, C1=2U or 2D
- `3-3`: C2=3, C1=3

This confirms the scanner intentionally exposes broad two-bar structural filters, including combinations that should not automatically be treated as canonical reversal setups.

Implementation consequence:
- Keep `raw candle-sequence filter` separate from `recognized actionable setup`.
- A user may scan `3-3` or `1-3` without the engine assigning a canonical trade meaning to that combination.

### 12. Color / candle-shape filters documented
Visible filters:
- `2d-green`: trigger candle is 2D and green
- `2d-green-hammer`: trigger candle is a green 2D hammer
- `2u-red`: trigger candle is 2U and red
- `2u-red-shooter`: trigger candle is a red 2U shooter
- `3-green`: outside-bar trigger candle is green
- `3-red`: outside-bar trigger candle is red

Help text defines:
- Hammer = long lower shadow with close near the high
- Shooter = long upper shadow with close near the low

Exact numeric wick/body thresholds are not visible in these screenshots and must not be invented.

### 13. `3G` is now strongly resolved as `3-green`
The Candle Snapshot row `3G` is highly likely to mean the documented `3-green` filter/state because the help page explicitly names `3-green` as an outside bar whose trigger candle is green.

Status: **high-confidence operational interpretation**, not yet treated as a canonical Strat term.

### 14. `F2D` likely means failed 2-down, but remains unconfirmed
User suggested `F2D = failed two down`. This is plausible and consistent with Strat vocabulary, and Rob's material explicitly recognizes failed 2 behavior. However, the supplied help screenshots do not visibly define the `F2D` abbreviation.

Status: **probable but not yet confirmed**. Do not hard-code the abbreviation until a direct help/legend/source definition is captured.

### 15. Scanner tiering is explicitly documented
A visible tier table ranks trigger/target combinations:

Tier 1:
- 2U red shooter
- 2D green hammer
- 1 when C2=1
- target: any; 1 when C1=1
- note: highest tier match wins

Tier 2:
- 2U shooter
- 2D hammer
- 2U red
- 2D green
- target: any

Tier 3:
- 2U or 2D
- target: any

Tier 4:
- trigger 1 or 3
- target 1 or 3
- fallback tier when 1/3 present

Implementation consequence:
- This tier system is an **Alex/StratAlerts scanner ranking layer**, not canonical Strat validity.
- If adopted, preserve it as a source-labelled optional ranking profile rather than letting it alter core setup detection.
- "Highest tier match wins" implies deterministic precedence among overlapping scanner labels.

### 16. Product architecture clues from shortcuts
Help page shortcuts expose distinct modules:
- `/` quick symbol search
- `q` AI Search
- `a` Alerts
- `b` Simultaneous Breaks
- `m` Mission Control
- `w` Watchlists
- `s` Setups Table

This confirms Simultaneous Breaks is treated as a first-class product surface, separate from the normal Setup table and Mission Control.

## Confirmed design consequences from Batches 1-2

1. Build scanner statistics from the same deterministic candle-state store used by symbol analysis.
2. Add a generic aggregation model:
   `Universe/Group -> Timeframe -> State Counts -> Percentages`.
3. Treat Market Breadth and Sector Breadth as views of the same underlying aggregation engine.
4. Add a compact multi-timeframe Ticker Matrix alongside the main setup scanner.
5. Support preset universes, sector groups, and custom watchlists independently.
6. Keep context modules (economic calendar, news, squawk, sentiment) separate from pure Strat validity.
7. Model raw two-bar sequence filters independently from canonical actionable-setup recognition.
8. Preserve scanner tiering, color filters, hammer/shooter filters, and `3-green` as source-labelled operational layers.
9. Treat `3G` as high-confidence `3-green` shorthand.
10. Keep `F2D` unresolved/probable until direct source confirmation.
11. Do not infer exact hammer/shooter geometry thresholds from prose alone.
12. Simultaneous Breaks deserves its own scanner/view rather than merely a column.

## Open questions after Batch 2

- Direct source definition of `F2D`.
- Meaning of dashed vs solid state-pill border.
- Exact numeric hammer/shooter qualification rules.
- Whether percentages are based on all symbols in the group or only symbols with valid/current data.
- How sector constituent membership is maintained and whether ETFs themselves are included in their groups.
- Update cadence of Candle Snapshot and Market Breadth.
- Whether 4H/12H are exchange/session anchored or provider-native clock bars.
- Exact computation/meaning of the documented tier system in every overlap case beyond `highest tier match wins`.
