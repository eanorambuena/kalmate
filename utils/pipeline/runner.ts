import type { PipelineSpec, ExecutionContext, NodeExecutor } from './types'
import { runKalmanFilter, calibrateMLE, createDefaultParams } from '../kalman'
import { calcSMA, calcRSI } from '../indicators'

const executors: Record<string, NodeExecutor> = {
  symbolInput: async (ctx) => {
    return { symbol: ctx.data.symbol || 'AAPL' }
  },

  priceFeed: async (ctx) => {
    const symbol = ctx.inputs.symbol || ctx.data.symbol || 'AAPL'
    try {
      const res = await fetch(`/api/history?symbol=${symbol}&range=1y&interval=1d`)
      const data = await res.json()
      if (!res.ok) return { price: 0, history: [], error: data?.statusMessage || `HTTP ${res.status}` }
      if (!Array.isArray(data)) return { price: 0, history: [], error: 'Unexpected response format' }
      const prices = data.map(h => h.close).filter(p => p > 0)
      const currentPrice = prices[prices.length - 1]
      return { price: currentPrice, history: prices }
    } catch (e: any) {
      return { price: 0, history: [], error: e?.message || 'Fetch failed' }
    }
  },

  chartOutput: async (ctx) => {
    return { price: ctx.inputs.price ?? null, history: ctx.inputs.history ?? null, smoothed: ctx.inputs.smoothed ?? null, trend: ctx.inputs.trend ?? null }
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

  newsOutput: async (ctx) => {
    const symbol = ctx.inputs.symbol || ctx.data.symbol || 'AAPL'
    try {
      const res = await fetch(`/api/news?symbol=${symbol}`)
      if (!res.ok) return { news: [], error: `HTTP ${res.status}` }
      const articles = await res.json()
      if (!Array.isArray(articles)) return { news: [], error: 'Unexpected format' }
      const headlines = articles.slice(0, 5).map(a => a.title || 'No title')
      return {
        count: articles.length,
        latest: headlines[0] || '-',
        headlines,
      }
    } catch (e: any) {
      return { news: [], error: e?.message || 'Fetch failed' }
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
