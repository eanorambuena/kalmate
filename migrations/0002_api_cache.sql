-- Generic cache for external API responses. Payloads are JSON stored as TEXT
-- (SQLite has no jsonb column type); json_valid() rejects malformed rows.
CREATE TABLE IF NOT EXISTS api_cache (
  key TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  payload TEXT NOT NULL CHECK (json_valid(payload)),
  fetched_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS api_cache_expires ON api_cache (expires_at);
