import { checkAlerts } from '../../../utils/alerts'

export default defineEventHandler(async () => {
  try {
    const results = await checkAlerts()
    return {
      checked: results.length,
      triggered: results.filter(r => r.triggered).length,
      results,
    }
  } catch (error: any) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
