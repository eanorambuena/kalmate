import { getNews } from '../../utils/yahoo'
import { getCached, setCache } from '../../utils/cache'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const symbol = query.symbol as string | undefined

  const cacheKey = `news:${symbol || 'all'}`
  const cached = getCached<any>(cacheKey)
  if (cached) return cached

  try {
    const result = await getNews(symbol)
    setCache(cacheKey, result, 300_000)
    return result
  } catch (error: any) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
