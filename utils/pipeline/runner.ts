import type { PipelineSpec, ExecutionContext, NodeExecutor } from './types.ts'
import { runKalmanFilter, calibrateMLE, createDefaultParams } from '../kalman.ts'
import { calcSMA, calcRSI, calcEMA } from '../indicators.ts'

export const executors: Record<string, NodeExecutor> = {
  currencyInput: async (ctx) => {
    const from = ctx.data.from || 'USD'
    const to = ctx.data.to || 'CLP'
    return { source: `${from}${to}=X` }
  },

  symbolInput: async (ctx) => {
    return { source: ctx.data.symbol || 'AAPL' }
  },

  priceFeed: async (ctx) => {
    const symbol = ctx.inputs.source || ctx.data.symbol || 'AAPL'
    try {
      const res = await fetch(`/api/history?symbol=${symbol}&range=1y&interval=1d`)
      const data = await res.json()
      if (!res.ok) return { source: 0, history: [], error: data?.statusMessage || `HTTP ${res.status}`, symbol }
      if (!Array.isArray(data)) return { source: 0, history: [], error: 'Unexpected response format', symbol }
      const prices = data.map(h => h.close).filter(p => p > 0)
      const currentPrice = prices[prices.length - 1]
      return { source: currentPrice, history: prices, ohlc: data, symbol }
    } catch (e: any) {
      return { source: 0, history: [], error: e?.message || 'Fetch failed', symbol }
    }
  },

  chartOutput: async (ctx) => {
    const main = ctx.inputs.seriesA || ctx.inputs.history || ctx.inputs.series || null
    const arr = Array.isArray(main) ? main : null
    const lastPrice = arr && arr.length > 0 ? arr[arr.length - 1] : null
    return {
      source: ctx.inputs.source ?? ctx.inputs.price ?? lastPrice,
      history: arr,
      series: arr,
      seriesA: arr,
      seriesB: ctx.inputs.seriesB ?? ctx.inputs.overlay1 ?? null,
      seriesC: ctx.inputs.seriesC ?? ctx.inputs.overlay2 ?? null,
      seriesD: ctx.inputs.seriesD ?? ctx.inputs.overlay3 ?? null,
    }
  },

  candleChart: async (ctx) => {
    const ohlc = ctx.inputs.ohlc || ctx.inputs.history || ctx.inputs.seriesA || null
    return {
      ohlc,
      seriesB: ctx.inputs.seriesB ?? null,
      seriesC: ctx.inputs.seriesC ?? null,
      seriesD: ctx.inputs.seriesD ?? null,
    }
  },

  priceDisplay: async (ctx) => {
    return { source: ctx.inputs.source ?? null }
  },

  alertOutput: async (ctx) => {
    return { signal: ctx.inputs.signal, threshold: ctx.data.threshold }
  },

  smaIndicator: async (ctx) => {
    const series = ctx.inputs.history || ctx.inputs.source || ctx.data.source || ctx.data.series
    if (!Array.isArray(series) || series.length < 2) {
      return { seriesA: [], error: 'Need price series' }
    }
    const period = ctx.data.period || 20
    const sma = calcSMA(series, period)
    return { seriesA: sma }
  },

  rsiIndicator: async (ctx) => {
    const series = ctx.inputs.history || ctx.inputs.source || ctx.data.source || ctx.data.series
    if (!Array.isArray(series) || series.length < 2) {
      return { seriesA: [], error: 'Need price series' }
    }
    const period = ctx.data.period || 14
    const rsi = calcRSI(series, period)
    const lastRsi = rsi[rsi.length - 1] ?? 50
    return { seriesA: lastRsi, rsi_history: rsi }
  },

  emaIndicator: async (ctx) => {
    const series = ctx.inputs.history || ctx.inputs.source || ctx.data.source || ctx.data.series
    if (!Array.isArray(series) || series.length < 2) {
      return { seriesA: [], error: 'Need price series' }
    }
    const period = ctx.data.period || 20
    const ema = calcEMA(series, period)
    return { seriesA: ema }
  },

  forecastNode: async (ctx) => {
    const series = ctx.inputs.history || ctx.inputs.source || ctx.data.source || ctx.data.series
    if (!Array.isArray(series) || series.length < 10) {
      return { seriesA: [], error: 'Need at least 10 price points' }
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
      return { seriesA: forecast, seriesB: confidence }
    } catch (e: any) {
      return { seriesA: [], error: e?.message || 'Forecast error' }
    }
  },

  kalmanFilter: async (ctx) => {
    const series = ctx.inputs.history || ctx.inputs.source || ctx.data.source || ctx.inputs.price
    if (!series) return { seriesA: [], seriesB: [], signal: 0, error: 'No series input' }
    if (!Array.isArray(series)) return { seriesA: [], seriesB: [], signal: 0, error: 'Series is not an array' }
    if (series.length < 5) return { seriesA: [], seriesB: [], signal: 0, error: `Series too short: ${series.length}` }
    try {
      const params = series.length > 100 ? calibrateMLE(series) : createDefaultParams()
      const result = runKalmanFilter(series, params, 5)
      const lastCycle = result.cycle[result.cycle.length - 1] || 0
      return {
        seriesA: result.smoothed,
        seriesB: result.trend,
        cycle: result.cycle,
        signal: lastCycle > 0 ? 1 : -1,
      }
    } catch (e: any) {
      return { seriesA: [], seriesB: [], signal: 0, error: e?.message || 'Kalman error' }
    }
  },

  mathOp: async (ctx) => {
    const a = ctx.inputs.sourceA ?? ctx.data.sourceA ?? 0
    const b = ctx.inputs.sourceB ?? ctx.data.sourceB ?? 0
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
      return { source: result, seriesA: result, a: arrA[arrA.length - 1], b: arrB[arrB.length - 1], op }
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
    return { source: result, a: va, b: vb, op }
  },

  scalarInput: async (ctx) => {
    return { source: ctx.data.value ?? 1 }
  },

  portfolioInput: async (ctx) => {
    const weights = Array.isArray(ctx.data.weights) ? ctx.data.weights : []
    let sum = 0
    let totalWeight = 0
    for (const [key, val] of Object.entries(ctx.inputs)) {
      const idx = parseInt(key.replace('source', ''))
      const weight = weights[idx] ?? 1
      const v = typeof val === 'number' ? val : (Array.isArray(val) ? val[val.length - 1] : 0)
      sum += v * weight
      totalWeight += weight
    }
    return { source: totalWeight > 0 ? sum / totalWeight : 0 }
  },

  newsOutput: async (ctx) => {
    const symbol = ctx.inputs.source || ctx.data.symbol || 'AAPL'
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
