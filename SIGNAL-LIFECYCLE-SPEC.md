# Signal Lifecycle Spec v0.1

Date: 2026-08-19

## Purpose

Represent an actionable Strat signal as a time-bounded deterministic state rather than a permanent setup flag.

This module is grounded in current TheStrat.ai documentation stating that an actionable signal is only in force while its triggering bar remains open, and that hitting magnitude completes what that signal measured.

## Required distinctions

### Trigger state
- bullish in force: current price > trigger
- bearish in force: current price < trigger
- equality is not in force

### Time state
- `NOT_STARTED`: current time precedes signal bar start
- `STANDBY`: signal bar is open but trigger is not in force
- `ACTIVE`: trigger is in force, signal bar is open, magnitude not completed
- `EXPIRED`: signal bar has closed
- `COMPLETED`: magnitude has been reached before expiration

Time expiration and price completion are separate concepts.

## Magnitude source

A signal can use:
1. setup-defined magnitude; or
2. explicitly borrowed higher-timeframe magnitude.

Setup-defined magnitude always wins when both are supplied.

Borrowed magnitude exists to support future expansion setups such as 3-2, which current TheStrat.ai documentation says carry no magnitude of their own.

The lifecycle module does not decide whether a borrowed magnitude is structurally valid. That validation belongs upstream in setup/domino/objective logic.

## Level of reclaim

`levelOfReclaim` is preserved as a first-class optional field.

The lifecycle module does not calculate it yet. Exact per-pattern reclaim geometry must be verified from dedicated current source material and visuals before implementation. It must not be silently equated with midpoint stop or structure stop.

## Carrier timeframes

`carrierTimeframes()` returns timeframes whose signals are currently ACTIVE.

If a lower-timeframe signal expires while a higher-timeframe signal remains active, only the higher timeframe remains a carrier. This supports multi-timeframe management without redefining the original thesis or execution timeframe.

## Integration path

`CORE SETUP -> SIGNAL OBJECT -> SIGNAL LIFECYCLE -> DOMINO / CARRIER STATE -> OBJECTIVE / MANAGEMENT CONTEXT`

The lifecycle module does not create setups, rank trades, predict continuation, or execute trades.

## Safeguards

- signal expiration is bar-close based;
- magnitude completion is not the same as time expiration;
- completion does not imply automatic reversal;
- no arbitrary time-exhaustion thresholds are invented;
- borrowed magnitude must be explicit;
- `levelOfReclaim` formula remains unresolved until verified;
- strict trigger semantics are preserved.
