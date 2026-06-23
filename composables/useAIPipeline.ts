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

function extractTicker(q: string): string {
  const upper = q.toUpperCase()
  const m = upper.match(/\b[A-Z]{1,5}(?:-[A-Z]{1,5})?\b/)
  return m ? m[0] : 'AAPL'
}

const KEYWORD_MAP: Record<string, string[]> = {
  chart: ['chart', 'linea', 'line', 'grafico', 'graph', 'plot', 'mostrar', 'show', 'display', 'track'],
  candles: ['candle', 'vela', 'candlestick', 'japonesa'],
  sma: ['sma', 'media', 'moving', 'promedio', 'average', 'simple'],
  ema: ['ema', 'exponencial', 'exponential'],
  rsi: ['rsi', 'relativo', 'relative', 'sobrecompra', 'sobreventa', 'overbought', 'oversold'],
  kalman: ['kalman', 'filtro', 'filter', 'suave', 'smooth'],
  forecast: ['forecast', 'prediccion', 'prediction', 'pronostico', 'futuro', 'future'],
}

function detectIntent(q: string): { ticker: string; flags: Set<string> } {
  const lowered = q.toLowerCase()
  const flags = new Set<string>()
  for (const [key, words] of Object.entries(KEYWORD_MAP)) {
    if (words.some(w => lowered.includes(w))) {
      flags.add(key)
    }
  }
  if (lowered.includes('compar') || lowered.includes('compare') || lowered.includes('varios') || lowered.includes('multi')) {
    flags.add('compare')
  }
  return { ticker: extractTicker(q), flags }
}

function isValidQuery(q: string): boolean {
  const s = q.trim()
  if (s.length < 2) return false
  const { flags } = detectIntent(s)
  if (flags.size > 0) return true
  if (extractTicker(s) !== 'AAPL' || /[A-Z]{2,5}/.test(s)) return true
  return false
}

function parseKeywords(query: string): PipelinePlan {
  const { ticker, flags } = detectIntent(query)

  const nodes: NodeSpec[] = []
  const edges: EdgeSpec[] = []

  nodes.push({ type: 'symbolInput', data: { symbol: ticker } })
  nodes.push({ type: 'priceFeed', data: {} })
  edges.push({ source: 0, target: 1, sourceHandle: 'source', targetHandle: 'source' })

  let nextIdx = 2
  const outputIdx: number[] = []

  const useCandles = flags.has('candles')
  const useSma = flags.has('sma')
  const useEma = flags.has('ema')
  const useRsi = flags.has('rsi')
  const useKalman = flags.has('kalman')
  const useForecast = flags.has('forecast')
  const useChart = flags.has('chart') || (!useCandles && !useForecast)

  if (useCandles) {
    const candleIdx = nextIdx++
    nodes.push({ type: 'candleChart', data: {} })
    edges.push({ source: 1, target: candleIdx, sourceHandle: 'ohlc', targetHandle: 'seriesA' })
    outputIdx.push(candleIdx)
  }

  if (useSma) {
    const smaIdx = nextIdx++
    const num = parseInt(query.match(/sma\s*(\d+)/i)?.[1] || query.match(/\b(\d+)\b/)?.[1] || '20')
    nodes.push({ type: 'smaIndicator', data: { period: num } })
    edges.push({ source: 1, target: smaIdx, sourceHandle: 'history', targetHandle: 'source' })
    if (outputIdx.length > 0) {
      edges.push({ source: smaIdx, target: outputIdx[0], sourceHandle: 'seriesA', targetHandle: 'seriesB' })
    }
  }

  if (useEma) {
    const emaIdx = nextIdx++
    const num = parseInt(query.match(/ema\s*(\d+)/i)?.[1] || '20')
    nodes.push({ type: 'emaIndicator', data: { period: num } })
    edges.push({ source: 1, target: emaIdx, sourceHandle: 'history', targetHandle: 'source' })
    if (outputIdx.length > 0) {
      edges.push({ source: emaIdx, target: outputIdx[0], sourceHandle: 'seriesA', targetHandle: 'seriesC' })
    }
  }

  if (useRsi) {
    const rsiIdx = nextIdx++
    const num = parseInt(query.match(/rsi\s*(\d+)/i)?.[1] || '14')
    nodes.push({ type: 'rsiIndicator', data: { period: num } })
    edges.push({ source: 1, target: rsiIdx, sourceHandle: 'history', targetHandle: 'source' })
  }

  if (useKalman) {
    const kalmanIdx = nextIdx++
    nodes.push({ type: 'kalmanFilter', data: {} })
    edges.push({ source: 1, target: kalmanIdx, sourceHandle: 'history', targetHandle: 'source' })
    if (outputIdx.length > 0) {
      edges.push({ source: kalmanIdx, target: outputIdx[0], sourceHandle: 'seriesA', targetHandle: 'seriesD' })
    }
  }

  if (useForecast) {
    const fcIdx = nextIdx++
    const steps = parseInt(query.match(/(\d+)\s*(dia|day|step)/i)?.[1] || '15')
    nodes.push({ type: 'forecastNode', data: { steps } })
    edges.push({ source: 1, target: fcIdx, sourceHandle: 'history', targetHandle: 'source' })
    if (outputIdx.length > 0) {
      edges.push({ source: fcIdx, target: outputIdx[0], sourceHandle: 'seriesA', targetHandle: 'seriesB' })
    }
  }

  if (useChart && !useCandles && !useForecast) {
    const chartIdx = nextIdx++
    nodes.push({ type: 'chartOutput', data: {} })
    edges.push({ source: 1, target: chartIdx, sourceHandle: 'history', targetHandle: 'seriesA' })
  }

  if (!useCandles && !useChart && !useSma && !useEma && !useRsi && !useKalman && !useForecast) {
    const chartIdx = nextIdx++
    nodes.push({ type: 'chartOutput', data: {} })
    edges.push({ source: 1, target: chartIdx, sourceHandle: 'history', targetHandle: 'seriesA' })
  }

  return { nodes, edges }
}

export function useAIPipeline() {
  async function generate(query: string): Promise<PipelinePlan | { error: string }> {
    if (!isValidQuery(query)) {
      return { error: 'Describe qué pipeline quieres construir. Ej: "grafico AAPL con SMA20" o "velas BTC"' }
    }
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
