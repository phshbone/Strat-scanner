# Stat Trading — Carrier / Reversal-Against / Reclaim Notes

Date: 2026-08-19
Source supplied by user: https://youtu.be/rLiefPW1xCs?is=lFbf1gqLXprrB6zf

## Why this source matters

The supplied transcript gives unusually explicit operational language around higher-timeframe carrier signals, lower-timeframe confirmation, negation, 3-2 execution, broadening-derived magnitude, and reclaim/equilibrium behavior.

This source is treated as an operational cross-check only. Rob Smith remains canonical for observable TheStrat rules; Sarah/Alex remain higher-priority operational refinements when conflicts arise.

## High-confidence operational observations from transcript

### 1. Higher-timeframe signal can be carried by lower-timeframe confirming states

The speaker repeatedly describes a higher-timeframe signal as remaining valid while lower timeframes continue to print directional 2s or inside bars that do not reverse against it.

Bullish example:
- weekly signal is in force;
- Daily can print 2U or remain a 1 / inside bar while making higher lows;
- each fresh 2U is described as reconfirming the weekly signal;
- absence of a reversal against the weekly thesis allows the higher-timeframe objective to remain valid.

This supports the current carrier model:
- lower timeframe confirmation is evidence, not a new higher-timeframe trigger;
- an inside bar does not automatically negate the carrier;
- a valid opposing reversal can negate or materially weaken the carrier thesis.

### 2. “Reversal against” is distinct from ordinary pullback or inside consolidation

The transcript repeatedly distinguishes:
- ordinary pullback / one-bar consolidation / higher-low behavior, which may leave the higher-timeframe thesis intact;
- an actual reversal against the active higher-timeframe signal, which can negate what was previously expected.

This is useful for future warning cards:
- `LOWER_TF_CONFIRMING`
- `LOWER_TF_NEUTRAL_INSIDE`
- `OPPOSING_REVERSAL_FORMING`
- `OPPOSING_REVERSAL_IN_FORCE`

Do not treat every lower-timeframe red candle or inside bar as a carrier failure.

### 3. 3-2 can be a lower-timeframe execution/confirmation mechanism for a higher-timeframe signal

The transcript gives examples of 3-2 on 60m / Daily being used to enter or confirm a move whose magnitude comes from a higher timeframe.

This strongly corroborates the current architecture:
- 3-2 itself does not need to invent magnitude;
- 3-2 can function as execution or reconfirmation;
- higher-timeframe broadening structure can supply the actual objective.

### 4. Broadening structure supplies magnitude

The speaker explicitly says the higher-timeframe broadening formation allows the trader to gauge magnitude.

This supports the existing objective architecture:
`LOWER-TF SIGNAL / EXECUTION -> HIGHER-TF BROADENING OBJECTIVE`

### 5. Inside bar can confirm or negate depending on the subsequent break

The transcript states an inside bar will either confirm or negate the thesis depending on which side is subsequently taken.

This reinforces state-machine handling:
- inside bar itself = pending / neutral compression;
- subsequent directional break = confirmation or negation relative to the active carrier thesis.

### 6. Equilibrium / reclaim can invalidate the prior directional objective

The clearest reclaim-related section in the transcript describes price:
- poking through one side;
- reclaiming equilibrium;
- moving back above it;
- at that point the speaker says the prior downside objective is no longer the operative expectation and price has reversed back through the opposing internal levels.

This is valuable but must be kept separate from the unresolved universal `Level of Reclaim` formula.

What this source DOES support:
- reclaim of a meaningful equilibrium/reference level can negate an active directional expectation;
- reclaim can be a state transition, not merely a stop location;
- prior range equilibrium can act as a structural boundary during range re-entry.

What this source does NOT yet prove:
- that equilibrium is always identical to the formal Level of Reclaim for every 2-2 / 2-1-2 / 3-1-2 / hammer / shooter;
- a universal numeric reclaim formula;
- whether equilibrium is midpoint, trigger, or another setup-specific level in every context.

Therefore do not replace `levelOfReclaim = null` with an inferred equilibrium globally.

### 7. Management after lower-timeframe entry can defer to the higher-timeframe carrier

The transcript gives an example where a Monthly signal is in force and the entry is taken on 60m. The speaker then manages around the higher-timeframe thesis rather than reacting to ordinary lower-timeframe noise.

This supports the distinction:
- thesis timeframe
- execution timeframe
- management / carrier timeframe

and the future card logic:
`EXECUTION TF COMPLETES/CHANGES -> CHECK WHETHER HIGHER-TF CARRIER REMAINS VALID BEFORE EXITING`

## Architecture impact

Add to deterministic / interpretation layer:

1. `confirmationState` for lower timeframes relative to carrier direction:
   - CONFIRMING
   - NEUTRAL_INSIDE
   - OPPOSING_REVERSAL_FORMING
   - OPPOSING_REVERSAL_IN_FORCE

2. `carrierNegated` should require an observable opposing reversal / reclaim rule, not generic momentum weakness.

3. preserve 3-2 as no-own-magnitude expansion setup that may execute into higher-timeframe broadening magnitude.

4. treat equilibrium reclaim as a distinct structural event candidate until exact formal Level-of-Reclaim geometry is source-verified.

5. future warning cards should distinguish:
   - lower TF still confirming higher TF;
   - lower TF neutral / inside;
   - opposing reversal forming;
   - opposing reversal now in force;
   - equilibrium reclaimed / prior directional thesis no longer supported.

## Do-not-assume safeguards

- Do not equate every inside bar with loss of carrier.
- Do not equate every lower-timeframe pullback with reversal against.
- Do not assign 3-2 its own setup-defined magnitude.
- Do not globally equate equilibrium with formal Level of Reclaim.
- Do not turn reclaim into an automatic broker exit until an explicit management rule is defined and historically tested.
