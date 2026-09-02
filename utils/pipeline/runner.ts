import type { PipelineSpec, ExecutionContext, NodeExecutor } from './types.ts'
import { runKalmanFilter, calibrateMLE, createDefaultParams } from '../kalman.ts'
import { calcSMA, calcRSI, calcEMA } from '../indicators.ts'

export const executors: Record<string, NodeExecutor> = {
  currencyInput: async (ctx) => {
    const from = ctx.data.from || 'USD'
    const to = ctx.data.to || 'CLP'
    return { symbol: `${from}${to}=X` }
  },

  symbolInput: async (ctx) => {
    return { symbol: ctx.data.symbol || 'AAPL' }
  },

  priceFeed: async (ctx) => {
    const symbol = ctx.inputs.symbol || ctx.data.symbol || 'AAPL'
    try {
      const res = await fetch(`/api/history?symbol=${symbol}&range=1y&interval=1d`)
      const data = await res.json()
      if (!res.ok) return { price: 0, priceSeries: [], error: data?.statusMessage || `HTTP ${res.status}`, symbol }
      if (!Array.isArray(data)) return { price: 0, priceSeries: [], error: 'Unexpected response format', symbol }
      const prices = data.map(h => h.close).filter(p => p > 0)
      const currentPrice = prices[prices.length - 1]
      return { price: currentPrice, priceSeries: prices, candleSeries: data, symbol }
    } catch (e: any) {
      return { price: 0, priceSeries: [], error: e?.message || 'Fetch failed', symbol }
    }
  },

  chartOutput: async (ctx) => {
    const main = ctx.inputs.mainSeries || ctx.inputs.priceSeries || ctx.inputs.series || null
    const arr = Array.isArray(main) ? main : null
    const lastPrice = arr && arr.length > 0 ? arr[arr.length - 1] : null
    return {
      price: ctx.inputs.price ?? lastPrice,
      mainSeries: arr,
      overlayA: ctx.inputs.overlayA ?? ctx.inputs.seriesB ?? null,
      overlayB: ctx.inputs.overlayB ?? ctx.inputs.seriesC ?? null,
      overlayC: ctx.inputs.overlayC ?? ctx.inputs.seriesD ?? null,
    }
  },

  candleChart: async (ctx) => {
    const candleSeries = ctx.inputs.candleSeries || ctx.inputs.ohlc || ctx.inputs.seriesA || null
    return {
      candleSeries,
      overlayA: ctx.inputs.overlayA ?? ctx.inputs.seriesB ?? null,
      overlayB: ctx.inputs.overlayB ?? ctx.inputs.seriesC ?? null,
      overlayC: ctx.inputs.overlayC ?? ctx.inputs.seriesD ?? null,
    }
  },

  priceDisplay: async (ctx) => {
    return { price: ctx.inputs.price ?? null }
  },

  alertOutput: async (ctx) => {
    return { signal: ctx.inputs.signal, threshold: ctx.data.threshold }
  },

  smaIndicator: async (ctx) => {
    const series = ctx.inputs.priceSeries || ctx.inputs.history || ctx.inputs.source || ctx.data.source || ctx.data.series
    if (!Array.isArray(series) || series.length < 2) {
      return { smaSeries: [], error: 'Need price series' }
    }
    const period = ctx.data.period || 20
    const sma = calcSMA(series, period)
    return { smaSeries: sma }
  },

  rsiIndicator: async (ctx) => {
    const series = ctx.inputs.priceSeries || ctx.inputs.history || ctx.inputs.source || ctx.data.source || ctx.data.series
    if (!Array.isArray(series) || series.length < 2) {
      return { rsiSeries: [], error: 'Need price series' }
    }
    const period = ctx.data.period || 14
    const rsi = calcRSI(series, period)
    const lastRsi = rsi[rsi.length - 1] ?? 50
    return { rsiValue: lastRsi, rsiSeries: rsi }
  },

  emaIndicator: async (ctx) => {
    const series = ctx.inputs.priceSeries || ctx.inputs.history || ctx.inputs.source || ctx.data.source || ctx.data.series
    if (!Array.isArray(series) || series.length < 2) {
      return { emaSeries: [], error: 'Need price series' }
    }
    const period = ctx.data.period || 20
    const ema = calcEMA(series, period)
    return { emaSeries: ema }
  },

  forecastNode: async (ctx) => {
    const series = ctx.inputs.priceSeries || ctx.inputs.history || ctx.inputs.source || ctx.data.source || ctx.data.series
    if (!Array.isArray(series) || series.length < 10) {
      return { forecastSeries: [], error: 'Need at least 10 price points' }
    }
    try {
      const steps = ctx.data.steps || 15
      const params = series.length > 100 ? calibrateMLE(series) : createDefaultParams()
      const result = runKalmanFilter(series, params, steps)
      const lastPrices = series.slice(-10)
      const avgStep = lastPrices.reduce((s, v, i, a) => i > 0 ? s + (v - a[i - 1]) : s, 0) / (lastPrices.length - 1)
      const lastSmoothed = result.smoothed[result.smoothed.length - 1] || series[series.length - 1]
      const forecast: number[] = []
      const confidence: number[] = []
      for (let i = 1; i <= steps; i++) {
        const val = lastSmoothed + avgStep * i
        forecast.push(val)
        const band = val * (0.01 + 0.015 * i)
        confidence.push(band)
      }
      return { forecastSeries: forecast, confidenceSeries: confidence }
    } catch (e: any) {
      return { forecastSeries: [], error: e?.message || 'Forecast error' }
    }
  },

  kalmanFilter: async (ctx) => {
    const series = ctx.inputs.priceSeries || ctx.inputs.history || ctx.inputs.source || ctx.inputs.price
    if (!series) return { smoothed: [], trend: [], signal: 0, error: 'No series input' }
    if (!Array.isArray(series)) return { smoothed: [], trend: [], signal: 0, error: 'Series is not an array' }
    if (series.length < 5) return { smoothed: [], trend: [], signal: 0, error: `Series too short: ${series.length}` }
    try {
      const params = series.length > 100 ? calibrateMLE(series) : createDefaultParams()
      const result = runKalmanFilter(series, params, 5)
      const lastCycle = result.cycle[result.cycle.length - 1] || 0
      return {
        smoothed: result.smoothed,
        trend: result.trend,
        cycle: result.cycle,
        signal: lastCycle > 0 ? 1 : -1,
      }
    } catch (e: any) {
      return { smoothed: [], trend: [], signal: 0, error: e?.message || 'Kalman error' }
    }
  },

  mathOp: async (ctx) => {
    const a = ctx.inputs.operandA ?? ctx.data.operandA ?? 0
    const b = ctx.inputs.operandB ?? ctx.data.operandB ?? 0
    const op = ctx.data.op || '+'
    const isArrayA = Array.isArray(a)
    const isArrayB = Array.isArray(b)
    if (isArrayA || isArrayB) {
      const arrA = isArrayA ? a : []
      const arrB = isArrayB ? b : []
      const len = Math.max(arrA.length, arrB.length)
      const result: number[] = []
      for (let i = 0; i < len; i++) {
        const va = i < arrA.length ? arrA[i] : arrB[arrB.length - 1]
        const vb = i < arrB.length ? arrB[i] : arrA[arrA.length - 1]
        switch (op) {
          case '+': result.push(va + vb); break
          case '-': result.push(va - vb); break
          case '*': result.push(va * vb); break
          case '/': result.push(vb !== 0 ? va / vb : 0); break
          default: result.push(va + vb)
        }
      }
      return { scalar: result, a: arrA[arrA.length - 1], b: arrB[arrB.length - 1], op }
    }
    const va = typeof a === 'number' ? a : (Array.isArray(a) ? a[a.length - 1] : 0)
    const vb = typeof b === 'number' ? b : (Array.isArray(b) ? b[b.length - 1] : 0)
    let result: number
    switch (op) {
      case '+': result = va + vb; break
      case '-': result = va - vb; break
      case '*': result = va * vb; break
      case '/': result = vb !== 0 ? va / vb : 0; break
      default: result = va + vb
    }
    return { scalar: result, a: va, b: vb, op }
  },

  scalarInput: async (ctx) => {
    return { scalar: ctx.data.value ?? 1 }
  },

  portfolioInput: async (ctx) => {
    const weights = Array.isArray(ctx.data.weights) ? ctx.data.weights : []
    const operandKeys = Object.keys(ctx.inputs)
      .filter(k => /^operand[A-Z]$/i.test(k))
      .sort()
    let sum = 0
    let totalWeight = 0
    operandKeys.forEach((key) => {
      const val = ctx.inputs[key]
      const idx = key.toUpperCase().charCodeAt(key.length - 1) - 65
      const weight = weights[idx] ?? 1
      const v = typeof val === 'number' ? val : (Array.isArray(val) ? val[val.length - 1] : 0)
      sum += v * weight
      totalWeight += weight
    })
    return { scalar: totalWeight > 0 ? sum / totalWeight : 0 }
  },

  newsOutput: async (ctx) => {
    const symbol = ctx.inputs.symbol || ctx.data.symbol || 'AAPL'
    try {
      const res = await fetch(`/api/news?symbol=${symbol}`)
      if (!res.ok) return { news: [], latest: '-', count: 0, error: `HTTP ${res.status}` }
      const articles = await res.json()
      if (!Array.isArray(articles)) return { news: [], latest: '-', count: 0, error: 'Unexpected format' }
      if (articles.length === 0) return { news: [], latest: 'No recent news', count: 0 }
      const headlines = articles.slice(0, 5).map(a => a.title || 'No title')
      return {
        count: articles.length,
        latest: headlines[0],
        headlines,
        symbol,
      }
    } catch (e: any) {
      return { news: [], latest: '-', count: 0, error: e?.message || 'Fetch failed' }
    }
  },
}

