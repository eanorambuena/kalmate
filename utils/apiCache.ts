// Read-through cache for external API responses, persisted in D1 (TICKERS_DB).
// Order: fresh D1 row -> upstream fetch (then store). If the upstream fails,
// a stale row is served instead of an error. Every D1 call is best-effort.
import type { D1Like } from './tickerStore.ts'

export interface CacheOptions {
  source: string
  ttlMs: number
  /** Refuse to store payloads larger than this (D1 rows are capped near 2 MB). */
  maxBytes?: number
}

const MAX_BYTES = 1_500_000

export async function cachedFetch<T>(
  db: D1Like | null,
  key: string,
  opts: CacheOptions,
  fetcher: () => Promise<T>,
): Promise<T> {
  const now = Date.now()
  let stale: T | null = null

  if (db) {
    try {
      const row = await db.prepare('SELECT payload, expires_at FROM api_cache WHERE key = ?')
        .bind(key).first<{ payload: string; expires_at: number }>()
      if (row) {
        const value = JSON.parse(row.payload) as T
        if (row.expires_at > now) return value
        stale = value
      }
    } catch { /* cache is optional */ }
  }

  try {
    const fresh = await fetcher()
    if (db) await store(db, key, opts, fresh, now)
    return fresh
  } catch (err) {
    if (stale !== null) return stale
    throw err
  }
}

async function store<T>(db: D1Like, key: string, opts: CacheOptions, value: T, now: number): Promise<void> {
  try {
    const payload = JSON.stringify(value)
    if (payload.length > (opts.maxBytes ?? MAX_BYTES)) return
    await db.prepare(
      `INSERT INTO api_cache (key, source, payload, fetched_at, expires_at) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET source = excluded.source, payload = excluded.payload,
         fetched_at = excluded.fetched_at, expires_at = excluded.expires_at`,
    ).bind(key, opts.source, payload, now, now + opts.ttlMs).run()
  } catch { /* best-effort */ }
}
