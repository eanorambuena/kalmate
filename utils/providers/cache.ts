// Read-through cache over any Store. Fresh entry -> return. Otherwise fetch
// upstream and store. If upstream fails, a stale entry is served; if there is
// none, the error propagates. Callers never know which path answered.
import type { Store, PutOptions } from './store.ts'

export async function cached<T>(store: Store, key: string, opts: PutOptions, fetcher: () => Promise<T>): Promise<T> {
  const now = Date.now()
  const entry = await store.get<T>(key)
  if (entry && entry.expiresAt > now) return entry.value
  try {
    const fresh = await fetcher()
    await store.put(key, fresh, opts)
    return fresh
  } catch (err) {
    if (entry) return entry.value
    throw err
  }
}
