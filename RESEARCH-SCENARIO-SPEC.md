# Research Scenario Comparison Spec v0.1

## Purpose
The historical research layer must measure not only whether a Strat setup occurred, but how that same setup performed under different context combinations without changing the underlying setup definition.

## Core principle
A setup remains a setup regardless of filters.

Context layers such as FTFC, Minervini, Elder, market/sector alignment, exhaustion, SSS50, price bucket, or stop model may be used for comparison/ranking, but they must not rewrite the base Strat rule.

## Event preservation
Every qualifying historical event is stored before ranking/filtering. Never discard an event merely because it falls outside a preferred scenario. This prevents survivorship/selection bias in scenario comparisons.

## Minimum event fields
- event id
- ticker
- timestamp
- setup
- direction
- setup timeframe
- trigger
- entry assumption
- stop model and stop price
- magnitude
- later targets if present
- FTFC state and timeframe group
- Minervini state
- Elder state
- market/index context
- sector context
- exhaustion state
- SSS50 state / entry mode if applicable
- price bucket
- path-resolution source
- magnitude hit?
- stop hit?
- which was hit first?
- exit price if a modeled exit exists
- realized R if a modeled exit exists
- MFE
- MAE
- time to magnitude
- scenario/version id

## Outcome definitions
Primary binary research outcome:
- WIN = magnitude reached before stop;
- LOSS = stop reached before magnitude;
- AMBIGUOUS = both magnitude and stop occur within data whose sequence cannot be resolved;
- OPEN/UNRESOLVED = neither outcome can yet be assigned.

Do not force ambiguous events into win/loss buckets.

## Metrics
At minimum calculate:
- sample count
- resolved sample count
- wins
- losses
- magnitude-before-stop win rate
- ambiguous count
- average realized R when an exit model exists
- later: median R, expectancy, MFE, MAE, time-to-magnitude, drawdown, target progression

## Scenario dimensions
The comparison engine should support grouping by any combination of fields, including:
- setup: 2-2 / 2-1-2 / 3-1-2 / later families
- direction: bullish / bearish
- timeframe
- FTFC: 4/4, 3/4, 2/4, mixed, custom groups
- Minervini pass/fail/components
- Elder aligned/neutral/opposed
- market alignment
- sector alignment
- exhaustion state
- SSS50 involvement and entry mode
- price bucket
- stop model
- remaining magnitude / R:R bucket

Examples:
- Strat alone
- Strat + FTFC
- Strat + FTFC + Minervini
- Strat + FTFC + Elder
- Strat + FTFC + Minervini + Elder
- same setup with and without exhaustion context
- same setup with Midpoint Stop vs Structure Stop

## Anti-overfitting rules
- define scenario families before inspecting final results;
- preserve all events;
- report sample size beside every percentage;
- do not rank tiny samples as evidence;
- separate exploratory data from validation/out-of-sample data;
- promising combinations must survive out-of-sample testing before being promoted;
- no profitability claim from synthetic fixtures or a handful of examples.

## Current implementation
`research-outcomes.js` provides deterministic primitives for:
- risk per share
- reward to magnitude
- planned R multiple
- outcome classification
- realized R
- aggregate win/loss summary
- grouping/comparison by arbitrary scenario fields

`tests/research-outcomes-validation.js` validates those primitives with synthetic fixtures.

## Status
Infrastructure only. No historical success rate is claimed until real historical events are connected and audited.
