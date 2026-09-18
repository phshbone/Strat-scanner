# Historical Evidence Layer — v0.1

## Purpose

Answer a narrow descriptive question without turning historical data into a prediction:

> When this same deterministic Strat setup occurred under explicitly comparable conditions, what happened afterward?

Historical evidence is Layer 2. It sits below optional AI interpretation and above nothing in the deterministic rule hierarchy. It cannot create a setup, invalidate a setup by itself, or manufacture a probability score.

## Cohort rules

The comparison engine first requires the same:

- setup identity;
- direction;
- timeframe;
- market type when known.

If current bar-construction semantics are known, historical events must also match the known construction profile:

- market timezone;
- session;
- extended-hours policy;
- bar anchor;
- anchor offset;
- provider aggregation.

The historical period identity itself is retained for audit but is not required to equal the current event's period identity. Requiring the same period id would make longitudinal comparison impossible.

## Exact context vs baseline

Two cohorts are always kept separate.

### EXACT_CONTEXT

Uses the core setup/semantic rules above plus every context field that is known in the query, including when available:

- FTFC alignment;
- market alignment;
- sector alignment;
- Elder state;
- Minervini state;
- exhaustion state;
- SSS50 state;
- price bucket;
- stop model.

### SETUP_BASELINE

Uses the same setup, direction, timeframe and compatible construction semantics, but does not apply the optional context filters.

The baseline is shown only as broader reference evidence. The system must not silently substitute the baseline for a weak exact-context cohort.

## Outcome definition

The initial success definition is deterministic and explicit:

**MAGNITUDE_BEFORE_STOP**

Existing research outcome rules remain authoritative:

- WIN = magnitude reached before stop;
- LOSS = stop reached before magnitude;
- AMBIGUOUS = both occurred in data that cannot establish sequence;
- OPEN / UNRESOLVED = no resolved terminal outcome.

Ambiguous and unresolved events are not forced into the win-rate denominator.

## Minimum sample gate

Default minimum: **20 resolved events** in the exact cohort.

Possible states:

- `AVAILABLE` — exact cohort meets the resolved-sample minimum;
- `INSUFFICIENT_SAMPLE` — comparable events exist but resolved sample is below the minimum;
- `NOT_AVAILABLE` — no exact comparable events.

When evidence is insufficient, Trade Coach remains rule-based. A percentage from a tiny cohort must not be promoted as decision guidance.

## Output

The evidence object reports at minimum:

- total sample size;
- resolved sample size;
- wins and losses;
- magnitude-before-stop success rate;
- ambiguous/open/unresolved counts;
- average realized R when modeled exits exist;
- exact comparison conditions;
- broader setup baseline;
- semantic exclusions;
- sample threshold;
- source and non-forecast safeguard.

## Implementation

- `historical-evidence.js` — cohort matching, semantic comparability and evidence summaries.
- `research-outcomes.js` — authoritative outcome classification and aggregate primitives.
- `tests/historical-evidence-validation.js` — deterministic fixtures for exact matching, semantic exclusions, insufficient-sample behavior and baseline separation.

## Current status

This phase establishes the evidence engine and sample-size gate. It does not yet claim real-world success rates. The next phase is to generate audited historical event records from normalized provider bars and then connect the resulting evidence object to live scanner/chart context.
