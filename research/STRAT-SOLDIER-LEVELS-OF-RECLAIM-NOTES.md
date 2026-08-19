# Strat Soldier — Levels of Reclaim Notes

Source supplied by user: https://youtu.be/uNNtzuDTABo
Date reviewed: 2026-08-19

## Source positioning

Jermaine / Strat Soldier explicitly states that the Levels of Reclaim concept in this video comes from Rob Smith's original 2018 Strat course. Treat this as a purist/canonical cross-check of Rob-era teaching, while preserving Rob Smith as the ultimate authority.

## Core operational rule extracted

Levels of Reclaim are used to represent re-entry into prior broadening / outside-bar ranges without drawing a dense web of broadening-formation trendlines.

Operationally:

1. Identify a prior Scenario 3 / outside bar or broader prior range.
2. Mark the horizontal price level that represents price reclaiming back into that prior range.
3. Once an actionable signal pushes price through that reclaim level, the prior range is considered re-entered.
4. The opposite side of that prior range becomes the directional objective / magnitude context.
5. Additional outside-bar reclaim levels inside the route can become sequential intermediate objectives.
6. Full timeframe continuity and actionable signals still control participation; the reclaim level by itself is not an entry signal.
7. When the opposite side of the reclaimed prior range is reached, that range is spent and price-exhaustion risk rises.

## Important geometry distinction

The transcript does not support one universal formula such as midpoint, candle open, candle close, or structure stop for every setup.

Instead, reclaim is range-relative:
- it is a horizontal structural threshold that gets price back inside a prior range / outside-bar structure;
- exact reclaim price depends on which prior range is being reclaimed;
- multiple reclaim levels can exist across nested/fractal ranges.

The examples mention reclaims associated with:
- prior outside bars;
- old triangle / broadening ranges;
- combinations of opens/closes and structural boundaries in examples;
- nested daily/weekly/monthly structures.

Therefore `levelOfReclaim` must remain source-derived per structural range rather than being calculated from a universal setup-only formula.

## Relationship to magnitude

This video materially clarifies the relationship:

`ACTIONABLE SIGNAL -> RECLAIM PRIOR RANGE -> TRAVEL THROUGH THAT RANGE -> OPPOSITE SIDE / MAGNITUDE`

Reclaim is therefore a gateway into a previously established structural range, while magnitude is the opposite-side objective once that range is re-entered.

This is consistent with TheStrat.ai current documentation that after a broadening range completes and price returns inside a prior range, Levels of Reclaim become the active structural references.

## Multi-timeframe behavior

Jermaine explicitly describes a hierarchy:
- read the month;
- require the week to reconfirm the month;
- require the day and 60 to reconfirm the week/month;
- if lower frames do not reconfirm, he does not take the trade.

This is a personal implementation preference, not a universal mandatory filter. The engine should preserve it as a configurable strategy profile / evidence rule, not hard-code it globally.

## Warning-card / management implications

The interpretation engine can now distinguish:
- `RANGE_RECLAIM_PENDING`
- `RANGE_RECLAIMED`
- `TRAVERSING_RECLAIMED_RANGE`
- `RECLAIM_RANGE_TARGET_HIT`
- `RECLAIM_RANGE_FAILED`

Potential card examples:

- Reclaim confirmed — price is back inside the prior Weekly outside-bar range. Opposite side becomes the active structural objective.
- Reclaim failed — price moved back below/above the reclaimed boundary. Prior range-traversal thesis is no longer confirmed.
- Reclaimed range complete — opposite side reached; price-exhaustion context now applies.

## Engine consequence

Do not attempt to compute Level of Reclaim only from setup type.

Instead introduce / use range-aware reclaim objects:

```text
reclaimId
sourceRangeId
sourceTimeframe
reclaimPrice
direction
oppositeBoundary
rangeHigh
rangeLow
verified
source
consumed
failed
```

Then management can select the nearest valid verified reclaim from active ranges.

## Locked safeguards

- Reclaim is not synonymous with midpoint stop.
- Reclaim is not synonymous with structure stop.
- Reclaim is not automatically the open or close of the signal candle.
- Reclaim alone is not an entry signal.
- Exact range source/provenance must be preserved.
- Multiple nested reclaim levels may coexist.
- Opposite side of the reclaimed range is the structural objective for that reclaim context.
- Completion of that range creates price-exhaustion context, not an automatic reversal call.

## Status

This transcript resolves the largest conceptual ambiguity: Level of Reclaim is best modeled as a range-relative structural threshold, not a universal per-pattern formula. Exact reclaim prices still need to be extracted from the actual source range geometry, but the engine can now be designed around range-aware reclaim objects rather than waiting for a single formula that likely does not exist.
