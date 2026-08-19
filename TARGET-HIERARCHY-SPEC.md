# Target Hierarchy / De-duplication Spec v0.1

Date: 2026-08-19

## Purpose

After structural qualification, the engine may receive multiple valid targets from Daily, Weekly, Monthly, or other ranges. This layer orders those targets and removes duplicate display/objective levels without changing the underlying structural evidence.

## Core rule

Objective order follows the direction of price travel, not timeframe prestige.

- Bullish: lower qualified target price first, then progressively higher prices.
- Bearish: higher qualified target price first, then progressively lower prices.

A farther Weekly or Monthly target does not leapfrog a nearer Daily target merely because its timeframe is larger.

## Exact-price de-duplication

If multiple qualified structures resolve to the exact same price, they are represented as one objective level.

The merged level preserves:
- all supporting target ids;
- all supporting timeframe labels;
- all supporting range ids;
- source count;
- the fact that multiple structures agree on the same boundary.

This prevents duplicate chart/UI lines while retaining the evidence that several structures independently point to the same level.

## Near-identical prices

There is not yet a sourced universal threshold for declaring two nearby but unequal prices to be the same Strat target.

Therefore:
- default production semantics merge exact prices only;
- nearby-price clustering is advisory/display-only;
- a caller may supply an explicit non-negative absolute-price tolerance for grouping nearby levels;
- advisory clustering does not change objective prices, consumption state, or target order;
- no hidden/default percentage, ATR, cents, tick, or timeframe-specific tolerance is invented in this layer.

A later research/data-adapter layer may provide symbol/tick-aware or empirically validated display tolerances, but those must remain separate from structural target validity.

## Consumption semantics

A merged exact-price level is considered consumed only when all of its contributing source targets are marked consumed.

This is conservative: one stale/consumed source should not silently erase another still-active structural source at the same price.

## Higher-timeframe agreement

Multiple timeframe sources at one exact level are preserved as supporting evidence. They are not currently assigned an arbitrary numerical weight or confidence score.

Potential future research field:
- `sourceCount`
- `supportingTimeframes[]`
- `supportingRangeIds[]`

These can later be tested as context/ranking variables without altering deterministic setup validity.

## Pipeline position

`SETUP -> MAGNITUDE -> STRUCTURAL QUALIFICATION -> TARGET HIERARCHY / DE-DUP -> OBJECTIVE STATE -> EXHAUSTION`

This module consumes already-qualified targets. It does not decide whether a raw pivot/range is structurally valid.

## Important constraints

- Exact same level may be merged semantically.
- Near-same level is not automatically merged semantically.
- Price-path order controls target sequence.
- Higher timeframe does not automatically override nearer lower-timeframe objective.
- De-duplication must preserve source provenance.
- Clustering is not evidence of higher probability.
- Exhaustion remains separate and is determined after active objective structure is consumed.

## Implementation

Files:
- `target-hierarchy.js`
- `tests/target-hierarchy-validation.js`

Focused validation currently covers bullish/bearish ordering, exact-price merging, source preservation, consumed-state handling, caller-controlled proximity clustering, and rejection of invented negative/invalid tolerances.
