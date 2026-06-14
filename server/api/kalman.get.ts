import { getHistory } from '../../utils/yahoo'
import { runKalmanFilter, calibrateMLE, createDefaultParams } from '../../utils/kalman'
import { getCached, setCache } from '../../utils/cache'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const symbol = query.symbol as string
  const range = (query.range as string) || '1y'
  const predict = parseInt((query.predict as string) || '10', 10)

  if (!symbol) {
    throw createError({ statusCode: 400, statusMessage: 'symbol parameter required' })
  }

  const cacheKey = `kalman:${symbol}:${range}:${predict}`
  const cached = getCached<any>(cacheKey)
  if (cached) return cached

  try {
    const history = await getHistory(symbol, range as any, '1d')
    if (!history || history.length < 10) {
      return { error: 'Not enough historical data', symbol }
    }

    const prices = history.map(h => h.close).filter(p => p > 0)
    const timestamps = history.map(h => h.timestamp).filter((_, i) => prices[i] !== undefined && history[i].close > 0)

    const params = prices.length > 100 ? calibrateMLE(prices) : createDefaultParams()
    const result = runKalmanFilter(prices, params, predict)

    const response = {
      symbol,
      params,
      timestamps,
      prices,
      smoothed: result.smoothed,
      trend: result.trend,
      cycle: result.cycle,
      predicted: result.predicted,
      confidence: result.confidence,
      logLikelihood: result.logLikelihood,
      lastPrice: prices[prices.length - 1],
      predictedPrice: result.predicted[result.predicted.length - 1],
      signal: result.cycle[result.cycle.length - 1] > 0 ? 'overpriced' : 'underpriced',
    }

    setCache(cacheKey, response, 300_000)
    return response
  } catch (error: any) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
