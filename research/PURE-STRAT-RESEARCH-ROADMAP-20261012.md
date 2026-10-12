# Pure Strat Research Roadmap — 2026-10-12

## Locked architecture

- **Pure Strat first:** deterministic scenario/setup engine remains the sole source of setup validity, direction, trigger, stop, and first magnitude.
- **Research is not production:** contextual tags and empirical correlations cannot silently reject, redefine, or authorize a canonical setup.
- **Minervini SEPA:** future optional candidate-universe selection hypothesis only; no production influence until independently evaluated and explicitly approved.
- **Elder:** optional psychology/execution context, not a source of Strat rule overrides.
- All candidate events, including those with absent, contradictory, or uncertain contexts, must be retained for denominator integrity.
- Historical statistics are descriptive; no profitability or live-trading readiness claim based on magnitude-before-stop rates alone.

## Scope of this pull request

- Preserve `setupVariant` for observed 2-1-2 signals as `CONTINUATION` or `REVERSAL` based on the canonical engine's already calculated `variant` field.
- Record `UNSPECIFIED` for other setup families instead of inventing an unsupported continuation/reversal classification.
- Compare 2-1-2 variants separately in the historical cohort audit and diagnostics.
- Do **not** alter detection logic, entry/stop/magnitude geometry, management presets, candidate filtering, broker behavior, or Trade Coach advice.

## Subsequent research gates (separate changes)

1. Validate historical classifications in synthetic and real cases, verify observation-time provenance and no future-bar use.
2. Characterize magnitude-before-stop performance by variant, timeframe, direction, stop model and market regime, with explicit unresolved/ambiguous counts.
3. Add first-observable research-only tags for Momo Hammer / shooter, broadening boundary position, reclaim, exhaustion, PMG, and FTFC; unknown remains unknown.
4. Compare tagged vs untagged canonical setups, with predeclared cohorts, minimum samples, chronological holdouts and sensitivity to context choices.
5. Implement execution-realistic results including fees, slippage, realized R, stop width, liquidity, exposure, trade overlaps and account-risk constraints. Do not equate reaching magnitude with realized profit.
6. Only then consider explainable candidate ordering in the UI; optional AI interpretations cannot override deterministic/statistical records.
7. Paper trade with fixed maximum dollar risk and no automatic position additions until validated under combined-position risk limits.
8. Minervini selection research and any eventual production promotion require a separate review and explicit approval.

## Known boundaries

- 15-minute reconstructed checkpoint evidence currently uses 5-minute completed checkpoints, not tick-level fills.
- Same-5-minute target/stop collisions remain ambiguous.
- 60-minute aggregation remains held until verified provider-anchor semantics.
- Price-discovery and order-flow explanatory narratives are not evidence of predictable institutional behavior.
- Historical result artifacts must carry code version, observation timestamp, data provider, series horizon, sample construction, and success definition.
