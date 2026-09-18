-- Historical evidence database v1
-- Cloudflare D1 / SQLite

CREATE TABLE IF NOT EXISTS historical_events (
  event_id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  signal_timestamp TEXT NOT NULL,
  setup_id TEXT NOT NULL,
  direction TEXT NOT NULL CHECK(direction IN ('BULLISH','BEARISH')),
  timeframe TEXT NOT NULL,
  market_type TEXT,
  stop_model TEXT NOT NULL CHECK(stop_model IN ('MIDPOINT','STRUCTURE')),
  entry REAL NOT NULL,
  stop REAL NOT NULL,
  magnitude REAL NOT NULL,
  resolution TEXT NOT NULL,
  magnitude_hit INTEGER NOT NULL DEFAULT 0,
  stop_hit INTEGER NOT NULL DEFAULT 0,
  first_hit TEXT,
  sequence_ambiguous INTEGER NOT NULL DEFAULT 0,
  time_to_magnitude_bars INTEGER,
  realized_r REAL,
  ftfc_alignment TEXT,
  market_alignment TEXT,
  sector_alignment TEXT,
  elder_state TEXT,
  minervini_state TEXT,
  exhaustion_state TEXT,
  sss50_state TEXT,
  price_bucket TEXT,
  market_timezone TEXT,
  session TEXT,
  extended_hours_included INTEGER,
  bar_anchor TEXT,
  bar_anchor_offset_minutes INTEGER,
  provider TEXT,
  provider_aggregation TEXT,
  semantic_key TEXT,
  schema_version INTEGER NOT NULL DEFAULT 1,
  import_id TEXT,
  event_json TEXT NOT NULL,
  inserted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_historical_events_core ON historical_events(setup_id,direction,timeframe,market_type);
CREATE INDEX IF NOT EXISTS idx_historical_events_exact_context ON historical_events(setup_id,direction,timeframe,ftfc_alignment,stop_model);
CREATE INDEX IF NOT EXISTS idx_historical_events_semantics ON historical_events(market_timezone,session,extended_hours_included,bar_anchor,bar_anchor_offset_minutes,provider_aggregation);
CREATE INDEX IF NOT EXISTS idx_historical_events_symbol_time ON historical_events(symbol,timeframe,signal_timestamp);

CREATE TABLE IF NOT EXISTS historical_imports (
  import_id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  symbol TEXT,
  timeframe TEXT,
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  bars_received INTEGER NOT NULL DEFAULT 0,
  events_written INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'STARTED',
  metadata_json TEXT
);
