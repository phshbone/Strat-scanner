# Trade Coach — v0.1

Date: 2026-08-20

## Purpose

Provide explainable in-trade and setup guidance only when a meaningful deterministic state changes.

Trade Coach is not the source of truth. It consumes the same setup context already used by scanner cards and Practice Mode.

## Input path

`SETUP CONTEXT + PRACTICE TRADE + CARRIER INTERPRETATION + EXHAUSTION -> MEANINGFUL-CHANGE FILTER -> GUIDANCE EVENT`

## Core rule

If the relevant state fingerprint has not changed, emit nothing.

The fingerprint currently includes:

- advisory state;
- Practice Mode trade state;
- R:R gate status;
- FTFC status/value;
- index breadth status/value;
- sector breadth status/value;
- carrier interpretation state;
- price-exhaustion state;
- time-exhaustion state.

This prevents repetitive coaching on every price tick or bar when nothing decision-relevant changed.

## Initial deterministic guidance events

Supported v0.1 events include:

- `PRACTICE_ENTRY_TRIGGERED`
- `PRACTICE_TARGET_REACHED`
- `PRACTICE_STOP_REACHED`
- `TRADE_AMBIGUOUS`
- `OPPOSING_REVERSAL_IN_FORCE`
- `HIGHER_TIMEFRAME_CHANGED`
- `CARRIER_CAUTION`
- `FTFC_OPPOSED`
- `FTFC_ALIGNED`
- `INDEX_BREADTH_OPPOSED`
- `INDEX_BREADTH_ALIGNED`
- `RISK_REWARD_BELOW_GATE`
- `WAIT_NO_ACTIONABLE_SETUP`
- `WATCH_ACTIONABLE_SETUP`

## Guardrails

- FTFC deterioration is supporting evidence, not automatic setup invalidation.
- Breadth deterioration is supporting evidence, not automatic setup invalidation.
- A lower-timeframe reversal against a carrier does not silently invalidate the higher-timeframe carrier.
- Ambiguous coarse-bar execution remains ambiguous rather than being forced into win/loss.
- Trade Coach cannot place orders.
- Trade Coach has no broker authority.
- AI is not required for v0.1 guidance and has no decision authority.
- `Why?` evidence is preserved from the shared setup-context layer.

## Event priority

Terminal Practice Mode events take priority over context changes:

1. ambiguous path;
2. stop reached;
3. target reached;
4. entry triggered;
5. carrier reversal/change/caution;
6. FTFC changes;
7. breadth changes;
8. R:R gate change;
9. advisory WAIT/WATCH transitions.

This prevents a lower-priority supporting change from hiding a more important execution event.

## Intended UI

The UI should show only the latest meaningful guidance event plus an expandable `Why?` view.

Examples:

`Timeframe continuity deteriorated — FTFC is now opposed to the setup direction. This is supporting evidence, not standalone invalidation.`

`Practice target reached — record the result and evaluate any separately defined runner or next-objective rule.`

No continuous stream of repetitive commentary should be shown.

## Validation

Focused harness:

- `tests/trade-coach-validation.js`

The harness verifies state-change suppression, trade lifecycle transitions, ambiguity preservation, carrier deterioration, FTFC/breadth changes, R:R gate changes, WAIT/WATCH transitions, Why evidence preservation, and broker/AI authority safeguards.
