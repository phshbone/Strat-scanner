# Alex Scanner Walkthrough — Operational Notes

Source supplied by user:
- YouTube: https://youtu.be/zcW4ThhWyek
- Topic: how to use TheStrat.ai scanner; scanner operation, not strategy.

Source classification:
- Alex / TheStrat.ai operational implementation.
- Useful for scanner UX, search states, filters, columns, breadth/statistics workflow, and execution-oriented discovery.
- Does not override Rob Smith canonical Strat law.

## High-confidence scanner behaviors

### 1. Timeframe-first scanning
Scanner is organized around a selected timeframe.
Observed/mentioned ladder in walkthrough:
- 15
- 30
- 60
- D
- W
- planned/added M/Q/Y

Engine/UI implication:
- active scan timeframe should be an explicit first-class parameter;
- scan results are scoped to that timeframe rather than mixing timeframes by default.

### 2. Distinct SETUP vs SIGNAL modes
Alex explicitly separates:
- SETUP mode = patterns setting up before/at bar close for the next active bar;
- SIGNAL mode = directional signals that are already in force.

Examples:
- a weekly 3-1 state can be a setup for next week but not yet an in-force signal;
- inside setups are shown in SETUP mode;
- inside-up / inside-down directional signals appear in SIGNAL mode when triggered.

Implementation consequence:
- do not treat a present setup object as equivalent to an active carrier;
- scanner needs two independent query modes over the same deterministic state model.

Suggested internal distinction:
`SETUP_CANDIDATE != SIGNAL_IN_FORCE`

This strongly confirms the existing project invariant:
`PRESENT SETUP OBJECT != ACTIVE CARRIER`.

### 3. Setup timing is tied to bar closure / next bar
Alex describes using SETUP mode:
- before bars close;
- at/after daily close;
- on weekends for weekly setups;
- before a new month for monthly setups.

Implication:
- scanner should know whether the selected bar is forming, closed, or next-period eligible;
- period/session resolver and bar lifecycle are necessary scanner inputs, not optional metadata.

### 4. Arbitrary candle-sequence scanning
Columns allow direct filtering of:
- current candle;
- previous candle (C1);
- previous-previous candle (C2).

This lets users construct sequences manually, e.g.:
- 2U red / 2D green potential reversals;
- 3-1 setups;
- 2-1-2;
- 3-1-2;
- double inside;
- potential 3s / RevStrat candidates.

Implementation consequence:
- expose raw normalized scenario history independently of named setup presets;
- named scans should compile to ordinary scenario/filter expressions rather than being hard-coded opaque scanners.

Proposed normalized fields:
- `C0`
- `C1`
- `C2`
- candle body color / red-green-doji separately from Strat scenario.

### 5. Quick filters + user-defined filters
Built-in presets mentioned:
- reversals;
- hammers;
- shooters;
- inside bars;
- 2-2 reversal;
- directional candle/body-state combinations.

Users can also save custom scans as quick filters.

Implementation consequence:
- scanner query definition should be serializable JSON/state;
- saved scans should be data, not code;
- filters should be combinable and inspectable.

### 6. Magnitude fields
Columns mentioned:
- magnitude;
- trigger level;
- magnitude distance;
- progress to magnitude.

Progress can exceed 100% after magnitude is surpassed.

Implementation consequence:
- preserve distinct fields:
  - `triggerPrice`
  - `magnitudePrice`
  - `distanceToMagnitude`
  - `progressToMagnitudePct`
  - `magnitudeStatus`
- >100% means price has exceeded the first magnitude; it must not be interpreted as a new setup or automatic continuation signal.

### 7. Multi-timeframe display
Scanner can show multiple timeframes either as:
- color / continuity state;
- setup-colorized values.

Walkthrough references combinations including 60/D/W/M/Q/Y as data becomes available, while intraday examples also use 15/30.

Implementation consequence:
- multi-timeframe column is a compact summary layer over independently computed timeframe states;
- no timeframe should silently inherit another timeframe's carrier or scenario.

### 8. Configurable grid
Operational features:
- reorder columns;
- add/remove columns;
- auto-size;
- save grid state;
- restore defaults.

Implementation consequence:
- column configuration should be persisted per user/device;
- scanner engine should be decoupled from column presentation.

### 9. Two-bar vs three-bar display preference
Alex notes an option to show two-bar patterns rather than the larger three-bar presentation; Sarah prefers two-bar display.

Classification:
- presentation/execution preference, not Strat-law change.

Implementation consequence:
- pattern display depth should be user-configurable while underlying detection remains unchanged.

## Breadth / statistics findings

