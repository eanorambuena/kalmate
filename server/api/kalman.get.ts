import { getHistory } from '../../utils/yahoo'
import { analyzeKalman, cleanHistory } from '../../utils/kalmanAnalysis'
import { getCached, setCache } from '../../utils/cache'

const RANGES = new Set(['3mo', '6mo', '1y', '5y'])

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const symbol = typeof query.symbol === 'string' ? query.symbol.trim().toUpperCase() : ''
  const range = typeof query.range === 'string' && RANGES.has(query.range) ? query.range : '1y'
  const predict = Number.parseInt(String(query.predict ?? '10'), 10)

  if (!symbol) {
    throw createError({ statusCode: 400, statusMessage: 'symbol parameter required' })
  }

  const cacheKey = `kalman:v2:${symbol}:${range}:${predict}`
  const cached = getCached<any>(cacheKey)
  if (cached) return cached

  try {
    const history = await getHistory(symbol, range as any, '1d')
    const { timestamps, prices } = cleanHistory(history ?? [])
    if (prices.length < 10) {
      return { error: 'Not enough historical data', symbol }
    }

    const response = { symbol, timestamps, prices, ...analyzeKalman(prices, predict) }
    setCache(cacheKey, response, 300_000)
    return response
  } catch (error: any) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
