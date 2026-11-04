// Compatibility wrapper: the cache now lives in utils/data (Store + cached).
import type { D1Like } from './tickerStore.ts'
import { d1Store } from './providers/store.ts'
import { cached } from './providers/cache.ts'

export interface CacheOptions {
  source: string
  ttlMs: number
  maxBytes?: number
}

export function cachedFetch<T>(db: D1Like | null, key: string, opts: CacheOptions, fetcher: () => Promise<T>): Promise<T> {
  return cached(d1Store(db), key, opts, fetcher)
}
