// Persistent ticker cache backed by Cloudflare D1 (binding: TICKERS_DB).
// Every function degrades to a no-op when the binding is missing, so the app
// keeps working in local dev and before the database is created.

export interface TickerRecord {
  symbol: string
  cik?: string | null
  name?: string | null
  exchange?: string | null
  source: string
}

export interface D1Like {
  prepare(sql: string): {
    bind(...args: unknown[]): {
      first<T = unknown>(): Promise<T | null>
      run(): Promise<unknown>
    }
  }
}

export function tickerDb(event: { context?: any }): D1Like | null {
  const db = event?.context?.cloudflare?.env?.TICKERS_DB
  return db && typeof db.prepare === 'function' ? db : null
}

export async function getStoredTicker(db: D1Like | null, symbol: string): Promise<TickerRecord | null> {
  if (!db) return null
  try {
    return await db.prepare('SELECT symbol, cik, name, exchange, source FROM tickers WHERE symbol = ?')
      .bind(symbol.toUpperCase()).first<TickerRecord>()
  } catch {
    return null
  }
}

export async function saveTicker(db: D1Like | null, rec: TickerRecord): Promise<void> {
  if (!db) return
  try {
    await db.prepare(
      `INSERT INTO tickers (symbol, cik, name, exchange, source, last_ok_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(symbol) DO UPDATE SET cik = excluded.cik, name = excluded.name,
         exchange = excluded.exchange, source = excluded.source, last_ok_at = excluded.last_ok_at`,
    ).bind(rec.symbol.toUpperCase(), rec.cik ?? null, rec.name ?? null, rec.exchange ?? null,
      rec.source, new Date().toISOString()).run()
  } catch {
    // Persisting is best-effort; the lookup result is still returned.
  }
}
