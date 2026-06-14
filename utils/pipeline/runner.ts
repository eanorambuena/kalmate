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
      if (!res.ok) return { price: 0, history: [], error: data?.statusMessage || `HTTP ${res.status}`, symbol }
      if (!Array.isArray(data)) return { price: 0, history: [], error: 'Unexpected response format', symbol }
      const prices = data.map(h => h.close).filter(p => p > 0)
      const currentPrice = prices[prices.length - 1]
      return { price: currentPrice, history: prices, symbol }
    } catch (e: any) {
      return { price: 0, history: [], error: e?.message || 'Fetch failed', symbol }
    }
  },

  chartOutput: async (ctx) => {
    return {
      price: ctx.inputs.price ?? null,
      history: ctx.inputs.history ?? ctx.inputs.series ?? null,
      series: ctx.inputs.series ?? ctx.inputs.history ?? null,
      smoothed: ctx.inputs.smoothed ?? null,
      trend: ctx.inputs.trend ?? null,
      overlay1: ctx.inputs.overlay1 ?? ctx.inputs.sma ?? ctx.inputs.ema ?? ctx.inputs.smoothed ?? null,
      overlay2: ctx.inputs.overlay2 ?? ctx.inputs.forecast ?? null,
      overlay3: ctx.inputs.overlay3 ?? ctx.inputs.trend ?? null,
      sma: ctx.inputs.sma ?? null,
      ema: ctx.inputs.ema ?? null,
      forecast: ctx.inputs.forecast ?? null,
    }
  },

  priceDisplay: async (ctx) => {
    return { price: ctx.inputs.price ?? null }
  },

  alertOutput: async (ctx) => {
    return { signal: ctx.inputs.signal, threshold: ctx.data.threshold }
  },

  smaIndicator: async (ctx) => {
    const series = ctx.inputs.series || ctx.inputs.history || ctx.data.series
    if (!Array.isArray(series) || series.length < 2) {
      return { sma: [], error: 'Need price series' }
    }
    const period = ctx.data.period || 20
    const sma = calcSMA(series, period)
    return { sma }
  },

  rsiIndicator: async (ctx) => {
    const series = ctx.inputs.series || ctx.inputs.history || ctx.data.series
    if (!Array.isArray(series) || series.length < 2) {
      return { rsi: [], error: 'Need price series' }
    }
    const period = ctx.data.period || 14
    const rsi = calcRSI(series, period)
    const lastRsi = rsi[rsi.length - 1] ?? 50
    return { rsi: lastRsi, rsi_history: rsi }
  },

  emaIndicator: async (ctx) => {
    const series = ctx.inputs.series || ctx.inputs.history || ctx.data.series
    if (!Array.isArray(series) || series.length < 2) {
      return { ema: [], error: 'Need price series' }
    }
    const period = ctx.data.period || 20
    const ema = calcEMA(series, period)
    return { ema }
  },

  forecastNode: async (ctx) => {
    const series = ctx.inputs.series || ctx.inputs.history || ctx.data.series
    if (!Array.isArray(series) || series.length < 10) {
      return { forecast: [], error: 'Need at least 10 price points' }
    }
    try {
      const steps = ctx.data.steps || 15
      const params = series.length > 100 ? calibrateMLE(series) : createDefaultParams()
      const result = runKalmanFilter(series, params, steps)
      const lastPrices = series.slice(-10)
      const avgStep = lastPrices.reduce((s, v, i, a) => i > 0 ? s + (v - a[i - 1]) : s, 0) / (lastPrices.length - 1)
      const trend = result.trend
      const lastTrend = trend[trend.length - 1] || series[series.length - 1]
      const lastSmoothed = result.smoothed[result.smoothed.length - 1] || series[series.length - 1]
      const forecast: number[] = []
      const confidence: number[] = []
      for (let i = 1; i <= steps; i++) {
        const val = lastSmoothed + avgStep * i
        forecast.push(val)
        const band = val * (0.01 + 0.015 * i)
        confidence.push(band)
      }
      return { forecast, confidence }
    } catch (e: any) {
      return { forecast: [], error: e?.message || 'Forecast error' }
    }
  },

  kalmanFilter: async (ctx) => {
    const series = ctx.inputs.series || ctx.inputs.history || ctx.data.series || ctx.inputs.price
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
    const a = ctx.inputs.a ?? ctx.data.a ?? 0
    const b = ctx.inputs.b ?? ctx.data.b ?? 0
    const va = typeof a === 'number' ? a : (Array.isArray(a) ? a[a.length - 1] : 0)
    const vb = typeof b === 'number' ? b : (Array.isArray(b) ? b[b.length - 1] : 0)
    const op = ctx.data.op || '+'
    let result: number
    switch (op) {
      case '+': result = va + vb; break
      case '-': result = va - vb; break
      case '*': result = va * vb; break
      case '/': result = vb !== 0 ? va / vb : 0; break
      default: result = va + vb
    }
    return { result, a: va, b: vb, op }
  },

  scalarInput: async (ctx) => {
    return { value: ctx.data.value ?? 1 }
  },

  portfolioInput: async (ctx) => {
    const weights = Array.isArray(ctx.data.weights) ? ctx.data.weights : []
    let sum = 0
    let totalWeight = 0
    for (const [key, val] of Object.entries(ctx.inputs)) {
      const idx = parseInt(key.replace('in', ''))
      const weight = weights[idx] ?? 1
      const v = typeof val === 'number' ? val : (Array.isArray(val) ? val[val.length - 1] : 0)
      sum += v * weight
      totalWeight += weight
    }
    return { result: totalWeight > 0 ? sum / totalWeight : 0 }
  },

  newsOutput: async (ctx) => {
    const symbol = ctx.inputs.symbol || ctx.data.symbol || 'AAPL'
    try {
      const res = await fetch(`/api/news?symbol=${symbol}`)
      if (!res.ok) return { news: [], latest: '-', count: 0, error: `HTTP ${res.status}` }
      const articles = await res.json()
      if (!Array.isArray(articles)) return { news: [], latest: '-', count: 0, error: 'Unexpected format' }
      if (articles.length === 0) return { news: [], latest: 'Sin noticias recientes', count: 0 }
      const headlines = articles.slice(0, 5).map(a => a.title || 'Sin título')
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
        const fromType = nodeMap.get(edge.source)?.type
        if (fromType === 'symbolInput') {
          inputs.symbol = nodeMap.get(edge.source)?.data?.symbol
        }
        const srcResult = results[edge.source]
        if (srcResult) {
          Object.assign(inputs, srcResult)
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
