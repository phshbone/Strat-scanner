# Level of Reclaim Management Spec v0.1

Date: 2026-08-19

## Purpose

Represent and manage verified Levels of Reclaim without inventing a universal per-pattern reclaim formula.

Current TheStrat.ai material confirms that:
- every actionable signal is described with trigger, magnitude, and Level of Reclaim;
- when time exhaustion rises, the level of defense can be tightened;
- after magnitude, the nearest valid Level of Reclaim can become the defensive reference;
- a completed signal cannot justify new size by itself unless another higher-timeframe signal is taking over.

The public indexed material still does not expose enough detail to derive one formula for every 2-2, 2-1-2, 3-1-2, hammer, shooter, or variation. Therefore reclaim derivation remains upstream and source-specific.

## Input contract

Each reclaim candidate must include:
- `price`
- `verified: true` before it may be used defensively

Optional provenance:
- `id`
- `timeframe`
- `source`

Unverified levels may be stored for audit/research, but they cannot drive management guidance.

## Nearest defensive reclaim

For an existing bullish position:
- eligible reclaim levels are verified levels below current price;
- nearest means the highest eligible reclaim below current price.

For an existing bearish position:
- eligible reclaim levels are verified levels above current price;
- nearest means the lowest eligible reclaim above current price.

This is a management selection rule only. It does not derive where reclaim comes from.

## Breach semantics

Bullish reclaim breach:
- current price <= verified reclaim level.

Bearish reclaim breach:
- current price >= verified reclaim level.

Equality counts as a breach of the defensive boundary.

## Guidance state

`NO_RECLAIM_GUIDANCE`
- no eligible verified reclaim exists.

`RECLAIM_AVAILABLE`
- a verified reclaim exists, but the current state does not require a tighten instruction.

`TIGHTEN_TO_NEAREST_RECLAIM`
- magnitude has been reached;
- no higher-timeframe carrier is active;
- a verified defensive reclaim exists.

`RECLAIM_BREACHED`
- reserved for evaluation when a selected verified defensive reclaim has been crossed.

## Higher-timeframe carrier safeguard

Magnitude completion on one timeframe does not force an exit or forced reclaim-tighten if another higher-timeframe signal remains an active carrier. The higher-timeframe context may take over management according to separately defined rules.

## Non-goals

This module does not:
- calculate a Level of Reclaim from candle geometry;
- equate reclaim with midpoint stop;
- equate reclaim with structure stop;
- invent a pivot as reclaim;
- decide position size;
- execute an order;
- predict reversal after reclaim or magnitude.

## Production path

`SOURCE-VERIFIED RECLAIM LEVELS -> NEAREST DEFENSIVE RECLAIM -> MANAGEMENT STATE -> GUIDANCE CARD / FUTURE RULE ENGINE`

Pattern-specific reclaim formulas can be added later without changing this management contract.
