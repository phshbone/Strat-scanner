# Known Strat Scenarios — Validation Fixtures

Status: deterministic rule validation only.

These fixtures are synthetic OHLC scenarios derived from the locked Trading System rule specification. Their purpose is to prove that the software implements the intended rule definitions consistently before real historical market data is attached.

They are **not** evidence of profitability and they are **not** a backtest.

## Covered now

- 1 / inside-bar classification
- 2U classification
- 2D classification
- 3 / outside-bar classification
- bullish 2-2 reversal
- bearish 2-2 reversal
- bullish 2-1-2 reversal
- bearish 2-1-2 reversal
- bullish 3-1-2
- pending inside-bar break
- bullish FTFC
- bearish FTFC
- time-exhaustion boundary behavior
- 50% stop calculation
- structure stop calculation
- in-force logic
- outside-bar path ambiguity warning

## Critical audit limitation

A completed OHLC bar can prove that a bar is a `3`, but OHLC alone cannot prove which side of the prior range traded first. Therefore a historical `3` cannot automatically be labeled as a bullish or bearish failed-2 reversal unless lower-timeframe or intrabar data resolves the sequence.

The production backtest must preserve this limitation rather than infer the missing path.

## Next validation layer

After these deterministic fixtures remain stable, the next step is chart-level/historical validation using real market OHLC:

1. select known historical examples,
2. reconstruct the relevant timeframe bars,
3. compare software classifications, triggers, stops, and targets to the locked rule definitions,
4. record discrepancies,
5. repair the engine before any performance research begins.

The Backtest Auditor gate remains closed until rule-level and chart-level validation pass.
