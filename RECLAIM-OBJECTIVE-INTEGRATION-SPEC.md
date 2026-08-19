# Reclaimed-Range Objective Integration

Date: 2026-08-19

## Purpose

Connect verified range-reclaim objectives into the existing deterministic target hierarchy and price-exhaustion pipeline without changing pure Strat setup validity.

## Production path

`SETUP MAGNITUDE -> STRUCTURAL RANGE TARGETS + VERIFIED RECLAIM TARGETS -> EXACT-PRICE MERGE -> PRICE-PATH ORDER -> OBJECTIVE STATE -> PRICE EXHAUSTION`

## Inputs

`objective-pipeline.js` now accepts:
- `candidateRanges`: existing structurally qualified broader ranges;
- `reclaimRanges`: explicit prior ranges eligible for range-reclaim evaluation;
- `previousReclaimStates`: prior reclaim-state map used to preserve active/failure semantics.

Only `range-reclaim.js` may decide whether a supplied reclaim range currently emits an objective. The objective pipeline does not create reclaim geometry.

## Reclaim target adapter

An active reclaimed-range objective is translated to the common hierarchy shape with:
- `source = RANGE_RECLAIM`;
- `sourceType = RECLAIMED_RANGE_OPPOSITE_BOUNDARY`;
- `rangeId = sourceRangeId`;
- `structurallyRelevant = true`;
- `eligibleTarget = true`.

This is an adapter only. It does not alter price, direction, timeframe, source range, or consumed state.

## Ordering

All objective sources share one deterministic price path.

Examples:
- bullish: 110 structural target precedes 115 reclaim target;
- bearish: 98 structural target precedes 90 reclaim target;
- timeframe prestige never reorders the path.

## Exact-price agreement

If structural qualification and range reclaim both produce the same exact price, `target-hierarchy.js` merges them into one objective while preserving provenance:
- supporting target IDs;
- supporting timeframes;
- supporting range IDs;
- supporting sources;
- supporting source types.

No near-price semantic merge is introduced. Existing optional proximity clustering remains advisory only.

## Exhaustion semantics

Setup magnitude remains the first objective.

After magnitude:
- an active unconsumed reclaim target prevents price exhaustion;
- once all currently qualified structural and reclaim objectives are consumed, `priceExhaustionRisk` becomes true;
- a completed reclaim objective does not predict reversal;
- an unverified reclaim range cannot create an objective or suppress exhaustion.

## Safeguards

- reclaim ranges must still be explicit and source-verified upstream;
- reclaim alone is not an entry signal;
- no universal Level-of-Reclaim formula is introduced;
- no timeframe receives automatic priority;
- no objective source receives automatic priority;
- exact-price de-duplication preserves cross-source provenance;
- setup magnitude remains distinct from post-magnitude targets.

## Validation

Focused integration harness:
- `tests/reclaim-objective-pipeline-validation.js`

Local Node execution on 2026-08-19:
- existing objective pipeline regression: **20/20 PASS**;
- existing target-hierarchy regression: **22/22 PASS**;
- new reclaim-objective integration: **19/19 PASS**.
