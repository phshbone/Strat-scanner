# TheStrat.ai Documentation Audit v0.1

Date: 2026-08-19

## Purpose

Use TheStrat.ai's free education/help material as an operational cross-check against the deterministic rules already implemented from Rob Smith, Sara Strat Sniper, and Alex's Options.

Authority remains:
1. Rob Smith canonical observable rules;
2. Sara/Alex operational refinements and implementations;
3. third-party summaries only as secondary corroboration.

TheStrat.ai is especially useful because it is published by TheStrat LLC and presented as current education material from Alex/Sara while explicitly crediting Rob Smith as creator of TheStrat.

## Confirmations that match the current engine

### Continuity + signal + broadening formation
TheStrat.ai describes the combined method as:
- continuity = evidence;
- actionable signal = timing;
- broadening formation = map/magnitude.

This strongly supports the current architecture separating FTFC/context, setup trigger, and magnitude/target structure instead of collapsing them into one score.

### Lower timeframe timing into higher timeframe objectives
The docs explicitly show lower-timeframe broadening/signals being used to time movement into higher-timeframe broadening targets. This supports the timeframe-domino architecture, with an important safeguard: a lower timeframe can time or precede a higher-timeframe move but does not magically place the higher-timeframe trigger in force.

### Magnitude completion
TheStrat.ai states that when a signal reaches its magnitude, that signal has completed what it measured on that timeframe. Continued participation requires either a fresh signal or a higher-timeframe signal taking over. This matches the current objective-completion model and reinforces the separate thesis/execution timeframe design.

### Three-price signal model
The docs describe each signal with three prices:
- signal / trigger;
- target / magnitude;
- level of reclaim.

Our engine already models trigger and magnitude. `levelOfReclaim` should be added as an explicit future field rather than inferred later from a generic stop.

## Important terminology correction discovered

### Exhaustion must be split into two different concepts
The current code often uses the generic field `exhaustionRisk` to mean price/structure exhaustion after magnitude and targets are cleared.

TheStrat.ai uses a more precise distinction:

1. **Exhaustion by time** — how much time remains before the actionable signal's bar closes/expires.
2. **Exhaustion by price** — reaching fresh extremes or completing magnitude / a broadening range, where the measured range is spent and continuation needs fresh evidence.

Required implementation correction:
- keep deterministic elapsed/remaining time logic as `timeExhaustionRisk` / time-exhaustion state;
- rename the magnitude/target-cleared condition to `priceExhaustionRisk`;
- temporarily preserve `exhaustionRisk` only as a backward-compatibility alias while dependent modules/tests are migrated.

Exhaustion of either type is context/risk information, not an automatic reversal signal.

## Expansion setups / magnitude safeguard

TheStrat.ai's current 3-2 documentation states that a 3-2 is range expansion and carries no magnitude of its own. A 3-2 must use a higher-timeframe magnitude/context rather than inventing a target from the pattern itself.

This supports the existing conservative setup-magnitude selector, which does not currently assign a first magnitude to unsupported setup families. When 3-2 is added later, `setupMagnitude = null` unless a separately validated higher-timeframe objective is supplied.

## PMG audit status

The currently implemented PMG staircase detector is based on Sara's published TrendSpider monthly PMG-short implementation and common Strat usage of sequential higher lows / lower highs as pivot-machine-gun fuel.

TheStrat.ai current help material also uses "pivot machine gun" to describe running pivot-after-pivot back through a previous range. However, one older/general setup-guide page labels `3-1-3` as "Pivot Machine Gun." That page should not overwrite Sara's directly published scanner geometry without dedicated confirmation.

For now preserve two separate concepts:
- `PMG_STAIRCASE` = sequential higher lows / lower highs used as a pivot target structure;
- `3-1-3` = a distinct setup/pattern identifier if/when implemented.

Do not alias 3-1-3 to the staircase PMG detector until a dedicated current source resolves the terminology.

## New actionable research fields

Add/plan:
- `levelOfReclaim`
- `timeExhaustionRisk`
- `timeRemainingPct`
- `priceExhaustionRisk`
- `signalExpiresAt`
- `carrierTimeframes[]` (timeframes whose signals remain in force)
- `borrowedMagnitudeTimeframe` for expansion setups such as 3-2

## Build implications

Immediate priority before broader domino integration:
1. split exhaustion naming/semantics so time and price exhaustion cannot be confused;
2. preserve backward compatibility while modules migrate;
3. add `levelOfReclaim` as a first-class signal field in the next core setup-object revision;
4. keep 3-2 magnitude null unless higher-timeframe magnitude is explicitly supplied;
5. keep PMG staircase and 3-1-3 terminology separate pending dedicated source confirmation.

## Status

This audit confirms the overall architecture but exposes one foundational terminology issue: generic `exhaustionRisk` is too ambiguous. The current objective/magnitude logic remains useful, but its exhaustion flag should be renamed to price exhaustion before additional trade-management layers are built on top of it.
