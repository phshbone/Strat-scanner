# Validation Addendum — Data Semantics v0.32

Date: 2026-08-19

## New production layer

Added:
- `data-semantics.js`
- `tests/data-semantics-validation.js`
- `DATA-SEMANTICS-SPEC.md`

Updated:
- `signal-schema.js`
- `setup-signal-adapter.js`

Added integration harness:
- `tests/data-semantics-signal-integration-validation.js`

## Purpose

Prevent the deterministic Strat engine from treating differently constructed bars as equivalent.

Required provenance now includes:
- symbol;
- timeframe;
- market timezone;
- session;
- extended-hours policy;
- bar anchor;
- anchor offset;
- provider;
- provider aggregation semantics;
- period-open identity/timestamp;
- bar-open/bar-close timestamps when available.

## Behavioral safeguards

- RTH and extended-hours histories are not silently mixed.
- Differently anchored 60-minute bars are not treated as directly comparable.
- Provider brand name alone does not determine comparability; actual aggregation semantics do.
- Continuity cannot be audited without explicit period-open identity.
- Normalized signals now retain `dataSemantics` and `semanticKey` provenance through the setup -> signal adapter.

## Validation status

Local Node execution on 2026-08-19:
- `tests/data-semantics-validation.js`: **24/24 PASS**.

The signal-provenance integration harness currently contains 10 checks and is committed. It has **not yet been executed in the available tool session**, so it is not being reported as pass-verified.

## Production path

`PROVIDER RAW DATA -> ADAPTER -> OHLCV + DATA SEMANTICS -> STRAT BAR CLASSIFICATION -> SETUP -> SIGNAL + SEMANTIC PROVENANCE -> LIFECYCLE / DOMINO / OBJECTIVES`

## Next work

1. run the signal-provenance integration harness in Node/CI;
2. execute the previously unverified signal-schema/setup-adapter/carrier harnesses together;
3. add a real provider adapter that emits this contract;
4. reject or flag historical comparisons when semantic keys are incompatible;
5. then begin broader intraday historical carrier validation.