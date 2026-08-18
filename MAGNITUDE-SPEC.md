# Magnitude / Pivot Target Spec v0.1

## Purpose
Magnitude is modeled as a directional stack of pre-identified pivot targets. The magnitude engine does not decide what counts as a valid Strat pivot; pivot identification remains a separate rule-validation task.

## Deterministic target behavior
Given:
- an origin/entry reference price,
- direction (`BULLISH` or `BEARISH`),
- a list of validated pivot prices,

build a directional target stack:
- bullish: pivots strictly above origin, nearest first;
- bearish: pivots strictly below origin, nearest first.

As price reaches a target, mark it consumed and promote the next remaining pivot.

When no directional targets remain, mark `exhaustionRisk = true`.

## Important constraint
`exhaustionRisk = true` is not a reversal signal. A new opposing actionable Strat setup is still required before a directional flip is considered.

## Multi-timeframe behavior
Pivots may carry timeframe metadata (for example 15m, 60m, D, W, M). The engine may promote from a lower-timeframe pivot to a higher-timeframe pivot as nearer targets are consumed, but it must preserve each pivot's source timeframe and identity.

## What is NOT yet locked
This spec intentionally does not define automatic pivot discovery. We still need source-backed real-chart validation for:
- which highs/lows qualify as actionable pivots,
- when a pivot should be ignored or considered already consumed,
- how broadening formations alter target hierarchy,
- PMG behavior across closely spaced pivots,
- whether specific setup families choose a special first target before the general pivot stack.

Until that validation is complete, the magnitude engine accepts pivots as validated inputs rather than inventing them.

## Research fields
Store at minimum:
- pivot id
- pivot price
- pivot timeframe
- pivot timestamp if known
- direction
- origin price
- consumed state
- consumption timestamp if known
- target order
- next target
- remaining target count
- exhaustion risk

## Status
Deterministic target-stack mechanics validated synthetically. Automatic pivot identification remains under real-market validation.
