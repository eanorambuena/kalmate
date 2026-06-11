import { getHistory } from '../../utils/yahoo'
import { getCached, setCache } from '../../utils/cache'

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
    const result = await getHistory(symbol, range, interval)
    setCache(cacheKey, result, 300_000)
    return result
  } catch (error: any) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
