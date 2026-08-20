# Glossary — v0.1

Date: 2026-08-20

## Purpose

Provide a single source of truth for user-facing Strat and system terminology so Help, setup cards, Why views, Practice Mode, and Trade Coach use the same definitions.

## Architecture

`glossary.js` contains structured term records with:

- stable ID;
- canonical display term;
- aliases / abbreviations;
- category;
- concise definition.

The glossary is intentionally data-first. The initial build does not force a new UI panel into the current application. A Help/Glossary screen can render this same source later without duplicating definitions.

## Initial coverage

The starter set includes:

- Scenario 1 / 2 Up / 2 Down / 3;
- actionable signal and in-force state;
- 2-1-2, 3-1-2, Rev Strat;
- magnitude, mother bar, broadening formation, PMG, reclaim, exhaustion;
- FTFC, carrier, domino, market participation/breadth;
- structural reward-to-risk, MFE, MAE;
- Practice Mode, scale-ins, ambiguity, and WAIT / NO ACTIONABLE SETUP.

## Definition safeguards

Definitions must preserve the project's source/model boundaries:

- completed Scenario 3 OHLC does not invent intrabar path;
- magnitude is a structural objective, not a guaranteed destination;
- FTFC and breadth are context, not standalone predictive probabilities;
- breadth does not imply institutional identity;
- Practice Mode has no broker authority;
- management rules do not silently redefine pure Strat setup validity;
- WAIT remains legitimate even when supporting context looks favorable.

## Search behavior

`getGlossaryTerm()` resolves stable IDs, canonical names, and exact aliases.

`searchGlossary()` performs simple case-insensitive text search across terms, aliases, categories, and definitions.

`listGlossaryCategories()` provides category names for a future Help UI filter.

## Intended UI

Future Help implementation should remain compact:

`HELP -> GLOSSARY -> SEARCH / CATEGORY -> TERM -> DEFINITION`

Terms used on cards may later expose a small info affordance that opens the matching glossary entry instead of repeating long explanations everywhere.

## Validation

Focused harness:

- `tests/glossary-validation.js`

The harness checks uniqueness, minimum coverage, alias resolution, search behavior, category integrity, and critical definition safeguards.
