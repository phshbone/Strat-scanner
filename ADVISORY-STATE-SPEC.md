# Advisory State — v0.1

Date: 2026-08-20

## Purpose

Make `WAIT_NO_ACTIONABLE_SETUP` a first-class deterministic advisory outcome without changing Strat setup validity.

This layer answers a narrow question:

`IS THERE A REAL SETUP TO ACT ON, OR SHOULD THE USER WAIT?`

## States

- `WAIT_NO_ACTIONABLE_SETUP`
- `WATCH_ACTIONABLE_SETUP`
- `ACTIVE_TRADE_CONTEXT`

## Rules

### WAIT_NO_ACTIONABLE_SETUP

Returned when no non-expired, non-invalidated actionable signal is present and no practice trade is armed/open.

Supporting context such as bullish breadth or an active higher-timeframe carrier cannot create a setup by itself.

### WATCH_ACTIONABLE_SETUP

Returned when at least one deterministic signal is actionable / armed / triggered / in force / active.

The advisory layer does not create, alter, or score that signal. It only reports that a real setup exists for evaluation.

### ACTIVE_TRADE_CONTEXT

Returned when Practice Mode already has an `ARMED` or `OPEN` trade. This takes precedence over searching for a fresh setup because management of the existing context is the current task.

## Guardrails

- no AI-generated trade authority;
- no breadth-generated entry;
- no FTFC/carrier-generated entry;
- no predictive probability;
- no automatic broker action;
- expired and invalidated signals do not count as actionable;
- a lack of setup is an explicit valid state, not an error or empty UI condition.

## Intended flow

`DETERMINISTIC SIGNALS + OPTIONAL SUPPORTING CONTEXT + PRACTICE STATE -> ADVISORY STATE`

Later UI can surface the state as a compact guidance card and explain the Why without inventing a trade.

## Validation

Focused harness:

- `tests/advisory-state-validation.js`

Coverage includes waiting with no setup, actionable signal detection, expired/invalidated filtering, Practice Mode precedence, and the rule that breadth/carrier context may support but never manufacture a setup.
