# Pivot Machine Gun (PMG) Spec v0.1

Date: 2026-08-19

## Purpose

PMG is modeled as deterministic staircase geometry plus a separate actionable reversal state.

The engine must not treat the staircase itself as an entry signal. It detects the structure first, then waits for a valid Strat reversal in the PMG direction to become in force.

## Source basis

Operational sources consulted:

1. Sara Strat Sniper's published TrendSpider scanner, `Strat M PMG Short`:
   - current monthly low > prior monthly low
   - prior low > low two bars ago
   - continuing through low five bars ago
   - this is six monthly lows linked by five strict higher-low comparisons.
   - https://charts.trendspider.com/shared/61579bb0e8c2bc001502586f?t=1

2. Public TheStrat indicator description on TradingView:
   - PMG labels 5 or more consecutive candles making higher lows, or 5 or more consecutive candles making lower highs.
   - https://www.tradingview.com/script/mEysdLUr-The-Strat-Numbers-Combos/

3. Public Strat educational material consistently describes PMG as a series of higher lows or lower highs that can be traversed rapidly on reversal.

Because Sara's literal monthly-short scanner uses six candles while broader public descriptions commonly state five-or-more candles, the engine preserves both rather than forcing one interpretation:
- general default: `minBars = 5`;
- Sara monthly short reproduction preset: `SARA_MONTHLY_SHORT`, requiring 6 bars.

## Geometry

### Bearish PMG candidate
A sequence of strictly increasing lows:

`L1 < L2 < L3 < ...`

These form the visible rising staircase. On a bearish reversal, the prior lows become sequential downside levels.

### Bullish PMG candidate
A sequence of strictly decreasing highs:

`H1 > H2 > H3 > ...`

These form the falling staircase. On a bullish reversal, the prior highs become sequential upside levels.

Equality breaks the strict sequence.

## Detection state

`detectPmg()` returns:
- `qualifies`
- `direction`: `BEARISH`, `BULLISH`, `BOTH`, or null
- `pattern`: `HIGHER_LOWS`, `LOWER_HIGHS`, or `CONTRACTING_PMG`
- `requiredBars`
- `barCount`
- `timeframe`
- source bars

If both higher-lows and lower-highs conditions occur simultaneously, the detector records `BOTH / CONTRACTING_PMG`. It does not choose a trade direction from geometry alone.

## Actionable state

PMG geometry is not a trade trigger.

`buildPmgState()` requires:
1. valid PMG geometry;
2. a separate Strat reversal direction;
3. that reversal to be in force;
4. reversal direction to match the PMG traversal direction.

States:
- `NO_PMG`
- `PMG_WAITING_FOR_REVERSAL`
- `PMG_IN_FORCE`

This preserves the architecture rule that observable setup/reversal logic remains the source of entry state.

## PMG levels

For a bearish PMG:
- use the staircase lows as sequential downside levels;
- order nearest-to-farthest downward.

For a bullish PMG:
- use the staircase highs as sequential upside levels;
- order nearest-to-farthest upward.

PMG level objects carry:
- `source: PMG`
- `pmgDirection`
- `structurallyRelevant: true`
- `eligibleTarget: true`

This lets the existing target hierarchy/objective machinery consume PMG levels without inventing a separate target engine.

## Important constraints

- PMG geometry alone is not an entry signal.
- A PMG can continue in the direction that formed it; reversal is not guaranteed.
- Do not encode a probability or acceleration claim as deterministic fact.
- Do not invent a universal maximum spacing requirement in cents, percent, or ATR until sourced or empirically validated.
- Do not force Sara's six-bar monthly scanner criterion onto every timeframe; retain it as a reproducible preset.
- Do not treat a historical profit example as evidence of expectancy.
- FTFC can be stored as context/ranking; it does not redefine PMG geometry.

## Integration

Current path:

`PMG GEOMETRY -> VALID STRAT REVERSAL / IN FORCE -> PMG LEVELS -> TARGET HIERARCHY -> OBJECTIVE / EXHAUSTION`

PMG should later be included as a research feature so historical comparisons can test:
- PMG vs non-PMG setups;
- number of PMG levels;
- timeframe;
- direction;
- FTFC alignment;
- setup type triggering traversal;
- magnitude/target hit rates;
- MFE/MAE;
- time between successive PMG level breaks.

## Validation

`tests/pmg-validation.js` currently reports **21/21 PASS locally**.

It covers:
- five-bar general higher-low detection;
- five-bar general lower-high detection;
- strict inequality/equality failure;
- Sara six-bar monthly-short preset;
- PMG level extraction/order;
- timeframe/source metadata;
- no-action without reversal;
- matching in-force reversal activation;
- opposite-direction and out-of-force rejection;
- invalid minimum-bar configuration.
