import { checkAlerts } from '../../../utils/alerts'
import { getCached, setCache } from '../../../utils/cache'

export default defineEventHandler(async (event) => {
  const cacheKey = 'alerts-check'
  const cached = getCached<any>(cacheKey)
  if (cached) return cached

  try {
    const results = await checkAlerts(event.context.cloudflare?.env)
    const body = {
      checked: results.length,
      triggered: results.filter(r => r.triggered).length,
      results,
    }
    setCache(cacheKey, body, 30_000)
    return body
  } catch (error: any) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
