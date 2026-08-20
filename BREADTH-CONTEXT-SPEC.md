# Breadth / Market Participation — v0.1

Date: 2026-08-20

## Purpose

Provide a deterministic market-participation layer for index, sector, or custom universes without converting breadth into a predictive win probability.

This layer is supporting evidence only. It must not mutate pure Strat setup validity.

## Core rule

`DEFINED UNIVERSE -> PER-SYMBOL OBSERVATION -> FULL-DENOMINATOR PARTICIPATION -> BULLISH / BEARISH / SIDEWAYS / UNRESOLVED -> CONTEXT`

The denominator is the full tracked universe for the snapshot. Scenario 1 / inside observations remain in the denominator as SIDEWAYS.

## Supported observation states

- `TWO_UP`
- `TWO_DOWN`
- `SIDEWAYS`
- `FAILED_DOWN_TO_OUTSIDE_UP`
- `FAILED_UP_TO_OUTSIDE_DOWN`
- `OUTSIDE_UNRESOLVED`
- `UNKNOWN`

The module deliberately does not infer path direction for a completed Scenario 3 from OHLC alone. A failed-2 -> outside event may be directional only when the caller has path evidence sufficient to label it.

## Participation buckets

Bullish participation:
- `TWO_UP`
- `FAILED_DOWN_TO_OUTSIDE_UP`

Bearish participation:
- `TWO_DOWN`
- `FAILED_UP_TO_OUTSIDE_DOWN`

Sideways participation:
- `SIDEWAYS`

Unresolved participation:
- `OUTSIDE_UNRESOLVED`
- `UNKNOWN`

All percentages use `totalTracked` as denominator.

## Context classification

v0.1 uses only a simple descriptive majority:

- `BULLISH_MAJORITY` when bullish participation is greater than 50% of the full universe;
- `BEARISH_MAJORITY` when bearish participation is greater than 50%;
- `MIXED` otherwise;
- `NO_DATA` for an empty universe.

This is not a probability score and does not claim continuation odds.

No 60%, 70%, 80%, or other "high probability" threshold is hard-coded in v0.1. Those may be studied later as research variables rather than assumed laws.

## Change tracking

`compareBreadthSnapshots(previous,current)` reports:

- bullish participation delta;
- bearish participation delta;
- directional-spread delta;
- whether the descriptive context changed.

This allows Trade Coach or scanner ranking to later distinguish strengthening, weakening, and mixed participation without claiming causality.

## Safeguards

- breadth is separate from setup validity;
- breadth is separate from historical setup evidence;
- breadth is separate from FTFC;
- unresolved outside bars remain explicit rather than being forced bullish or bearish;
- duplicate symbols resolve to the latest supplied observation so one symbol cannot inflate the denominator;
- no institutional/smart-money attribution is inferred from breadth alone.

## Intended integration

Future scanner/ranking path:

`STRAT SETUP + FTFC + INDEX BREADTH + SECTOR BREADTH + STRUCTURAL R:R + HISTORICAL EVIDENCE -> EXPLAINABLE RANKING / GUIDANCE`

Each component remains separately visible in the Why view.

## Validation

Focused harness:

- `tests/breadth-context-validation.js`

The harness covers state normalization, full-denominator handling, sideways inclusion, unresolved Scenario 3 preservation, failed-2 directional events, duplicate-symbol handling, majority/mixed context, spread math, and snapshot-to-snapshot change tracking.
