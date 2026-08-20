# Practice Mode Setup Context Integration — v0.1

Date: 2026-08-20

## Purpose

Wire the explainable setup-context layer into Practice Mode without changing pure Strat setup validity or allowing supporting evidence to manufacture a trade.

## Integration path

`DETERMINISTIC STRAT SETUP -> NORMALIZED SIGNAL -> EXPLICIT STOP/TARGET RULE -> SETUP CONTEXT -> ARMED PRACTICE TRADE`

`SETUP CONTEXT = FTFC + INDEX BREADTH + SECTOR BREADTH + STRUCTURAL R:R + HISTORICAL EVIDENCE + WHY`

## Implementation

`practice-setup-adapter.js` now calls `buildSetupContext()` after it has a valid deterministic signal plus explicit practice stop and target geometry.

The resulting context object is stored at:

`practiceTrade.context.setupContext`

The caller may supply supporting evidence through `setupContextOptions`:

- `carrier`
- `ftfc`
- `indexBreadth`
- `sectorBreadth`
- `minRewardRisk`
- `historicalEvidence`

All fields are optional. Missing evidence remains unknown rather than blocking setup creation or being fabricated.

## Safeguards

- setup context is created only after a deterministic directional signal exists;
- FTFC cannot create a setup;
- breadth cannot create a setup;
- historical evidence is descriptive and cannot become a live forecast probability;
- no opaque combined confidence score is emitted;
- stop source remains mandatory and explicit;
- target remains structural/validated or explicitly supplied for a named practice experiment;
- Practice Mode remains paper-only with no broker authority.

## UI consequence

Scanner cards, Practice Mode, and the future Trade Coach can now read the same `setupContext` object instead of duplicating evidence logic.

The compact surface can show only the highest-value fields while the `Why?` view expands the complete evidence array.

## Validation

`tests/practice-setup-adapter-validation.js` now verifies:

- setup context is attached to an armed practice trade;
- direction is preserved;
- FTFC alignment is retained;
- index and sector breadth remain separate;
- historical evidence availability is explicit;
- opaque probability remains disabled;
- missing supporting evidence stays unknown;
- original practice-only and no-broker-authority safeguards remain intact.
