# Trade Coach UI Integration — v0.2

Date: 2026-08-20

## Purpose

Define the browser-facing boundary between deterministic Trade Coach guidance and the visible scanner UI.

The UI must render guidance; it must not invent guidance.

## Flow

`SETUP CONTEXT / PRACTICE STATE / CARRIER / EXHAUSTION -> trade-coach.js -> GUIDANCE EVENT -> trade-coach-ui.js -> COMPACT UI MESSAGE + WHY`

## Browser exposure

`trade-coach.js` exposes `globalThis.StratTradeCoach` in browser environments while retaining CommonJS exports for Node validation.

`trade-coach-ui.js` exposes `globalThis.StratTradeCoachUI` and converts a guidance event into a presentation-only view model.

`research-console-wiring.js` now supplies the visible Research Console connection. It:

- loads the Trade Coach engine and presentation adapter in the browser;
- adds one compact Trade Coach panel to the Monitor view;
- derives the monitor's current deterministic setup context from the existing engine state;
- maintains prior/current snapshots;
- calls `deriveTradeCoachGuidance()` only against those snapshots;
- preserves the most recent emitted message when later renders contain no new meaningful state change;
- exposes the existing `Why?` evidence without recalculating it.

The current Research Console already loads `scanner-card.js`, so that file performs a narrowly scoped browser bootstrap for `research-console-wiring.js` only when the page title identifies the Trading Research Console. Node validation and non-console browser surfaces remain unaffected.

This bootstrap is an integration hook, not a second application or a second trading engine.

## Presentation contract

A visible guidance model contains:

- `code`
- `severity`
- `title`
- `message`
- compact `why` evidence
- optional observation timestamp

If `guidance.emit !== true`, no new Trade Coach message replaces the last decision-relevant guidance.

This preserves the core rule:

`NO MEANINGFUL STATE CHANGE -> NO NEW GUIDANCE`

## Safeguards

- the UI adapter cannot grant broker authority;
- the UI adapter cannot grant AI authority;
- the UI adapter does not score confidence;
- the UI adapter does not decide setup validity;
- the UI adapter does not recalculate breadth, R:R, targets, or historical statistics;
- the monitor FTFC alignment supplied to setup context is derived only from current price versus each displayed period open;
- Why evidence is passed through from the shared setup-context object;
- a missing setup remains WAIT rather than being manufactured by context.

## Validation

Focused deterministic harnesses:

- `tests/trade-coach-validation.js`
- `tests/trade-coach-ui-validation.js`

The final DOM bootstrap is a browser-integration boundary and should receive a visible smoke pass in the deployed Research Console after GitHub Pages serves the latest commit.

## Status

Trade Coach engine: IMPLEMENTED.
Presentation adapter: IMPLEMENTED.
Visible Research Console wiring: IMPLEMENTED.
Browser smoke observation: PENDING.
