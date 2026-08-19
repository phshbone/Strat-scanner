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

---

## Case RM-002 — SPY August 2021 daily 2-2 reversals

Historical source: adjusted SPY daily OHLC from StatMuse for August 2021. Code fixture: `tests/real-example-spy-2021-08-2-2.js`.

### RM-002A — bullish 2-2 on August 20
Relevant bars:
- Aug 17: H 415.86 / L 412.02
- Aug 18: H 415.55 / L 410.22 => 2D vs Aug 17
- Aug 19: H 412.29 / L 407.60 => 2D vs Aug 18
- Aug 20: H 414.69 / L 410.96 => 2U vs Aug 19
- Aug 23: H 418.92 / L 414.44

Engine result:
- setup: bullish `2-2`
- trigger: Aug 19 high = 412.29
- source range for first magnitude: Aug 18
- first magnitude: Aug 18 high = 415.55
- midpoint stop on Aug 19 signal/reference bar: 409.945

Outcome with midpoint-stop model:
- Aug 20 triggered the 2U but neither hit the 415.55 magnitude nor the 409.945 midpoint stop;
- Aug 23 traded above 415.55;
- result = **WIN: magnitude before midpoint stop**.

This confirms the engine's current bullish 2-2 first-magnitude geometry on a real daily sequence.

### RM-002B — bearish 2-2 on August 26
Relevant bars:
- Aug 23: H 418.92 / L 414.44
- Aug 24: H 419.21 / L 418.16 => 2U vs Aug 23
- Aug 25: H 420.07 / L 418.49 => 2U vs Aug 24
- Aug 26: H 419.51 / L 416.98 => 2D vs Aug 25

Engine result:
- setup: bearish `2-2`
- trigger: Aug 25 low = 418.49
- source range for first magnitude: Aug 24
- first magnitude: Aug 24 low = 418.16
- midpoint stop on Aug 25 signal/reference bar: 419.28
- structure stop: Aug 25 high = 420.07

Outcome comparison:
- Aug 26 traded below the 418.16 magnitude and above the 419.28 midpoint stop inside the same daily bar;
- daily OHLC alone cannot prove which happened first;
- midpoint-stop scenario = **AMBIGUOUS** until lower-timeframe path is supplied;
- Aug 26 did not reach the 420.07 structure stop, so the structure-stop scenario = **WIN**.

This is an important research example because the identical Strat setup produces different backtest resolution depending on stop model and available path granularity. The engine must preserve that distinction rather than force a win or loss from coarse daily OHLC.

### RM-002 focused test status
`tests/real-example-spy-2021-08-2-2.js`: **PASS — 23/23 checks locally.**

### Status
PASS for:
- real daily bullish and bearish 2-2 detection;
- setup-specific source-range / first-magnitude selection;
- midpoint-stop vs structure-stop scenario separation;
- preservation of same-bar sequence ambiguity.

This validates implementation on two real examples only. It does not establish a historical success rate or expectancy.

---

## Case RM-003 — SPY November 2021 daily 2-1-2 reversals

Historical source: adjusted SPY daily OHLC from StatMuse for November 2021. Code fixture: `tests/real-example-spy-2021-11-2-1-2.js`.

### RM-003A — bearish 2-1-2 on November 9
Relevant bars:
- Nov 4: H 437.86 / L 435.98
- Nov 5: H 441.28 / L 437.78 => 2U vs Nov 4
- Nov 8: H 440.89 / L 438.99 => inside (`1`) vs Nov 5
- Nov 9: H 440.27 / L 436.81 => 2D vs Nov 8

Engine result:
- setup: bearish `2-1-2`
- trigger: Nov 8 low = 438.99
- source range for first magnitude: Nov 5
- first magnitude: Nov 5 low = 437.78
- midpoint stop on inside/reference bar: 439.94
- structure stop: Nov 8 high = 440.89

Outcome comparison:
- Nov 9 traded below the 437.78 magnitude and above the 439.94 midpoint stop inside the same daily bar;
- daily OHLC cannot establish which was first;
- midpoint-stop scenario = **AMBIGUOUS**;
- Nov 9 did not take the 440.89 structure stop, so structure-stop scenario = **WIN**.

### RM-003B — bullish 2-1-2 on November 12
Relevant bars:
- Nov 9: H 440.27 / L 436.81
- Nov 10: H 438.22 / L 433.21 => 2D vs Nov 9
- Nov 11: H 436.26 / L 434.81 => inside (`1`) vs Nov 10
- Nov 12: H 438.67 / L 435.15 => 2U vs Nov 11

Engine result:
- setup: bullish `2-1-2`
- trigger: Nov 11 high = 436.26
- source range for first magnitude: Nov 10
- first magnitude: Nov 10 high = 438.22
- midpoint stop on inside/reference bar: 435.535
- structure stop: Nov 11 low = 434.81

Outcome comparison:
- Nov 12 traded above the 438.22 magnitude and below the 435.535 midpoint stop in the same daily bar;
- daily OHLC again cannot determine which occurred first;
- midpoint-stop scenario = **AMBIGUOUS**;
- Nov 12 did not reach the 434.81 structure stop, so structure-stop scenario = **WIN**.

### Status
The real 2-1-2 fixture confirms both bullish and bearish setup detection and the current first-magnitude geometry. It also reinforces the need to keep same-bar path ambiguity explicit when testing tighter stop models from daily OHLC.

This is implementation validation, not a success-rate claim.

### Web sources consulted
- StatMuse, SPY August 2021 daily history
- StatMuse, SPY September 2021 daily history
- StatMuse, SPY November 2021 daily history
- Kabutan US, SPY monthly historical prices

Retrieved: 2026-08-18 to 2026-08-19.
