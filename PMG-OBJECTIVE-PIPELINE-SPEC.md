# PMG Objective Pipeline Spec

Date: 2026-08-19

## Purpose

Connect deterministic Pivot Machine Gun staircase geometry to the existing production objective engine without giving PMG geometry independent trade authority.

## Production chain

`PMG GEOMETRY -> MATCHING STRAT REVERSAL IN FORCE -> PMG LEVELS -> TARGET HIERARCHY -> OBJECTIVE STATE -> PRICE EXHAUSTION`

## Rules

1. PMG geometry alone is not actionable.
2. A matching directional Strat reversal must be in force before PMG levels enter objective state.
3. Setup-defined magnitude remains the first objective.
4. Only PMG levels beyond setup magnitude are eligible as post-magnitude objectives.
5. PMG levels are ordered by actual price path:
   - bearish: nearest lower level to farthest lower level;
   - bullish: nearest higher level to farthest higher level.
6. Exact-price de-duplication remains delegated to `target-hierarchy.js`.
7. No universal PMG spacing threshold is introduced.
8. Price exhaustion becomes true only after setup magnitude and all currently active PMG levels are consumed.
9. PMG traversal remains target/fuel context, not a prediction that every level must be reached.

## Non-actionable states

If PMG geometry is present but:
- the reversal is not in force, or
- the reversal direction does not match the PMG traversal direction,

then the pipeline returns no target hierarchy and no objective state.

## Files

- `pmg-objective-pipeline.js`
- `tests/pmg-objective-pipeline-validation.js`

## Validation

The focused harness covers bearish and bullish symmetry, magnitude-first behavior, sequential PMG promotion, direction mismatch, out-of-force behavior, and price exhaustion after the active PMG stack is cleared.
