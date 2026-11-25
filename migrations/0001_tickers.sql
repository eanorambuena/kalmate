-- Resolved tickers. A row is written only after a successful lookup in any API.
CREATE TABLE IF NOT EXISTS tickers (
  symbol TEXT PRIMARY KEY,
  cik TEXT,
  name TEXT,
  exchange TEXT,
  source TEXT NOT NULL,
  last_ok_at TEXT NOT NULL
);
