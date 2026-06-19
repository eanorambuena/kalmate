import { getQuote, getQuotes } from '../../utils/yahoo'
import { getCached, setCache } from '../../utils/cache'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const symbols = (query.symbols || query.symbol) as string | undefined

  if (!symbols) {
    throw createError({ statusCode: 400, statusMessage: 'symbol or symbols parameter required' })
  }

  const cacheKey = `quote:${symbols}`
  const cached = getCached<any>(cacheKey)
  if (cached) return cached

  try {
    const symbolList = symbols.split(',').map(s => s.trim()).filter(Boolean)
    const result = symbolList.length === 1
      ? await getQuote(symbolList[0])
      : await getQuotes(symbolList)
    setCache(cacheKey, result, 60_000)
    return result
  } catch (error: any) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
