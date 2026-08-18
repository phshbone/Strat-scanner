# TrendSpider Cross-Validation — Core TheSTRAT Patterns

Date: 2026-08-18

Purpose: cross-check our deterministic pattern definitions against TrendSpider's published TheSTRAT implementation before broad historical scanning.

## Source quality
TrendSpider documents TheSTRAT as a built-in pattern family and attributes the methodology to Rob Smith. Its help center lists more than 20 built-in TheSTRAT patterns, including the exact directional forms we care about.

This is used here as an implementation cross-check, not as a substitute for Rob Smith as the canonical source.

## Core pattern checks

### 2-2 reversal
TrendSpider distinguishes:
- 2U -> 2D reversal
- 2D -> 2U reversal

This matches our directional reversal logic.

### 2-1-2 reversal
TrendSpider lists both:
- 2U -> 1 -> 2D reversal
- 2D -> 1 -> 2U reversal

This matches our current reversal detector.

TrendSpider also lists:
- 2D -> 1 -> 2D Measured Move Reversal
- 2U -> 1 -> 2U Measured Move Reversal

These are valid additional TheSTRAT patterns and must NOT be silently folded into the opposite-direction 2-1-2 reversal class. Preserve them as separate future pattern IDs until their exact operational target/management rules are sourced and validated.

### 3-1-2 reversal
TrendSpider's learning center defines this as:
- outside bar (3)
- inside bar (1)
- directional break (2U or 2D)

This matches our current structural detector.

### RevStrat / inside-reversal family
TrendSpider's built-in list includes:
- 1-2U-2D Inside Reversal
- 1-2D-2U Reversal

Sara Strat Sniper also has a TrendSpider scanner titled `Strat Wk RevStrat Long` using a weekly `1-2D Inside Break (thestrat) Evolves` criterion. This confirms RevStrat belongs in the implementation backlog as a distinct pattern family rather than being inferred ad hoc from generic 2-2 logic.

## Important target-selection caution
TrendSpider's educational material confirms pattern structure and entry-on-break behavior, but its generic examples describe profit targets in terms of prior support/resistance or risk/reward. That is not sufficient authority for us to hard-code every setup target as the opposite side of the first candle in the sequence.

Therefore:
- pattern detection can be considered cross-validated;
- trigger direction can be considered cross-validated;
- universal target selection is NOT yet fully validated;
- magnitude/pivot target logic remains an active validation item.

## FTFC cross-check
TrendSpider publishes a TheSTRAT FTFC example using price above open on 60m, Daily, Weekly, and Monthly. This is consistent with our FTFC state calculation. Our architecture intentionally keeps the timeframe group configurable rather than hard-coding that quartet.

## Status
PASS for structural cross-validation of:
- 2U -> 2D and 2D -> 2U reversals
- 2U -> 1 -> 2D and 2D -> 1 -> 2U reversals
- 3 -> 1 -> 2 directional reversals
- price-vs-open FTFC semantics

OPEN:
- exact magnitude/pivot target selection for each pattern family
- measured-move 2-1-2 variants
- RevStrat operational details
- broadening-reversal variants

No profitability claim is made by this document.
