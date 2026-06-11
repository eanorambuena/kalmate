import { searchTickers } from '../../utils/yahoo'
import { getCached, setCache } from '../../utils/cache'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const q = query.q as string | undefined

  if (!q || q.length < 1) {
    throw createError({ statusCode: 400, statusMessage: 'q parameter required (min 1 char)' })
  }

  const cacheKey = `search:${q}`
  const cached = getCached<any>(cacheKey)
  if (cached) return cached

  try {
    const result = await searchTickers(q)
    setCache(cacheKey, result, 600_000)
    return result
  } catch (error: any) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
