import { nodeDefinitions } from '~/utils/pipeline/nodeDefinitions'

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

let pipeline: any = null
let loading = false
let loaded = false

function buildPrompt(query: string): string {
  const nodeList = nodeDefinitions
    .filter(n => !n.pro)
    .map(n => {
      const ins = n.inputs.map(i => `${i.id}(${i.type})`).join(', ') || 'none'
      const outs = n.outputs.map(o => `${o.id}(${o.type})`).join(', ') || 'none'
      return `  - ${n.type}: "${n.label}" | inputs: [${ins}] | outputs: [${outs}] | desc: ${n.description}`
    })
    .join('\n')

  return `Eres un asistente que genera pipelines financieros. Tienes estos nodos disponibles:
${nodeList}
Cada nodo se identifica por su "type". Los nodos "input" entregan datos, los "process" transforman, los "output" muestran.

Genera un pipeline para: "${query}"

Devuelve SOLO un JSON valido sin markdown, sin explicaciones, con esta estructura:
{
  "nodes": [
    { "type": "symbolInput", "data": { "symbol": "AAPL" } },
    { "type": "priceFeed", "data": {} },
    { "type": "candleChart", "data": {} }
  ],
  "edges": [
    { "source": 0, "target": 1, "sourceHandle": "source", "targetHandle": "source" },
    { "source": 1, "target": 2, "sourceHandle": "ohlc", "targetHandle": "seriesA" }
  ]
}

REGLAS:
- source y target en edges son indices del array nodes (0, 1, 2...)
- sourceHandle debe coincidir con un output id del nodo fuente
- targetHandle debe coincidir con un input id del nodo destino
- Los nodos siempre se conectan en orden logico: inputs -> process -> outputs
- Un nodo symbolInput siempre necesita conectarse a un priceFeed
- Un priceFeed puede conectarse a varios nodos`
}

function parseKeywords(query: string): PipelinePlan {
  const q = query.toLowerCase()
  const symbols = q.match(/[A-Z]{1,5}(?:-[A-Z]{1,5})?/g) || ['AAPL']
  const ticker = symbols[0]
  const useCandles = q.includes('vela') || q.includes('candle') || q.includes('candlestick')
  const useSma = q.includes('sma') || q.includes('media') || q.includes('moving')
  const useEma = q.includes('ema') || q.includes('exponencial')
  const useKalman = q.includes('kalman') || q.includes('filtro')
  const useRsi = q.includes('rsi') || q.includes('relativa')
  const useChart = q.includes('chart') || q.includes('grafic') || q.includes('linea')

  const nodes: NodeSpec[] = []
  const edges: EdgeSpec[] = []

  nodes.push({ type: 'symbolInput', data: { symbol: ticker } })
  nodes.push({ type: 'priceFeed', data: {} })

  let priceIdx = 0, pfIdx = 1

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
  async function loadModel(onProgress?: (pct: number) => void) {
    if (loaded) return
    if (loading) return
    loading = true
    try {
      const { pipeline: p } = await import('@xenova/transformers')
      pipeline = await p('text-generation', 'Xenova/Qwen2-0.5B-Instruct', {
        progress_callback: (p: any) => {
          if (p.status === 'progress' && onProgress) {
            onProgress(Math.round(p.progress * 100))
          }
        },
      })
      loaded = true
    } catch {
      loaded = false
    } finally {
      loading = false
    }
  }

  async function generate(query: string): Promise<PipelinePlan | { error: string }> {
    if (pipeline) {
      const prompt = buildPrompt(query)
      try {
        const output = await pipeline(prompt, {
          max_new_tokens: 512,
          temperature: 0.2,
          do_sample: false,
        })
        const text = (output as any)[0]?.generated_text || ''
        const jsonStr = text.includes('{') ? text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1) : ''
        if (jsonStr) {
          const plan: PipelinePlan = JSON.parse(jsonStr)
          if (plan.nodes && plan.edges) return plan
        }
      } catch {}
    }
    return parseKeywords(query)
  }

  return { loadModel, generate, loading: () => loading, loaded: () => loaded }
}
