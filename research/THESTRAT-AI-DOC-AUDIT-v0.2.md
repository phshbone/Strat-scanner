# TheStrat.ai Documentation Audit v0.3

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

### 2. Signal lifetime / time exhaustion — CONFIRMED, IMPLEMENTED

Current docs state that an actionable signal is tied to the bar in which it exists and expires when that triggering bar closes. Time exhaustion therefore measures remaining bar time, not trend weakness.

Multiple active timeframes can carry the same directional thesis. If one signal expires but another valid higher-timeframe signal remains active, the trade can still have a carrier.

Implemented in `signal-lifecycle.js`:
- `signalStartsAt`
- `signalExpiresAt`
- `timeElapsedPct`
- `timeRemainingPct`
- standby / active / expired / completed state
- `carrierTimeframes[]` helper

Status: implemented without arbitrary LOW/MEDIUM/HIGH thresholds.

### 3. Price exhaustion / magnitude completion — CONFIRMED

The docs distinguish time exhaustion from price exhaustion. Hitting the signal's magnitude means the measured move for that signal has completed. That does not automatically predict reversal, but it changes management context and prevents the completed signal from justifying fresh size by itself.

Current architecture already exposes `priceExhaustionRisk` separately from time exhaustion.

Status: confirmed.

### 4. Three-price signal model — CONFIRMED, SCHEMA NOW EXPLICIT

The current docs and Alex cheat-sheet image describe every actionable signal with three key prices:
1. trigger / signal;
2. target / magnitude;
3. level of reclaim.

The engine already stores trigger and magnitude.

New `signal-schema.js` makes `levelOfReclaim` a first-class field while deliberately leaving it `null` when the exact pattern geometry has not yet been source-verified. It must not be silently replaced with midpoint stop or structure stop.

The schema also records:
- whether reclaim is known;
- whether reclaim is source-verified;
- reclaim provenance;
- setup vs borrowed magnitude provenance.

Status: schema complete; exact per-pattern reclaim formulas remain under audit.

### 5. 3-2 — RULE VERIFIED; EXPANSION SAFEGUARD LOCKED

Current docs define 3-2 as an outside bar followed directly by a directional 2. It can be reversal or continuation depending on which side of the 3 is broken.

Critical rule:
- a 3-2 expands range and carries no magnitude of its own;
- it must borrow a valid higher-timeframe magnitude / objective;
- therefore a future 3-2 detector must never fabricate a setup-defined target.

`signal-schema.js` now supports `magnitude = null` plus explicit `borrowedMagnitude` / `borrowedMagnitudeTimeframe`.

Status: detector still missing; target semantics are now safely represented.

### 6. Kicker — MISSING / LATER

Current docs define a kicker as a gap-plus-reversal pattern. Full-gap trigger is the kicker open; a documented partial-gap variation opens in the top/bottom 10–20% of the setup bar and uses the setup-bar extreme as trigger.

Important guardrail:
- kicker is explicitly not a standalone entry;
- fast 1/3/5-minute reconfirmation supplies the actual entry/out mechanics;
- kicker itself does not create its own magnitude;
- prior-range pivots / broadening structure supply objectives.

Status: deterministic enough to plan, but not a NOW module until core reversal/LoR lifecycle is hardened.

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

### 9. Broadening / PMG fuel refinement — CONFIRMED

Current exhaustion material states a useful structural preference: reversals moving back through a previous range have existing pivots/stops available as fuel, whereas fresh highs/lows have fewer prior levels to run through. This supports keeping PMG and broader target-stack context as evidence/structure, not as an automatic prediction.

It also reinforces the current rule that after magnitude completes, continuation requires a fresh signal or another active higher-timeframe carrier; the completed lower-timeframe signal cannot justify new size by itself.

Status: architecture confirmed.

## Architecture consequences from this pass

Production signal object now has an explicit normalized representation:

```text
setupId
setupFamily
direction
timeframe
trigger
magnitude
magnitudeSource
borrowedMagnitude
borrowedMagnitudeTimeframe
levelOfReclaim
reclaimSource
reclaimVerified
signalStartsAt
signalExpiresAt
reference
currentType
pathResolved
metadata
```

Lifecycle state remains calculated separately so raw setup identity is not mutated by clock/current-price state.

## Audit priority from here

1. dedicated Levels of Reclaim / stop-loss material;
2. 2-2 reversal visuals and exact signal/reclaim geometry;
3. 2-1-2 reversal/continuation distinctions;
4. 3-1-2;
5. PMG dedicated material;
6. broadening / price discovery;
7. hammers and shooters;
8. take-action window;
9. remaining expansion/gap setups.

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

The deterministic architecture remains broadly consistent with current TheStrat.ai documentation. The key unresolved foundational item is still exact per-signal `levelOfReclaim` geometry. The schema now supports that information safely without inventing it, so the next source pass can add verified formulas pattern-by-pattern without changing the object model again.
