type NodeSpec = {
  type: string
  data: Record<string, any>
  position?: { x: number; y: number }
}

type EdgeSpec = {
  source: number
  target: number
  sourceHandle: string
  targetHandle: string
}

export type PipelinePlan = {
  nodes: NodeSpec[]
  edges: EdgeSpec[]
}

function parseKeywords(query: string): PipelinePlan {
  const q = query.toLowerCase()
  const symbols = q.match(/[A-Z]{1,5}(?:-[A-Z]{1,5})?/g) || ['AAPL']
  const ticker = symbols[0]
  const useCandles = q.includes('candle') || q.includes('candlestick')
  const useSma = q.includes('sma') || q.includes('moving')
  const useEma = q.includes('ema')
  const useKalman = q.includes('kalman')
  const useRsi = q.includes('rsi') || q.includes('relative')
  const useChart = q.includes('chart')

  const nodes: NodeSpec[] = []
  const edges: EdgeSpec[] = []

  nodes.push({ type: 'symbolInput', data: { symbol: ticker } })
  nodes.push({ type: 'priceFeed', data: {} })

  nodes.push({ type: 'priceFeed', data: {} })
  edges.push({ source: 0, target: 1, sourceHandle: 'source', targetHandle: 'source' })

  let nextIdx = 2
  const outputIdx: number[] = []

  if (useCandles) {
    const candleIdx = nextIdx++
    nodes.push({ type: 'candleChart', data: {} })
    edges.push({ source: 1, target: candleIdx, sourceHandle: 'ohlc', targetHandle: 'seriesA' })
    outputIdx.push(candleIdx)
  }

  if (useSma) {
    const smaIdx = nextIdx++
    const period = parseInt(q.match(/sma(\d+)/i)?.[1] || '20')
    nodes.push({ type: 'smaIndicator', data: { period } })
    edges.push({ source: 1, target: smaIdx, sourceHandle: 'history', targetHandle: 'source' })
    if (outputIdx.length > 0) {
      edges.push({ source: smaIdx, target: outputIdx[0], sourceHandle: 'seriesA', targetHandle: 'seriesB' })
    }
  }

  if (useEma) {
    const emaIdx = nextIdx++
    const period = parseInt(q.match(/ema(\d+)/i)?.[1] || '20')
    nodes.push({ type: 'emaIndicator', data: { period } })
    edges.push({ source: 1, target: emaIdx, sourceHandle: 'history', targetHandle: 'source' })
    if (outputIdx.length > 0) {
      edges.push({ source: emaIdx, target: outputIdx[0], sourceHandle: 'seriesA', targetHandle: 'seriesC' })
    }
  }

  if (useKalman) {
    const kalmanIdx = nextIdx++
    nodes.push({ type: 'kalmanFilter', data: {} })
    edges.push({ source: 1, target: kalmanIdx, sourceHandle: 'history', targetHandle: 'source' })
    if (outputIdx.length > 0) {
      edges.push({ source: kalmanIdx, target: outputIdx[0], sourceHandle: 'seriesA', targetHandle: 'seriesD' })
    }
  }

  if (useRsi) {
    const rsiIdx = nextIdx++
    const period = parseInt(q.match(/rsi(\d+)/i)?.[1] || '14')
    nodes.push({ type: 'rsiIndicator', data: { period } })
    edges.push({ source: 1, target: rsiIdx, sourceHandle: 'history', targetHandle: 'source' })
  }

  if (useChart && !useCandles) {
    const chartIdx = nextIdx++
    nodes.push({ type: 'chartOutput', data: {} })
    edges.push({ source: 1, target: chartIdx, sourceHandle: 'history', targetHandle: 'seriesA' })
  }

  if (!useCandles && !useChart && !useSma && !useEma && !useKalman && !useRsi) {
    const chartIdx = nextIdx++
    nodes.push({ type: 'chartOutput', data: {} })
    edges.push({ source: 1, target: chartIdx, sourceHandle: 'history', targetHandle: 'seriesA' })
  }

  return { nodes, edges }
}

export function useAIPipeline() {
  async function generate(query: string): Promise<PipelinePlan | { error: string }> {
    try {
      const res = await $fetch('/api/generate-pipeline', {
        method: 'POST',
        body: { query },
      })
      if (res.error) return { error: res.error }
      if (res.nodes && res.edges) return res as PipelinePlan
    } catch {}
    return parseKeywords(query)
  }

  return { generate }
}
