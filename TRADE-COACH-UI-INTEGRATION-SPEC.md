# Trade Coach UI Integration — v0.1

Date: 2026-08-20

## Purpose

Define the browser-facing boundary between deterministic Trade Coach guidance and the visible scanner UI.

The UI must render guidance; it must not invent guidance.

## Flow

`SETUP CONTEXT / PRACTICE STATE / CARRIER / EXHAUSTION -> trade-coach.js -> GUIDANCE EVENT -> trade-coach-ui.js -> COMPACT UI MESSAGE + WHY`

## Browser exposure

`trade-coach.js` exposes `globalThis.StratTradeCoach` in browser environments while retaining CommonJS exports for Node validation.

`trade-coach-ui.js` exposes `globalThis.StratTradeCoachUI` and converts a guidance event into a presentation-only view model.

## Presentation contract

A visible guidance model contains:

- `code`
- `severity`
- `title`
- `message`
- compact `why` evidence
- optional observation timestamp

If `guidance.emit !== true`, the view model is hidden and no new Trade Coach message should be surfaced.

This preserves the core rule:

`NO MEANINGFUL STATE CHANGE -> NO NEW GUIDANCE`

## Safeguards

- the UI adapter cannot grant broker authority;
- the UI adapter cannot grant AI authority;
- the UI adapter does not score confidence;
- the UI adapter does not decide setup validity;
- the UI adapter does not recalculate FTFC, breadth, R:R, targets, or historical statistics;
- Why evidence is passed through from the shared setup-context object.

## Next visible-app connection

The Research Console should load:

1. `trade-coach.js`
2. `trade-coach-ui.js`

and maintain the prior/current context snapshots needed by `deriveTradeCoachGuidance()`.

The visible panel should show only the most recent emitted decision-relevant message, with a `Why?` expansion. Re-rendering an unchanged state must not create another message.

## Validation

Focused harness:

- `tests/trade-coach-ui-validation.js`

The harness verifies severity mapping, hidden no-change messages, Why evidence preservation, and the inability of presentation data to grant broker or AI authority.
