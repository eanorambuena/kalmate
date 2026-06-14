import type { PipelineSpec, ExecutionContext, NodeExecutor } from './types'
import { getHistory } from '../yahoo'
import { runKalmanFilter, calibrateMLE, createDefaultParams } from '../kalman'

const executors: Record<string, NodeExecutor> = {
  priceFeed: async (ctx) => {
    const symbol = ctx.inputs.symbol || ctx.data.symbol || 'AAPL'
    try {
      const history = await getHistory(symbol, '1y', '1d')
      const prices = history.map(h => h.close).filter(p => p > 0)
      const currentPrice = prices[prices.length - 1]
      return { price: currentPrice, history: prices }
    } catch {
      return { price: 0, history: [] }
    }
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
