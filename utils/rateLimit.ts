const MAX_KEYS = 500
const buckets = new Map<string, number[]>()

// Sliding-window limiter, in-memory. NOTE: on Cloudflare Pages each isolate
// has its own memory — this throttles a burst landing on the same warm
// isolate but is NOT a hard global ceiling across the edge. For a real
// cross-edge limit, also add a Cloudflare Rate Limiting rule on the route
// from the dashboard. This is still strictly better than nothing, and it's
// the same reliability tier utils/cache.ts already accepts for its cache.
export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  let recent = buckets.get(key) || []

  // Remove expired timestamps from the front (O(n) amortized instead of filter's O(n) per request)
  while (recent.length > 0 && now - recent[0]! >= windowMs) {
    recent.shift()
  }

  if (recent.length >= limit) {
    buckets.set(key, recent)
    return true
  }

  recent.push(now)
  if (!buckets.has(key) && buckets.size >= MAX_KEYS) {
    const oldest = buckets.keys().next().value
    if (oldest) buckets.delete(oldest)
  }
  buckets.set(key, recent)
  return false
}
