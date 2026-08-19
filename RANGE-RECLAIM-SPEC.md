# Range-Aware Reclaim Specification

Date: 2026-08-19

## Purpose

Model Levels of Reclaim as explicit structural gateways back into previously validated outside/broadening ranges.

This module does **not** decide that every historical range is a valid reclaim range. Upstream research/detection must supply an explicit source range marked `verified=true`.

## Structural model

`PRIOR VERIFIED RANGE -> RECLAIM BOUNDARY -> RANGE RE-ENTRY -> OPPOSITE BOUNDARY OBJECTIVE -> COMPLETION / FAILURE`

### Bullish traversal

- source range = `[rangeLow, rangeHigh]`
- reclaim boundary = `rangeLow`
- re-entry requires `price > rangeLow`
- opposite-boundary objective = `rangeHigh`
- target is complete at `price >= rangeHigh`
- after a prior reclaim, falling back to `price <= rangeLow` marks reclaim failure

### Bearish traversal

- source range = `[rangeLow, rangeHigh]`
- reclaim boundary = `rangeHigh`
- re-entry requires `price < rangeHigh`
- opposite-boundary objective = `rangeLow`
- target is complete at `price <= rangeLow`
- after a prior reclaim, rising back to `price >= rangeHigh` marks reclaim failure

Equality at the reclaim boundary is not treated as successful re-entry. Equality after an already-established reclaim is treated as loss of that defended boundary.

## States

- `NO_VERIFIED_RECLAIM_RANGE`
- `RANGE_RECLAIM_PENDING`
- `TRAVERSING_RECLAIMED_RANGE`
- `RECLAIM_RANGE_TARGET_HIT`
- `RECLAIM_RANGE_FAILED`

## Objective output

Once a verified range is actively reclaimed, the module emits a structural objective:

- `sourceType = RECLAIMED_RANGE_OPPOSITE_BOUNDARY`
- price = opposite side of the source range
- source range ID/timeframe are preserved
- target completion marks the objective consumed

This objective can later feed the existing target hierarchy / price-exhaustion system.

## Safeguards

- no midpoint-stop substitution;
- no structure-stop substitution;
- no inferred reclaim from an unverified range;
- no setup-only universal reclaim formula;
- reclaim by itself is not an entry signal;
- source range identity and timeframe remain attached;
- nested verified ranges may coexist;
- objective ordering is by actual price path, not timeframe prestige;
- range completion creates price-exhaustion context, not an automatic reversal signal.

## Files

- `range-reclaim.js`
- `tests/range-reclaim-validation.js`

Focused local Node validation: **24/24 PASS** on 2026-08-19.
