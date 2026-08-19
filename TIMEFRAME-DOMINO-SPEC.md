# Timeframe Domino / Thesis-Execution Spec v0.1

## Purpose
Provide one deterministic multi-timeframe state model that works from yearly/quarterly long-term structures down through intraday execution timeframes without redefining Strat rules by trading style.

## Supported ladder
Default ordered ladder:

`Y -> Q -> M -> W -> D -> 60 -> 30 -> 15 -> 5`

The ladder is configurable. Yearly and Quarterly are supported timeframe classes, not mandatory filters.

## Core principle
A timeframe is only considered active/in force when its own setup trigger is actually in force.

Bullish: `currentPrice > trigger`

Bearish: `currentPrice < trigger`

Equality is not in force.

A lower timeframe becoming actionable does not automatically make a higher timeframe actionable. If price later crosses the higher-timeframe trigger in the same direction, that higher timeframe can be recorded as an advancement of the same directional thesis.

This is an observable state chain, not a claim that one timeframe literally causes another.

## Separate roles
Store separately:
- `thesisTimeframe` — timeframe defining the primary trade idea/context;
- `executionTimeframe` — timeframe used for entry timing;
- management timeframes may be added later without changing thesis identity;
- actual holding duration is an outcome field, not a timeframe definition.

This permits, for example:
- long-term thesis: Q or M, execution on W/D;
- swing thesis: W/D, execution on D/60/30;
- intraday thesis/context: D/60, execution on 30/15/5.

## Default profiles
Profiles are convenience bundles only. They do not alter rules.

- `LONG_TERM`: Y/Q/M/W/D
- `SWING`: M/W/D/60
- `SWING_WITH_ENTRY`: M/W/D/60/30/15
- `INTRADAY`: D/60/30/15/5

Users may supply custom timeframe sets.

## Domino chain semantics
For each selected timeframe, record at minimum:
- timeframe;
- direction;
- trigger;
- current price;
- in-force state;
- setup id/name when available;
- path-resolution provenance when needed for completed Scenario 3.

Active states are grouped by direction and ordered from lower timeframe toward higher timeframe for domino progression display.

Example:

`15 BULLISH in force -> 30 BULLISH in force -> 60 not yet in force -> D not yet in force`

This means lower-timeframe participation exists, but the 60/D thesis has not yet advanced.

Later:

`15 -> 30 -> 60 -> D`

if price subsequently puts 60 and D triggers in force.

## Mixed direction
Higher and lower timeframes may disagree. The engine preserves both chains rather than forcing alignment.

A mixed state is context/risk information, not an invalidation of every lower-timeframe setup.

## Long-term scope
Yearly and Quarterly are included so the same system can study longer-duration positions and determine whether a swing setup is participating in a larger structure.

Examples for research:
- D/W/M aligned;
- D/W/M/Q aligned;
- D/W/M/Q/Y aligned;
- Q/M/W thesis with D execution;
- Y/Q/M thesis with W/D execution.

These combinations must be empirically compared later rather than assumed superior.

## Safeguards
- no timeframe becomes active merely because an adjacent timeframe is active;
- timeframe size does not override trigger/in-force rules;
- Yearly/Quarterly are available context, never mandatory filters by default;
- thesis timeframe and execution timeframe remain separate fields;
- holding period does not redefine the original setup;
- adaptive automated management belongs to a later execution/management layer, not this deterministic state engine.

## Validation
`tests/timeframe-domino-validation.js` covers:
- timeframe aliases and ordering;
- strict in-force semantics;
- long-term Y/Q/M/W/D profile;
- swing/intraday compatibility;
- preservation of thesis vs execution timeframe;
- lower-timeframe activation without falsely activating higher timeframes;
- mixed directional state preservation.

## Next work
1. integrate domino state with actual detected setup objects from the core engine;
2. add explicit timeframe/session/aggregation metadata;
3. validate historical lower-to-higher timeframe advancement on real charts;
4. later feed domino state into research outcome grouping and Trade Coach state-change logic.
