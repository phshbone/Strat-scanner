# Research-only 60-minute and Daily Strat Observations

## Purpose
Support the user's intended swing-trading timeframes without weakening the existing 5/15/30-minute production semantics or guessing how Twelve Data anchors native 60-minute candles.

## Source and candle construction
- Use the already fetched/validated US equity 15-minute RTH series. No additional paid endpoints or market-data requests.
- Require a **complete** regular US trading session: exactly 26 consecutive 15-minute bars anchored to 09:30 America/New_York, ending at 16:00.
- 60-minute research bars: 09:30–10:30, 10:30–11:30, 11:30–12:30, 12:30–13:30, 13:30–14:30, 14:30–15:30, plus an explicitly marked shortened **15:30–16:00** closing bar. This is an internally defined RTH series **not** claimed equivalent to a native broker/provider 60-minute chart.
- Daily research bars: 09:30–16:00 ET, aggregating exactly 26 constituent completed 15m bars. DST conversion is based on America/New_York.
- Missing bars, shortened sessions, and incomplete trading days are excluded entirely; event construction is segmented around observed incomplete sessions so missing data do not create artificial consecutive candle setups. Whole missing trading days cannot be detected without an exchange calendar and remain a coverage limitation.
- All derived bars preserve source provider/aggregation and timeframe/observation provenance. Provider-supplied native 60-minute candles remain **production-disabled** in `period-resolver.js`.

## Setup observation
- The canonical `core.detectSetup` determines setup family, direction, variant, trigger and magnitude. No edits to Strat definitions.
- Inside each historical 60-minute or daily candle, each partial candle is built solely from **completed** 15-minute checkpoints observed so far. Completed prior derived bars are used as context, never the final OHLC of the active bar.
- Same-15-minute-bar outside reversal sequence is not guessed. First actionable setup observation for a given setup/direction/variant is retained once per parent candle; untouched magnitude and trigger-in-force requirements mirror the current 15m research model.
- 60m and D observation records have `evidenceEligible:false`, `resolution:NOT_EVALUATED`, no win rate, and no realized-R or options P&L. **Do not compare these observation counts to the 15m outcome rates as performance comparisons.**
- FTFC across verified daily, weekly and monthly periods is a later task and must not silently use future closing values.

## Required follow-up validation gates
1. Verify 60-minute RTH anchor and final half-hour semantics versus actual target chart/broker conventions before any production integration.
2. Verify source completeness against an exchange calendar, including exchange holidays and early close days.
3. Reconstruct actionable higher timeframe signal paths using 5m/15m checkpoints, resolve target-vs-stop ordering, overnight gaps, open fills and hold-to-expiration cases; flag ambiguity rather than guessing.
4. Run out-of-sample symbol/regime and time-slice comparisons on realistic R-multiples with fees and execution costs.
5. Promote higher timeframe FTFC and scanner signal labels only after explicit separate production review.

## Guardrails
Pure Strat remains the only trade rule authority; Minervini is deferred. No trading, brokerage orders, position sizing, or live signal changes are authorized by this research-only extension.
