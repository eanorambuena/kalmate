import { getFundamentals } from '../../utils/yahoo'
import { getCached, setCache } from '../../utils/cache'
import { isRateLimited } from '../../utils/rateLimit'

const RATE_LIMIT = 30
const RATE_WINDOW_MS = 60_000

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const symbol = query.symbol as string | undefined

  if (!symbol) {
    throw createError({ statusCode: 400, statusMessage: 'symbol parameter required' })
  }

  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  if (isRateLimited(`fundamentals:${ip}`, RATE_LIMIT, RATE_WINDOW_MS)) {
    throw createError({ statusCode: 429, statusMessage: 'Too many requests. Please wait before requesting more fundamentals data.' })
  }

  const cacheKey = `fundamentals:${symbol}`
  const cached = getCached<any>(cacheKey)
  if (cached) return cached

  try {
    const result = await getFundamentals(symbol)
    // Income statements only change quarterly — cache for a day so we're
    // not hammering Yahoo's unofficial endpoint on every pipeline run.
    setCache(cacheKey, result, 24 * 60 * 60_000)
    return result
  } catch (error: any) {
    console.error(`[fundamentals] ${symbol}:`, error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch fundamentals data' })
  }
})
