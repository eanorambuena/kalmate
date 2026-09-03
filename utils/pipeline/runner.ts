import type { PipelineSpec, ExecutionContext, NodeExecutor } from './types.ts'
import { runKalmanFilter, calibrateMLE, createDefaultParams } from '../kalman.ts'
import { calcSMA, calcRSI, calcEMA } from '../indicators.ts'
import { toSeries, toSeriesValues, toSeriesTimestamps, withTimestamps } from '../series.ts'

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
      const candles = data.filter((h: any) => h.close > 0)
      const values = candles.map((h: any) => h.close)
      const timestamps = toSeriesTimestamps(candles, values.length)
      const currentPrice = values[values.length - 1]
      return {
        price: currentPrice,
        priceSeries: withTimestamps(values, timestamps),
        candleSeries: candles,
        symbol,
      }
    } catch (e: any) {
      return { price: 0, priceSeries: [], error: e?.message || 'Fetch failed', symbol }
    }
  },

  chartOutput: async (ctx) => {
    const main = ctx.inputs.mainSeries || ctx.inputs.priceSeries || ctx.inputs.series || null
    const arr = Array.isArray(main) ? main : null
    const lastPrice = arr && arr.length > 0 ? toSeriesValues(arr)[toSeriesValues(arr).length - 1] : null
    return {
      price: ctx.inputs.price ?? lastPrice,
      mainSeries: arr ? toSeries(arr) : null,
      overlayA: ctx.inputs.overlayA != null ? toSeries(ctx.inputs.overlayA) : null,
      overlayB: ctx.inputs.overlayB != null ? toSeries(ctx.inputs.overlayB) : null,
      overlayC: ctx.inputs.overlayC != null ? toSeries(ctx.inputs.overlayC) : null,
      forecastSeries: ctx.inputs.forecastSeries != null ? toSeries(ctx.inputs.forecastSeries) : null,
      confidenceSeries: ctx.inputs.confidenceSeries != null ? toSeries(ctx.inputs.confidenceSeries) : null,
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

  display: async (ctx) => {
    const v = ctx.inputs.value ?? ctx.inputs.price ?? ctx.inputs.scalar ?? null
    return { value: v, price: v }
  },

  priceDisplay: async (ctx) => {
    const v = ctx.inputs.value ?? ctx.inputs.price ?? ctx.inputs.scalar ?? null
    return { value: v, price: v }
  },

  alertOutput: async (ctx) => {
    return { signal: ctx.inputs.signal, threshold: ctx.data.threshold }
  },

  smaIndicator: async (ctx) => {
    const series = ctx.inputs.priceSeries || ctx.inputs.history || ctx.inputs.source || ctx.data.source || ctx.data.series
    const values = toSeriesValues(series)
    if (!Array.isArray(series) || values.length < 2) {
      return { smaSeries: [], error: 'Need price series' }
    }
    const period = ctx.data.period || 20
    const timestamps = toSeriesTimestamps(series, values.length)
    const sma = calcSMA(values, period)
    return { smaSeries: withTimestamps(sma, timestamps) }
  },

  rsiIndicator: async (ctx) => {
    const series = ctx.inputs.priceSeries || ctx.inputs.history || ctx.inputs.source || ctx.data.source || ctx.data.series
    const values = toSeriesValues(series)
    if (!Array.isArray(series) || values.length < 2) {
      return { rsiSeries: [], error: 'Need price series' }
    }
    const period = ctx.data.period || 14
    const timestamps = toSeriesTimestamps(series, values.length)
    const rsi = calcRSI(values, period)
    const lastRsi = rsi[rsi.length - 1] ?? 50
    return { rsiValue: lastRsi, rsiSeries: withTimestamps(rsi, timestamps) }
  },

  emaIndicator: async (ctx) => {
    const series = ctx.inputs.priceSeries || ctx.inputs.history || ctx.inputs.source || ctx.data.source || ctx.data.series
    const values = toSeriesValues(series)
    if (!Array.isArray(series) || values.length < 2) {
      return { emaSeries: [], error: 'Need price series' }
    }
    const period = ctx.data.period || 20
    const timestamps = toSeriesTimestamps(series, values.length)
    const ema = calcEMA(values, period)
    return { emaSeries: withTimestamps(ema, timestamps) }
  },

  forecastNode: async (ctx) => {
    const series = ctx.inputs.priceSeries || ctx.inputs.history || ctx.inputs.source || ctx.data.source || ctx.data.series
    const values = toSeriesValues(series)
    if (!Array.isArray(series) || values.length < 10) {
      return { forecastSeries: [], error: 'Need at least 10 price points' }
    }
    try {
      const steps = ctx.data.steps || 15
      const params = values.length > 100 ? calibrateMLE(values) : createDefaultParams()
      const result = runKalmanFilter(values, params, steps)
      const lastPrices = values.slice(-10)
      const avgStep = lastPrices.reduce((s, v, i, a) => i > 0 ? s + (v - a[i - 1]) : s, 0) / (lastPrices.length - 1)
      const lastSmoothed = result.smoothed[result.smoothed.length - 1] || values[values.length - 1]
      const forecast: number[] = []
      const confidence: number[] = []
      for (let i = 1; i <= steps; i++) {
        const val = lastSmoothed + avgStep * i
        forecast.push(val)
        const band = val * (0.01 + 0.015 * i)
        confidence.push(band)
      }
      const baseTs = toSeriesTimestamps(series, values.length)
      const lastTs = baseTs.length > 0 ? baseTs[baseTs.length - 1] : Date.now()
      const DAY = 86_400_000
      const fcSeries = forecast.map((v, i) => ({ timestamp: lastTs + DAY * i, value: v }))
      const confSeries = confidence.map((v, i) => ({ timestamp: lastTs + DAY * i, value: v }))
      const lastBand = confidence[confidence.length - 1] ?? 0
      const lastFc = forecast[forecast.length - 1] ?? lastSmoothed
      const confPct = lastFc > 0 ? Math.min(99, Math.max(1, Math.round((lastBand / lastFc) * 100))) : 1
      return { forecastSeries: fcSeries, confidenceSeries: confSeries, confidence: confPct }
    } catch (e: any) {
      return { forecastSeries: [], error: e?.message || 'Forecast error' }
    }
  },

  kalmanFilter: async (ctx) => {
    const series = ctx.inputs.priceSeries || ctx.inputs.history || ctx.inputs.source || ctx.inputs.price
    const values = toSeriesValues(series)
    if (!series) return { smoothed: [], trend: [], signal: 0, error: 'No series input' }
    if (!Array.isArray(series)) return { smoothed: [], trend: [], signal: 0, error: 'Series is not an array' }
    if (values.length < 5) return { smoothed: [], trend: [], signal: 0, error: `Series too short: ${values.length}` }
    try {
      const params = values.length > 100 ? calibrateMLE(values) : createDefaultParams()
      const result = runKalmanFilter(values, params, 5)
      const lastCycle = result.cycle[result.cycle.length - 1] || 0
      const timestamps = toSeriesTimestamps(series, values.length)
      return {
        smoothed: withTimestamps(result.smoothed, timestamps),
        trend: withTimestamps(result.trend, timestamps),
        cycle: withTimestamps(result.cycle, timestamps),
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
            if (edge.sourceHandle !== edge.targetHandle && !(edge.sourceHandle in inputs)) {
              inputs[edge.sourceHandle] = srcResult[edge.sourceHandle]
            }
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
