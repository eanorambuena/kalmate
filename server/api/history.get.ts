import { getHistory } from '../../utils/yahoo'
import { getCached, setCache } from '../../utils/cache'
import { tickerDb } from '../../utils/tickerStore'
import { cachedFetch } from '../../utils/apiCache'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const symbol = query.symbol as string | undefined
  const range = (query.range as '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '5y') || '1mo'
  const interval = (query.interval as '1m' | '5m' | '15m' | '1h' | '1d') || '1d'

  if (!symbol) {
    throw createError({ statusCode: 400, statusMessage: 'symbol parameter required' })
  }

  const cacheKey = `history:${symbol}:${range}:${interval}`
  const cached = getCached<any>(cacheKey)
  if (cached) return cached

  try {
    // Daily bars change once a day; intraday bars refresh more often.
    const ttlMs = interval === '1d' ? 6 * 3_600_000 : 5 * 60_000
    const result = await cachedFetch(tickerDb(event), `yahoo:${cacheKey}`, { source: 'yahoo', ttlMs, maxBytes: 1_800_000 },
      () => getHistory(symbol, range, interval))
    setCache(cacheKey, result, 300_000)
    return result
  } catch (error: any) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
