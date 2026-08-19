# Rob Smith Tuesday Strat Attack — Operational Notes

Date: 2026-08-19

Source: User-supplied transcript from Rob Smith Tuesday Strat Attack show.

## Why this matters

This is direct Rob Smith real-time application material rather than a classroom-style definition video. It is useful for operational state transitions, scanner behavior, timing/context, and how Rob moves between macro and execution timeframes.

## High-confidence observations

### 1. Breadth / simultaneous-break logic is explicitly operational
Rob repeatedly asks how many weekly highs or lows are being taken out and whether many names are moving in the same direction.

Operational consequence:
- scanner should count directional breakout participation across a defined universe or sector;
- mixed direction implies broader-index chop is more plausible;
- aligned directional participation is higher-probability context;
- breadth is ranking/context, not setup validity.

Do not invent a universal percentage threshold before testing.

### 2. Inside-range state is a real no-resolution condition
Rob repeatedly asks how QQQ can get out of an inside day / 60-minute chop range.

Operational consequence:
- preserve `INSIDE / UNRESOLVED` as a distinct context state;
- do not force a directional interpretation before the relevant range breaks;
- lower-timeframe chop inside a larger active range should be represented separately from a true opposing reversal.

### 3. Waiting is part of the method
Rob explicitly says waiting for things to set up is important and that a signal can appear one day and reverse again the next.

Operational consequence:
- absence of a valid actionable setup should produce `WAIT / NO_ACTION`, not a low-confidence trade suggestion;
- system should support days where no trade is the correct deterministic result.

### 4. Opening behavior can be noisy
Rob says he had pulled back from aggressively trading the opening and preferred to let the market open, because gaps and early movement can stop people out before direction becomes clearer. He still treats 60-minute signals as major.

Implementation safeguard:
- this is an execution/context preference, not a universal canonical rule that all Strat signals must wait one hour;
- possible future profile: `OPEN_STABILIZATION_CONTEXT` or configurable opening-delay guidance;
- do not alter live Strat trigger validity itself.

### 5. New timeframe periods create new continuity reference levels
Rob explicitly notes that a new year creates new continuity levels, and references year / quarter / month / day resets.

Operational consequence:
- timeframe-open price is period-specific and must reset at exact session/calendar boundaries;
- continuity engine needs explicit period identity and open timestamp;
- calendar/session metadata is foundational, especially for Y/Q/M/W/D transitions.

### 6. Macro thesis and execution lane are separate
Rob describes macro themes such as long energy / short technology while still using daily, 60, and 30-minute setups for execution.

Operational consequence:
- preserve `macro/thesis timeframe` separately from `execution timeframe`;
- a shorter-timeframe trigger should not rewrite the higher-timeframe thesis identity;
- this supports the existing thesis/execution/carrier architecture.

### 7. A rejected side of a 3 remains structurally important
Rob describes outside weeks / 3s as evidence that one side's buying can be rejected; if rejection continues, the move can expand in the opposite direction. If price reclaims, the interpretation changes.

Operational consequence:
- outside-range side tests and failures should remain explicit structural events;
- do not collapse `tested`, `rejected`, `reclaimed`, and `reversed` into one state.

### 8. 30-minute execution can coexist with 60-minute significance
Rob references a 30-minute 2-2 reversal as the strongest move of the day while also saying 60-minute signals remain major.

Operational consequence:
- timeframe profiles must remain configurable;
- 60 can be a principal carrier while 30 supplies tactical execution;
- no single intraday timeframe should be hard-coded as universally authoritative.

### 9. Holiday / participation context is acknowledged but not deterministic
Rob discusses year-end participation uncertainty and traders being away.

Operational consequence:
- market-calendar / holiday / shortened-session metadata may be useful as context later;
- do not infer direction from presumed low participation.

## New event/state candidates

Potential future deterministic/advisory states supported by this briefing:
- `BREADTH_ALIGNED_BULLISH`
- `BREADTH_ALIGNED_BEARISH`
- `BREADTH_MIXED`
- `INSIDE_RANGE_UNRESOLVED`
- `WAIT_NO_ACTIONABLE_SETUP`
- `PERIOD_OPEN_RESET`
- `OPENING_NOISE_CONTEXT`
- `RANGE_SIDE_REJECTED`
- `RANGE_SIDE_RECLAIMED`

The opening-noise state is advisory only and must be profile-configurable.

## Source-separation safeguard

Direct Rob teaching controls pure Strat semantics. His personal preference to let the open settle is operational/execution guidance, not a modification of the underlying signal trigger definition.
