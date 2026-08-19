# TheStrat.ai Documentation Audit v0.2

Date: 2026-08-19

## Purpose

Systematically cross-check the deterministic Trading System against the current TheStrat.ai education/help material. TheStrat.ai is treated as a high-value operational source from Sara Strat Sniper / Alex's Options and TheStrat LLC, while Rob Smith remains the canonical authority when a conflict exists.

Audit method:

`DOC / VISUAL -> OBSERVABLE RULE -> ENGINE COMPARISON -> CONFIRM / REFINE / MISSING / CONFLICT -> TEST BEFORE MERGE`

Animations and diagrams are useful evidence for sequence and geometry. If an embedded animation cannot be inspected reliably from the site, request only that specific screen recording from the user rather than asking for the whole library.

## Current source pass

### 1. Continuity + Signals + Broadening Formations — CONFIRMED / REFINES DOMINO

Current TheStrat.ai material explicitly separates:
- continuity = evidence;
- actionable signal = timing;
- broadening formation = map / magnitude.

It also shows lower-timeframe structures/signals timing entries into higher-timeframe broadening objectives. This supports the current thesis/execution separation and multi-timeframe domino architecture.

Important implementation safeguard remains:
- lower timeframe activity can precede or time a higher-timeframe move;
- the lower timeframe does not automatically place the higher timeframe in force;
- the higher timeframe becomes an active carrier only when its own observable condition is satisfied.

Status: current architecture confirmed.

### 2. Signal lifetime / time exhaustion — CONFIRMED, HIGH PRIORITY

Current docs state that an actionable signal is tied to the bar in which it exists and expires when that triggering bar closes. Time exhaustion therefore measures remaining bar time, not trend weakness.

Multiple active timeframes can carry the same directional thesis. If one signal expires but another valid higher-timeframe signal remains active, the trade can still have a carrier.

Implementation fields already planned / required:
- `signalStartsAt`
- `signalExpiresAt`
- `timeElapsedPct`
- `timeRemainingPct`
- `carrierTimeframes[]`
- signal lifecycle state: standby / active / expired / completed

Status: deterministic rule is sufficiently clear for implementation; do not invent arbitrary LOW/MEDIUM/HIGH thresholds unless separately specified or researched.

### 3. Price exhaustion / magnitude completion — CONFIRMED

The docs distinguish time exhaustion from price exhaustion. Hitting the signal's magnitude means the measured move for that signal has completed. That does not automatically predict reversal, but it changes management context and prevents the completed signal from justifying fresh size by itself.

Current architecture already exposes `priceExhaustionRisk` separately from time exhaustion.

Status: confirmed.

### 4. Three-price signal model — CONFIRMED, PARTIALLY MISSING

The current docs and Alex cheat-sheet image describe every actionable signal with three key prices:
1. trigger / signal;
2. target / magnitude;
3. level of reclaim.

The engine already stores trigger and magnitude.

`levelOfReclaim` must become a first-class field, but its exact per-pattern calculation must be taken from dedicated current documentation / visuals before hard-coding it. Do not equate it automatically with midpoint stop or structure stop.

Status: field required; formula still under audit.

### 5. 3-2 — MISSING SETUP, RULE VERIFIED

Current docs define 3-2 as an outside bar followed directly by a directional 2. It can be reversal or continuation depending on which side of the 3 is broken.

Critical rule:
- a 3-2 expands range and carries no magnitude of its own;
- it must borrow a valid higher-timeframe magnitude / objective;
- therefore a future 3-2 detector must never fabricate a setup-defined target.

Status: missing setup module; safe rule now documented.

### 6. Kicker — MISSING / LATER

Current docs define a kicker as a gap-plus-reversal pattern. Full-gap trigger is the kicker open; a documented partial-gap variation opens in the top/bottom portion of the setup bar and uses the setup-bar extreme as trigger.

Important guardrail:
- kicker is explicitly not a standalone entry;
- fast lower-timeframe reconfirmation supplies the actual entry/out mechanics;
- kicker itself does not create its own magnitude; prior-range pivots / broadening structure supply objectives.

Status: deterministic enough to plan, but not a NOW module until the core reversal/LoR lifecycle is hardened.

### 7. PMG — CONFIRMED AS TARGET-FUEL CONCEPT; TERMINOLOGY CONFLICT REMAINS

Current help material describes moves back through a previous range as running pivot after pivot, using Pivot Machine Gun language for the sequential fuel/levels.

The implemented staircase detector remains supported by Sara's directly published scanner geometry:
- higher lows -> bearish traversal candidate;
- lower highs -> bullish traversal candidate.

An older general setup-guide page labels `3-1-3` as "Pivot Machine Gun." Do not merge that older label with `PMG_STAIRCASE` until a dedicated current source resolves whether this is historical naming, shorthand, or a separate pattern label.

Status: preserve separate identifiers.

### 8. Timeframe support — CONFIRMED

TheStrat.ai scanner currently supports Daily, Weekly, Monthly, Quarterly, and Yearly scanning and cross-timeframe alignment. This independently supports Yearly and Quarterly as first-class timeframe classes in the engine.

Status: current timeframe-agnostic ladder confirmed.

## Architecture consequences from this pass

Production signal object should evolve toward:

```text
setupId
setupFamily
direction
timeframe
trigger
magnitude
magnitudeSource
borrowedMagnitudeTimeframe
levelOfReclaim
signalStartsAt
signalExpiresAt
inForce
completed
expired
timeElapsedPct
timeRemainingPct
priceExhaustionRisk
carrierTimeframes[]
```

Not every setup supplies every field itself. Expansion setups such as 3-2 may have `magnitude = null` at the setup layer and use an explicitly borrowed higher-timeframe objective.

## Audit priority from here

1. dedicated Actionable Signals material;
2. Levels of Reclaim / stop-loss material;
3. 2-2 reversal visuals and exact signal/reclaim geometry;
4. 2-1-2 reversal/continuation distinctions;
5. 3-1-2;
6. PMG dedicated material;
7. broadening / price discovery;
8. hammers and shooters;
9. take-action window;
10. remaining expansion/gap setups.

For each visual page, inspect embedded diagrams/animation when accessible. Request a user-provided screen recording only if sequence cannot be recovered reliably from the page.

## Do-not-assume list

- Do not infer a universal PMG spacing threshold.
- Do not alias `3-1-3` to the staircase PMG detector yet.
- Do not treat price exhaustion as an automatic reversal.
- Do not treat time exhaustion as momentum weakness.
- Do not treat a lower timeframe as causally activating a higher timeframe.
- Do not assign 3-2 its own magnitude.
- Do not invent `levelOfReclaim` formulas before source validation.
- Do not make Q/Y mandatory alignment filters.

## Status

The current deterministic architecture remains broadly consistent with the audited current TheStrat.ai material. The largest unresolved foundational item is exact per-signal `levelOfReclaim` geometry. The next code-changing audit step should wait until that rule is verified from the dedicated help material/visuals, while signal-lifetime metadata can be implemented independently because its semantics are already explicit.
