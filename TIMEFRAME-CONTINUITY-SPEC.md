# Timeframe Continuity — v0.1

Date: 2026-08-20

## Purpose

Provide a deterministic Full Time Frame Continuity (FTFC) context layer based on current price relative to the opening price of each selected timeframe.

This layer is separate from setup validity and separate from the existing timeframe-domino signal chain.

## Core rule

For each timeframe:

- current price > period open -> `BULLISH`
- current price < period open -> `BEARISH`
- current price == period open -> `FLAT`
- missing/non-numeric input -> `UNKNOWN`

The engine also records absolute and percentage distance from the period open as descriptive context only.

## Important separation

`TIMEFRAME CONTINUITY != ACTIVE STRAT SETUP`

A timeframe may be bullish relative to its open without containing an actionable bullish Strat setup. Likewise, an actionable setup may exist while continuity is mixed.

The existing `timeframe-domino.js` tracks active setup chains. `timeframe-continuity.js` tracks open-relative directional context. They must not silently replace one another.

## Summary states

- `FULL_BULLISH`
- `FULL_BEARISH`
- `BULLISH_MAJORITY`
- `BEARISH_MAJORITY`
- `MIXED`
- `NO_DATA`

The percentage of selected timeframes that are bullish/bearish is descriptive alignment, not a predictive trade probability.

## Change tracking

`compareContinuity(previous,current)` records:

- whether overall alignment changed;
- which individual timeframes flipped state;
- the prior and current alignment labels.

This supports the compact historical continuity visualization discussed for setup detail/Trade Coach, allowing the system to distinguish fresh alignment from deteriorating alignment without adding a large chart panel.

## Visual direction

Future UI can render:

`Y  Q  M  W  D  60  30  15  5`

as compact green/red/neutral continuity strips. Tight scanner rows may use dots or small state marks; setup detail can show short historical strips. Bar-height semantics remain intentionally undefined until a reliable source establishes what the referenced Strat visualizer's heights/numbers mean.

## Safeguards

- no previous-close substitution for period open;
- no invented strength formula;
- no inferred probability score;
- no use of FTFC to create an actionable setup;
- period opens must eventually come from validated period/session semantics;
- 60-minute continuity must obey the same provider-anchor safeguard already in force for 60-minute bars.

## Validation

Focused harness:

- `tests/timeframe-continuity-validation.js`

Coverage includes open-relative direction, flat/unknown states, normalized timeframe aliases, descriptive distance, full/mixed continuity, canonical ordering, and flip detection.