### 10. Sector statistics page
Statistics page shows percentage of 2U and 2D across:
- each sector;
- rest of market / broader market context;
- daily / weekly / monthly basis.

Examples in walkthrough use sectors with very high 2D participation to identify where selling is concentrated.

Implementation consequence:
- breadth layer should expose raw counts and percentages by universe + sector + timeframe;
- strongest/weakest sectors should be discoverable from observable scenario participation.

No arbitrary project ranking threshold should be invented from this source.

Suggested raw statistics:
- universe count;
- count 2U;
- count 2D;
- count 1;
- count 3;
- pct 2U;
- pct 2D;
- directional imbalance;
- number of fresh signals in force;
- number of candidate setups.

### 11. Breadth -> confirming-signal workflow
Alex's workflow:
1. identify sector with concentrated 2U or 2D participation;
2. filter that sector for directional signals;
3. inspect lower-timeframe confirming setups/signals;
4. use those to participate in already-established directional pressure.

This is an operational implementation of breadth / simultaneous-break thinking.

Implementation consequence:
- scanner needs sector drill-down;
- breadth should be context/ranking evidence, not a mutation of individual Strat setup validity;
- lower-timeframe confirmation remains its own signal state.

### 12. Simultaneous-break extension
Alex states M/Q/Y statistics make this more useful for simultaneous breaks.

Project implication:
- breadth engine should be timeframe-neutral and support D/W/M/Q/Y once validated aggregation exists;
- no fixed simultaneous-break threshold should be encoded solely from this walkthrough.

## Change / ATR / volume / price filtering

Walkthrough demonstrates filtering by:
- price;
- ATR %;
- change / change %;
- timeframe-relative change behavior;
- symbol lists.

Important nuance:
- D/W scan modes can link change values to the selected D/W timeframe;
- 60 and below may use daily change metrics in Alex's implementation.

Classification:
- scanner implementation choice, not Strat law.

Project decision:
- make metric timeframe explicit in field metadata so a user cannot confuse daily change with selected intraday-bar change.

## Export / AI workflow

Scanner supports:
- copy;
- copy with headers;
- export CSV.

Alex demonstrates exporting a filtered list, using ChatGPT to produce a comma-separated symbol list, then feeding that list back into the scanner as an ad-hoc watchlist.

Implementation consequence:
- export CSV is a high-value feature;
- import/paste symbol list should be supported;
- saved watchlists should be first-class later;
- AI remains downstream of deterministic scanner output, not the source of setup detection.

## Proposed scanner architecture derived from this source

### Core query mode
`timeframe + mode + universe + raw scenario filters + setup filters + directional state + context filters`

Modes:
- `SETUP`
- `SIGNAL`

### Raw state columns
- Symbol
- Sector
- Last
- ATR %
- Avg Volume
- C2
- C1
- C0
- Candle body color
- Setup category
- Signal direction
- In Force
- Trigger
- Magnitude
- Magnitude Distance
- Progress to Magnitude
- FTFC / multi-timeframe state

### Project-specific additive columns later
- Reclaim / LoR
- PMG
- Exhaustion
- Breadth / sector participation
- Minervini state
- Elder state
- User guardrail status
- Options affordability/liquidity
- Provider/data-semantic badge where needed for audit

## Confirm / refine / missing / conflict audit

### CONFIRM
- SETUP and SIGNAL must remain separate states.
- Candle-sequence history C0/C1/C2 should be directly searchable.
- Magnitude and progress-to-magnitude belong in scanner state.
- Multi-timeframe values are independent timeframe states.
- Sector breadth is an explicit scanner/statistics layer.
- CSV export and user-defined saved filters are useful core UX.

### REFINE
- exact definition of every quick-filter label;
- exact meaning of any scanner-specific category suffix such as `Inside +`;
- exact multi-timeframe color vocabulary;
- exact calculation basis for displayed magnitude distance/progress;
- exact behavior of change metrics by selected timeframe.

### MISSING / TODO
- validate monthly/quarterly/yearly aggregation semantics before production use;
- define saved-filter JSON schema;
- define breadth event schema;
- define sector/universe membership source;
- define source-attributed hammer/shooter geometry if not already locked elsewhere.

### NO CONFLICT
Nothing in this walkthrough requires changing canonical Strat scenario classification or setup validity. It primarily specifies scanner state, filtering, breadth workflow, and UX.

## Recommended project rule

Build named quick scans as transparent compositions over raw scanner fields.

Example:
`3-1-2 scan = C2:3 AND C1:1 AND C0 directional trigger/state`

The underlying deterministic candle state remains inspectable even when the user activates a named preset.
