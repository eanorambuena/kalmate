import type { FundamentalsData } from '../../utils/types'
import { getFundamentals } from '../../utils/yahoo'
import { getCached, setCache } from '../../utils/cache'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const symbol = query.symbol as string | undefined

  if (!symbol) {
    throw createError({ statusCode: 400, statusMessage: 'symbol parameter required' })
  }

  if (!/^[A-Z0-9\-\.]{1,10}$/.test(symbol)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid symbol format' })
  }

  const cacheKey = `fundamentals:${symbol.toUpperCase()}`
  const cached = getCached<FundamentalsData>(cacheKey)
  if (cached) return cached

  try {
    const result = await getFundamentals(symbol)
    // Income statements only change quarterly — cache for a day so we're
    // not hammering Yahoo's unofficial endpoint on every pipeline run.
    setCache(cacheKey, result, 24 * 60 * 60_000)
    return result
  } catch (error: any) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
