# Multi-Timeframe Objective Pipeline v0.1

## Purpose
This document defines the integrated deterministic path from a setup-defined first magnitude through broader multi-timeframe target qualification, target hierarchy, and exhaustion.

The engine must support both swing-style stacks such as `M/W/D/60` and intraday/day-trading stacks such as `D/60/30/15` without changing the underlying rules.

## Pipeline

`SETUP -> FIRST MAGNITUDE -> STRUCTURAL RANGE QUALIFICATION -> TARGET HIERARCHY / EXACT DE-DUP -> OBJECTIVE STATE -> EXHAUSTION`

Implemented by `objective-pipeline.js` using:
- `target-qualification.js`
- `target-hierarchy.js`
- `magnitude.js`

## Timeframe neutrality
No timeframe is automatically preferred because it is larger.

A Daily, Weekly, Monthly, 60-minute, 30-minute, or 15-minute structure contributes only when:
1. it is structurally valid and active;
2. it contains the setup range;
3. its initiating side has been taken in the required direction;
4. its opposite boundary lies beyond setup-defined magnitude.

After qualification, price-path order determines which objective comes first.

## Swing-stack example
A bullish setup with first magnitude at 105 may sit inside:
- Daily range target 110, engaged;
- Weekly range target 115, engaged;
- Monthly range target 120, not yet engaged.

State progression:
- before 105: next objective = magnitude 105;
- after 105: Daily 110;
- after 110: Weekly 115;
- after 115: exhaustion for the currently known active structure;
- Monthly 120 is not silently promoted until the Monthly range independently qualifies.

## Intraday-stack example
A bearish setup with first magnitude at 99 may sit inside:
- 30m boundary 98, engaged;
- 60m boundary 98, engaged;
- Daily boundary 95, engaged;
- Weekly boundary 90, not engaged.

The 30m and 60m structures agree on the exact 98 level, so they produce one objective with both timeframe sources retained.

State progression:
- before 99: magnitude 99;
- after 99: shared 30m/60m target 98;
- after 98: Daily 95;
- after 95: exhaustion for the currently known active structure;
- Weekly 90 remains excluded until structurally engaged.

## Important constraints
- A higher timeframe does not leapfrog a nearer lower-timeframe objective.
- Exact duplicate target prices may merge while preserving provenance.
- Nearby but unequal targets remain separate unless an explicit advisory display tolerance is supplied.
- An unengaged larger range is not a target merely because its opposite boundary exists.
- Exhaustion means the currently qualified structure has been cleared; it is not an automatic reversal.
- The same pipeline is used for swing and intraday timeframe groups.

## Validation
`tests/objective-pipeline-validation.js` covers:
- swing-style multi-timeframe target progression;
- exclusion of an unengaged Monthly range;
- exact Daily/Weekly level agreement;
- intraday 30m/60m duplicate-level handling;
- Daily extension after intraday targets;
- exclusion of an unengaged Weekly range;
- bullish and bearish symmetry across the integrated pipeline;
- exhaustion only after all currently qualified structures are cleared.

Focused result: **20/20 PASS locally**.

## Next step
The next layer is multi-timeframe domino state: a lower-timeframe reversal or trigger that changes the actionable state of a higher-timeframe setup. That logic must keep `thesisTimeframe`, `executionTimeframe`, and `managementTimeframe` separate rather than assuming holding period from the entry timeframe.
