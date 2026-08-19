# Structural Target Qualification Spec v0.1

Date: 2026-08-19

## Purpose

This layer sits between raw range/pivot discovery and `magnitude.js`.

It answers a narrow question: **after setup-defined magnitude is completed, which broader range boundaries are structurally eligible to become additional targets?**

It must not turn every directional pivot into a target.

## Source-backed constraint

Rob Smith's magnitude/broadening teaching establishes that targets come from active range geometry, not from an arbitrary list of visible pivots.

Alex's operational magnitude teaching adds an important constraint: a larger range should not automatically be projected to its opposite boundary merely because that boundary exists. The initiating side of that larger range must first have been taken/engaged.

This module encodes only that observable structural prerequisite. It does not encode probability, order-flow stories, or a guaranteed expectation that the far boundary will be reached.

## Qualification rule

Given:
- trade direction;
- setup/source range;
- setup-defined magnitude;
- candidate broader ranges;

A candidate broader range is eligible only if all of the following are true:

1. the candidate range is valid and active;
2. it contains the setup range;
3. the relevant initiating side of the broader range has already been taken;
4. its opposite boundary extends beyond setup-defined magnitude in the trade direction.

Direction symmetry:
- bullish traversal toward a broader range high requires `lowTaken === true` for that broader range;
- bearish traversal toward a broader range low requires `highTaken === true` for that broader range.

If the prerequisite side has not been taken, the broader range is not promoted merely because it is a higher timeframe or visually obvious.

## Containment

A broader range must geometrically contain the setup range:

`outer.high >= inner.high`

and

`outer.low <= inner.low`

with at least one strict extension.

Partial overlap is not sufficient for automatic promotion.

## Ordering

Eligible broader targets are ordered by price proximity in the direction of travel:
- bullish: nearest eligible high first;
- bearish: nearest eligible low first.

This ordering does **not** assign greater probability to the nearer target. It only creates deterministic next-objective order once multiple ranges are already qualified.

## Integration with magnitude.js

`buildQualifiedTargets()` converts eligible range boundaries into target objects marked:
- `structurallyRelevant: true`
- `eligibleTarget: true`
- `source: RANGE_BOUNDARY`

Those objects can be passed directly into `buildObjectiveState()` in `magnitude.js`.

State progression remains:

`SETUP MAGNITUDE -> QUALIFIED BROADER TARGET(S) -> EXHAUSTION FOR CURRENT KNOWN STRUCTURE`

If no broader range qualifies after magnitude is reached, the engine may mark exhaustion for the currently known active structure. A later structural change may qualify a new range and rebuild the objective state.

## Deliberate non-rules

This module does not yet decide:
- whether a daily range outranks a weekly range at nearly identical prices;
- how to de-duplicate equal/near-equal boundaries across timeframes;
- PMG spacing thresholds;
- whether non-standard aggregations should participate;
- probabilities of reaching any target;
- whether a target hit implies reversal.

Those remain later validation problems.

## Validation

`tests/target-qualification-validation.js` covers:
- broader-range containment;
- rejection of partial overlap;
- rejection of identical range as a broader range;
- bullish/bearish initiating-side prerequisites;
- exclusion of unengaged larger ranges;
- exclusion of inactive/invalid ranges;
- requirement that the broader boundary extend beyond magnitude;
- nearest-qualified-boundary ordering;
- integration into `magnitude.js`;
- target consumption/promotion;
- exhaustion after all qualified active structures are cleared.

Current focused result: **19/19 PASS locally.**

## Status

This is a conservative first production rule for structural qualification. It intentionally prefers `no target` over inventing a broader objective that the known range geometry does not support.
