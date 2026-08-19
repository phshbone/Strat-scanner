# Alex Nightly Scan Workflow — Source Extraction

Source: user-supplied transcript of Alex nightly scan video
Video: https://youtu.be/VCa__0s4bOA?is=HFH5SCKLf6dezVth
Date captured: 2026-08-19

## Why this matters
This video is primarily a scanner/workflow source rather than a new canonical Strat rule source. It shows how Alex operationalizes existing Strat concepts across indexes, sectors, stocks, and multiple timeframes.

## Confirmed workflow patterns

### 1. Start with higher-timeframe market structure
Alex first checks weekly structures on broad indexes and sector ETFs, looking for:
- shooters
- hammers
- inside weeks
- simultaneous breaks across related indexes/sectors

This is market-context and candidate-generation logic, not a redefinition of Strat patterns.

### 2. Use relative strength/weakness across related groups
He compares indexes and sectors against one another. A name or sector showing weaker weekly structure while major indexes remain stronger is treated as relative weakness context.

For the engine:
- preserve setup validity separately from relative-strength/weakness ranking
- sector/index alignment may increase or decrease candidate priority

### 3. Scan for same-theme clustering
He checks whether multiple semiconductor names and SMH share shooters or related reversal structures.

For the engine:
- same-sector setup clustering is useful context
- clustering is not itself a trade trigger

### 4. Full Timeframe Continuity + in-force scan
Alex explicitly describes scanning for:
- full timeframe continuity bearish
- patterns that are in force
- inside-week breaks and shooter reversals after the new week opens

This strongly supports our architecture:
`VALID SETUP -> FTFC CONTEXT -> IN-FORCE STATE -> CANDIDATE RANKING`

The setup remains deterministic. FTFC and in-force status help determine whether it belongs near the top of the scan.

### 5. Higher/lower timeframe interaction
He repeatedly moves between weekly, monthly, and quarterly structure. Examples include:
- weekly shooter with monthly/quarterly context
- quarterly inside bar while monthly structure develops
- weekly signal potentially negating conflicting monthly direction

For the engine, store separately:
- setup timeframe
- higher-timeframe context
- lower-timeframe execution timeframe when relevant

Do not collapse them into one synthetic direction flag.

### 6. Pivot Machine Gun / magnitude context
He identifies PMG conditions and discusses sequential pivots as possible expansion targets.

This supports the existing magnitude target-stack model:
- valid pivots form ordered target stacks
- taking one pivot promotes the next
- PMG can represent acceleration through multiple nearby pivots

Exact automatic PMG/pivot qualification remains a separate validation task.

### 7. RevStrat / outside-month possibility
He discusses a monthly setup that could become RevStrat / outside month if price moves through the relevant level.

This confirms RevStrat belongs in the later validated pattern registry, but this transcript alone is not sufficient to encode a precise new RevStrat rule beyond currently established definitions.

### 8. Mother-bar / distance-to-target feasibility
He references an inside structure potentially remaining within a mother-bar range and comments on the distance needed to reach the opposite side.

For the research engine, this supports keeping:
- remaining magnitude distance
- target feasibility
- time remaining
as separate ranking/context fields.

Do not turn distance alone into setup invalidation unless a source defines an exact rule.

## Scanner implications
Candidate-generation pipeline suggested by this video:

1. Evaluate broad indexes.
2. Evaluate sector ETFs.
3. Detect higher-timeframe Strat structures.
4. Identify sector/theme clustering.
5. Open the new timeframe and monitor which setups trigger.
6. Filter/rank by FTFC.
7. Filter/rank by in-force status.
8. Promote names with aligned sector/index context.
9. Track magnitude / PMG pivot stacks.
10. Preserve conflicting higher-timeframe context instead of hiding it.

## Important separation
This video should influence:
- scanner workflow
- ranking/context
- multi-timeframe presentation
- sector/index alignment

It should NOT redefine:
- 1 / 2U / 2D / 3 classification
- canonical setup definitions
- trigger semantics
- magnitude pivot rules without additional validation

## Status
Operational-source evidence. Useful for scanner architecture and ranking. Not profitability evidence and not sufficient by itself to finalize automatic pivot qualification.
