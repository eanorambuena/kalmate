import type { PipelineSpec, ExecutionContext, NodeExecutor } from './types'
import { runKalmanFilter, calibrateMLE, createDefaultParams } from '../kalman'

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
    return { price: ctx.inputs.price ?? null, smoothed: ctx.inputs.smoothed ?? null, trend: ctx.inputs.trend ?? null }
  },

  priceDisplay: async (ctx) => {
    return { price: ctx.inputs.price ?? null }
  },

  alertOutput: async (ctx) => {
    return { signal: ctx.inputs.signal, threshold: ctx.data.threshold }
  },

  kalmanFilter: async (ctx) => {
    const series = ctx.inputs.series
    if (!series || !Array.isArray(series) || series.length < 5) {
      return { smoothed: [], trend: [], signal: 0 }
    }
    const params = series.length > 100 ? calibrateMLE(series) : createDefaultParams()
    const result = runKalmanFilter(series, params, 5)
    const lastCycle = result.cycle[result.cycle.length - 1] || 0
    return {
      smoothed: result.smoothed,
      trend: result.trend,
      signal: lastCycle > 0 ? 1 : -1,
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