export async function executePipeline(spec: PipelineSpec): Promise<Record<string, any>> {
  const nodeMap = new Map(spec.nodes.map(n => [n.id, n]))
  const edgeMap = new Map(spec.edges.map(e => [e.target, e]))
  const results: Record<string, any> = {}

  const adj = new Map<string, string[]>()
  const inDeg = new Map<string, number>()
  for (const n of spec.nodes) {
    adj.set(n.id, [])
    inDeg.set(n.id, 0)
  }
  for (const e of spec.edges) {
    adj.get(e.source)?.push(e.target)
    inDeg.set(e.target, (inDeg.get(e.target) || 0) + 1)
  }

  const queue: string[] = []
  for (const [id, deg] of inDeg) {
    if (deg === 0) queue.push(id)
  }

  while (queue.length > 0) {
    const id = queue.shift()!
    const node = nodeMap.get(id)!
    const executor = executors[node.type]

    const inputs: Record<string, any> = {}
    for (const edge of spec.edges) {
      if (edge.target === id) {
        const srcResult = results[edge.source]
        if (srcResult) {
          if (edge.sourceHandle && edge.targetHandle) {
            inputs[edge.targetHandle] = srcResult[edge.sourceHandle]
          } else {
            Object.assign(inputs, srcResult)
          }
        }
      }
    }

    if (executor) {
      try {
        results[id] = await executor({ nodeId: id, inputs, data: node.data })
      } catch {
        results[id] = {}
      }
    }

    for (const next of adj.get(id) || []) {
      const deg = inDeg.get(next)! - 1
      inDeg.set(next, deg)
      if (deg === 0) queue.push(next)
    }
  }

  return results
}
