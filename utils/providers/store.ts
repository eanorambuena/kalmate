// Storage port. Callers depend on this interface only: D1 in production,
// an in-memory map in tests or when no database is bound.
import type { D1Like } from '../tickerStore.ts'

export interface StoredEntry<T> {
  value: T
  expiresAt: number
}

export interface PutOptions {
  source: string
  ttlMs: number
  /** Skip payloads above this size (D1 rows are capped near 2 MB). */
  maxBytes?: number
}

export interface Store {
  get<T>(key: string): Promise<StoredEntry<T> | null>
  put<T>(key: string, value: T, opts: PutOptions): Promise<void>
}

export function d1Store(db: D1Like | null): Store {
  return {
    async get<T>(key: string) {
      if (!db) return null
      try {
        const row = await db.prepare('SELECT payload, expires_at FROM api_cache WHERE key = ?')
          .bind(key).first<{ payload: string; expires_at: number }>()
        return row ? { value: JSON.parse(row.payload) as T, expiresAt: row.expires_at } : null
      } catch { return null }
    },
    async put<T>(key: string, value: T, opts: PutOptions) {
      if (!db) return
      try {
        const payload = JSON.stringify(value)
        if (payload.length > (opts.maxBytes ?? 1_500_000)) return
        const now = Date.now()
        await db.prepare(
          `INSERT INTO api_cache (key, source, payload, fetched_at, expires_at) VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(key) DO UPDATE SET source = excluded.source, payload = excluded.payload,
             fetched_at = excluded.fetched_at, expires_at = excluded.expires_at`,
        ).bind(key, opts.source, payload, now, now + opts.ttlMs).run()
      } catch { /* best-effort */ }
    },
  }
}

export function memoryStore(): Store {
  const map = new Map<string, StoredEntry<unknown>>()
  return {
    async get<T>(key: string) {
      return (map.get(key) as StoredEntry<T> | undefined) ?? null
    },
    async put<T>(key: string, value: T, opts: PutOptions) {
      map.set(key, { value, expiresAt: Date.now() + opts.ttlMs })
    },
  }
}
