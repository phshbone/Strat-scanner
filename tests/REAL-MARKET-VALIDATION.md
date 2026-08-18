# Real-Market Validation Log

## Case RM-001 — SPY September 2021 Outside 50 / potential outside month

Source example: Sarah / Strat Sniper transcript supplied in project discussion. Sarah described SPY in September 2021 taking the prior month's high, failing, retracing through 50% of the August range, and then targeting the August low to complete an outside month.

### Historical data used
For reproducible calculations in the code fixture, use one internally consistent adjusted series from StatMuse:
- August 2021 adjusted high: 423.44
- August 2021 adjusted low: 407.58
- midpoint: 415.51
- September 2 adjusted high: 424.36
- September 13 adjusted low: 415.07; adjusted close: 417.38
- September 20 adjusted low: 402.10

A separate unadjusted monthly source (Kabutan US historical prices) reports:
- August 2021 high: 453.07
- August 2021 low: 436.10
- August midpoint: 444.585
- September 2021 high: 454.05
- September 2021 low: 428.78

The raw-price levels differ from adjusted data and from Sarah's chart because providers may use different adjustment conventions. The validation must never mix adjusted and unadjusted values inside one calculation.

### Sequence validation
1. September took the August high first. On the adjusted series, September 2 high 424.36 exceeded August high 423.44.
2. The August adjusted midpoint was 415.51.
3. On September 13, SPY traded down to 415.07, crossing the midpoint intraday.
4. The September 13 adjusted close was 417.38, back above the midpoint.
5. Therefore a rule implementation that requires the DAILY or MONTHLY close to be below the midpoint would incorrectly miss the live 50% event.
6. The bearish outside target was the August low, 407.58 adjusted.
7. On September 20, SPY traded to 402.10 adjusted, taking the target.

### Engine consequence
Outside 50 confirmation is based on the live price trading through the midpoint after one side has been taken. It is not a close-confirmation rule.

For live streaming:
`currentPrice <= midpoint` after HIGH-first => bearish Outside 50 confirmed.
`currentPrice >= midpoint` after LOW-first => bullish Outside 50 confirmed.

For historical replay with lower-timeframe OHLC:
- a lower-timeframe low at/below midpoint can prove a bearish midpoint crossing;
- a lower-timeframe high at/above midpoint can prove a bullish midpoint crossing;
- exact ordering inside a bar remains unknown if multiple sequence-critical events happen within that same bar.

### Status
PASS for the stated Outside 50 sequence and target geometry.

This is one known example. It is validation of rule implementation, not evidence of statistical expectancy or profitability.

### Web sources consulted
- StatMuse, SPY August 2021 daily history
- StatMuse, SPY September 2021 daily history
- Kabutan US, SPY monthly historical prices

Retrieved: 2026-08-18.
