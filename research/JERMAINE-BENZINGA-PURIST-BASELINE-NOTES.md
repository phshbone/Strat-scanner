# Jermaine / Benzinga Purist Baseline Notes

Date: 2026-08-19
Source supplied by user: Benzinga interview with Jermaine / Strat Soldier.

## Source role

Jermaine is treated as a high-confidence purist cross-check of Rob Smith's original Strat teaching. Rob remains canonical. Jermaine's execution preferences are preserved as preferences when he explicitly frames them as his style.

## High-confidence baseline observations

### Three universal truths
Jermaine explicitly frames the Strat around:
1. actionable signals;
2. timeframe continuity;
3. broadening formations.

### Scenario definitions
- Scenario 1 = inside bar: takes neither side of the prior range.
- Scenario 2 = takes one side of the prior range.
- Scenario 3 = outside bar: takes both sides of the prior range.
- Scenario 3 is especially important because it represents a lower-timeframe broadening formation / battleground and helps define magnitude/context.

### Actionable signal / in-force behavior
- Hammer goes in force when the next live bar breaks above the hammer high.
- Shooter goes in force when the next live bar breaks below the shooter low.
- No need to wait for the triggering bar to close after the break; the break itself is the actionable event.
- A 2-2 reversal can use a normal 2 bar; hammer/shooter shape is preferred evidence, not required validity.

### Inside-bar rule
- A forming inside bar is not traded as an actionable breakout yet.
- Once the inside bar closes, it becomes an equilibrium/reference range.
- The subsequent break of the inside-bar high/low becomes actionable.
- Jermaine strongly advises avoiding lower-timeframe churn when the relevant higher timeframe is still forming inside.

### Mother-bar / range-confinement rule
- Repeated bars trapped inside a larger outside/mother bar are a chop / price-discovery condition.
- Avoid treating internal reversals as high-quality directional continuation until price exits the mother-bar range.
- A valid reversal that exits the mother-bar range is materially different from internal churn.

### Reversal patterns
Purist baseline examples explicitly include:
- 2-2 reversal;
- 2-1-2 reversal;
- 3-1-2 reversal.

The trigger is the break of the relevant prior actionable range in the new direction.

### Timeframe continuity
Jermaine uses M/W/D/60 as his primary four-chart framework.
He describes:
- higher timeframe = broader directional evidence;
- lower timeframe = what is happening now / execution;
- weekly signals confirm monthly;
- daily reconfirms weekly/monthly;
- 60-minute signals reconfirm daily/weekly/monthly.

He also explicitly says Strat reversals work on any timeframe and that traders may use smaller timeframes. Sarah is cited as an example of a lower-timeframe "sniper." Therefore M/W/D/60 is a profile, not a universal hard-coded requirement.

### Control / Confirm / Conflict / Change
Jermaine gives a useful timeframe-continuity interpretation framework:
- CONTROL: lower execution timeframe shows what is happening now.
- CONFIRM: lower timeframe agrees with the higher-timeframe directional thesis.
- CONFLICT: lower timeframe opposes higher-timeframe direction but has not necessarily changed the full structure yet.
- CHANGE: opposing movement propagates enough to change higher-timeframe state.

This is directly useful for carrier-relative interpretation and warning cards.

### Broadening formation / magnitude
- Higher highs and lower lows define the broadening structure.
- Broader timeframes are used to gauge the larger objective / magnitude.
- Lower-timeframe execution can be used inside that larger structure.

### Entry / stop / re-entry preference
Jermaine's execution preference in this interview:
- initial position is small;
- use very tight stops around the actionable signal;
- if the signal fails, exit immediately rather than hope;
- if it sets up again later, re-enter;
- add to winners on fresh reconfirmation;
- progressively tighten / trail stops as the trade matures;
- maintain a daily loss limit.

Important safeguard: treat the exact tight-stop placement and dollar daily-loss example as Jermaine's execution/risk preference, not universal canonical Strat law.

### Profit protection
- Opposing actionable reversal is a reason to protect gains / exit.
- A visible shooter/hammer alone is not enough; it must go in force to become actionable.
- The purpose is to avoid giving back a winning trade while allowing re-entry if the setup reforms.

## Engine implications

1. Preserve the pure Strat validity layer separately from risk/management preferences.
2. Add explicit carrier-relative interpretation states around Jermaine's Control / Confirm / Conflict / Change framework.
3. Add a range-confinement / mother-bar context state so internal churn can be ranked lower without declaring the underlying setups invalid.
4. Keep M/W/D/60 as a configurable profile rather than a universal requirement.
5. Keep hammer/shooter morphology as evidence/preference unless the underlying trigger rules themselves are satisfied.
6. Do not encode Jermaine's exact stop distance or daily dollar loss limit as canonical defaults.

## Proposed deterministic carrier-relative states

- CONFIRMING
- NEUTRAL_INSIDE
- CONFLICT
- OPPOSING_REVERSAL_FORMING
- OPPOSING_REVERSAL_IN_FORCE
- HIGHER_TF_CHANGE
- MOTHER_BAR_CONFINED
- RANGE_EXIT_CONFIRMING

These states should inform UI/advisory cards and later rule testing; they must not silently mutate the canonical setup detector.
