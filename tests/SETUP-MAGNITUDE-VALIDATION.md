# Setup-Specific First Magnitude Validation v0.1

## Purpose
Separate the setup-defined first objective from the generic pivot/target stack.

The generic magnitude engine can order already-valid pivots, but the first objective for a Strat setup should come from the active setup/range geometry before later targets are considered.

## Source basis
From Rob Smith and Alex material supplied in project research:
- a reversal back through a prior range uses the opposite side of that active range as the first expected objective;
- for a bullish setup the first magnitude is the relevant source-range high;
- for a bearish setup the first magnitude is the relevant source-range low;
- 2-2, 2-1-2, and 3-1-2 all follow this range-side principle in the sourced examples;
- further pivots beyond that first objective are targets, not the first magnitude.

## Deterministic rule now isolated
`setup-magnitude.js` accepts:
- setup name,
- direction,
- source bar/range,
- trigger (optional objective metadata),

and returns the first magnitude only for the currently validated setup families:
- `2-2`
- `2-1-2`
- `3-1-2`

Bullish -> source high.
Bearish -> source low.

Unsupported setup families or unresolved directions return `null` rather than inventing an objective.

## Validation
`tests/setup-magnitude-validation-v0.1.js` covers both directions for all three setup families plus unsupported/missing/unknown inputs and objective metadata preservation.

Local execution result on 2026-08-19: **10 pass / 0 fail**.

## Important limit
This validates setup geometry, not historical expectancy.

The next layer is real-market fixture validation: use actual historical OHLC examples of 2-2, 2-1-2, and 3-1-2 and confirm that the source bar/range selected by the scanner matches the setup that a human Strat review identifies.
