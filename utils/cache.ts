const MAX_SIZE = 100
const cache = new Map<string, { data: any; expiry: number }>()

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiry) {
    cache.delete(key)
    return null
  }
  return entry.data as T
}

export function setCache(key: string, data: any, ttlMs: number) {
  if (cache.has(key)) {
    cache.set(key, { data, expiry: Date.now() + ttlMs })
    return
  }
  while (cache.size >= MAX_SIZE) {
    const oldest = cache.keys().next().value
    if (oldest) cache.delete(oldest)
  }
  cache.set(key, { data, expiry: Date.now() + ttlMs })
}
