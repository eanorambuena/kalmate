import { nodeDefinitions } from '../utils/pipeline/nodeDefinitions.ts'
import { validatePlan } from '../utils/pipeline/plan.ts'

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

/** Intent keywords, matched at the start of a word on the accent-free lowercase query. */
const KEYWORD_MAP: Record<string, string[]> = {
  chart: ['chart', 'linea', 'line', 'grafico', 'graph', 'plot', 'mostrar', 'show', 'display', 'track'],
  candles: ['candle', 'vela', 'candlestick', 'japonesa'],
  sma: ['sma', 'media', 'moving', 'promedio', 'average', 'simple'],
  ema: ['ema', 'exponencial', 'exponential'],
  rsi: ['rsi', 'relativo', 'relative', 'sobrecompra', 'sobreventa', 'overbought', 'oversold'],
  kalman: ['kalman', 'filtro', 'filter', 'suave', 'smooth'],
  forecast: ['forecast', 'prediccion', 'prediction', 'pronostico', 'futuro', 'future'],
  zscore: ['zscore', 'z-score', 'desviacion'],
  value: ['undervalued', 'overvalued', 'fair value', 'valor justo', 'infravalorado', 'caro', 'barato', 'valuation', 'valoracion'],
  fundamentals: ['fundamentals', 'fundamentales', 'eps', 'earnings', 'utilidades', 'book value'],
  compare: ['compare', 'compar', 'vs', 'versus', 'contra'],
}

/** Words that are never tickers, even in uppercase. Keyword words are added below. */
const STOP_WORDS = new Set([
  // English
  'a', 'i', 'an', 'and', 'or', 'of', 'for', 'with', 'the', 'is', 'it', 'in', 'on', 'to', 'at', 'by', 'be',
  'me', 'my', 'do', 'what', 'how', 'are', 'can', 'this', 'that', 'from', 'all', 'last', 'days', 'day',
  'steps', 'step', 'usd', 'ai', 'pe', 'pb', 'eps', 'us', 'o', 'e', 'y',
  // Spanish
  'el', 'la', 'los', 'las', 'de', 'del', 'con', 'en', 'por', 'para', 'un', 'una', 'que', 'es', 'mi',
  'al', 'sin', 'dia', 'dias', 'muestra', 'ver', 'precio', 'precios',
])

for (const words of Object.values(KEYWORD_MAP)) {
  for (const w of words) STOP_WORDS.add(w)
}

const KEYWORD_PATTERNS: Record<string, RegExp[]> = Object.fromEntries(
  Object.entries(KEYWORD_MAP).map(([key, words]) => [
    key,
    words.map(w => new RegExp(`(?<![a-z0-9])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)),
  ]),
)

const MAX_TICKERS = 4
const DEFAULT_TICKER = 'AAPL'
const DEFAULT_STEPS = 30
const DEFAULT_WINDOW = 252

/** Accent-free text: "valoración" becomes "valoracion" so keywords and tokens match. */
function normalizeText(q: string): string {
  return q.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function tokenize(text: string): string[] {
  return text
    .split(/[^A-Za-z0-9.-]+/)
    .map(t => t.replace(/^[.-]+|[.-]+$/g, ''))
    .filter(Boolean)
}

/** 1-5 letters with an optional -XXX or .XX suffix, or up to 12 letters before .SN. */
function isTickerShape(t: string): boolean {
  return /^[A-Za-z]{1,5}(?:-[A-Za-z]{1,5}|\.[A-Za-z]{1,2})?$/.test(t) || /^[A-Za-z]{1,12}\.SN$/i.test(t)
}

function isStop(t: string): boolean {
  return STOP_WORDS.has(t.toLowerCase())
}

/**
 * Tickers in the query, uppercase tokens first. When the query has no uppercase
 * token, the first lowercase tokens that are not stop words or keywords are used.
 */
function findTickers(query: string): { tickers: string[]; explicit: boolean } {
  const tokens = tokenize(normalizeText(query))
  const upper = tokens.filter(t => t === t.toUpperCase() && /[A-Z]/.test(t) && isTickerShape(t) && !isStop(t))
  if (upper.length > 0) {
    return { tickers: unique(upper.map(t => t.toUpperCase())).slice(0, MAX_TICKERS), explicit: true }
  }
  const lower = tokens.filter(t => t === t.toLowerCase() && isTickerShape(t) && !isStop(t))
  return { tickers: unique(lower.map(t => t.toUpperCase())).slice(0, MAX_TICKERS), explicit: false }
}

function unique(xs: string[]): string[] {
  return [...new Set(xs)]
}

function detectFlags(query: string): Set<string> {
  const text = normalizeText(query).toLowerCase()
  const flags = new Set<string>()
  for (const [key, patterns] of Object.entries(KEYWORD_PATTERNS)) {
    if (patterns.some(re => re.test(text))) flags.add(key)
  }
  return flags
}

function isValidQuery(q: string): boolean {
  const s = q.trim()
  if (s.length < 2) return false
  if (detectFlags(s).size > 0) return true
  return findTickers(s).explicit
}

function nodePos(cat: string, col: number): { x: number; y: number } {
  const yOffsets: Record<string, number> = { input: 80, process: 300, output: 520 }
  return { x: 80 + col * 280, y: yOffsets[cat] ?? 150 }
}

function categoryOf(type: string): string {
  return nodeDefinitions.find(d => d.type === type)?.category ?? 'input'
}

const CHART_INPUTS = ['overlayA', 'overlayB', 'overlayC'] as const

function stepsFrom(query: string): number {
  const m = normalizeText(query).toLowerCase().match(/(\d+)\s*(?:dias?|days?|steps?|d)\b/)
  if (!m) return DEFAULT_STEPS
  return Math.min(252, Math.max(5, parseInt(m[1], 10)))
}

function parseKeywords(query: string): PipelinePlan {
  const flags = detectFlags(query)
  const text = normalizeText(query)
  const { tickers } = findTickers(query)
  const symbols = tickers.length ? tickers : [DEFAULT_TICKER]
  const compare = flags.has('compare') && symbols.length >= 2

  const nodes: NodeSpec[] = []
  const edges: EdgeSpec[] = []
  const counter: Record<string, number> = { input: 0, process: 0, output: 0 }

  const add = (type: string, data: Record<string, any> = {}): number => {
    const cat = categoryOf(type)
    nodes.push({ type, data, position: nodePos(cat, counter[cat]++) })
    return nodes.length - 1
  }

  // Adds an edge unless the target input already has one.
  const link = (source: number, sourceHandle: string, target: number, targetHandle: string): boolean => {
    if (edges.some(e => e.target === target && e.targetHandle === targetHandle)) return false
    edges.push({ source, target, sourceHandle, targetHandle })
    return true
  }

  // ---- Sources: one Symbol -> Price Feed chain, or one per ticker when comparing ----
  let symbolIdx: number
  let feedIdx: number
  const rebased: number[] = []
  if (compare) {
    symbols.forEach((symbol, i) => {
      const s = add('symbolInput', { symbol })
      const f = add('priceFeed')
      link(s, 'symbol', f, 'symbol')
      const r = add('normalize', { window: '1Y' })
      link(f, 'priceSeries', r, 'priceSeries')
      rebased.push(r)
      if (i === 0) { symbolIdx = s; feedIdx = f }
    })
  } else {
    symbolIdx = add('symbolInput', { symbol: symbols[0] })
    feedIdx = add('priceFeed')
    link(symbolIdx, 'symbol', feedIdx, 'symbol')
  }

  // ---- Candle chart and the indicators that feed it ----
  const useCandles = !compare && flags.has('candles')
  const candleIdx = useCandles ? add('candleChart') : -1
  if (useCandles) link(feedIdx, 'candleSeries', candleIdx, 'candleSeries')

  if (flags.has('sma')) {
    const period = parseInt(text.match(/sma\s*(\d+)/i)?.[1] || text.match(/\b(\d+)\b/)?.[1] || '20', 10)
    const sma = add('smaIndicator', { period })
    link(feedIdx, 'priceSeries', sma, 'priceSeries')
    if (useCandles) link(sma, 'smaSeries', candleIdx, 'overlayA')
  }

  if (flags.has('ema')) {
    const period = parseInt(text.match(/ema\s*(\d+)/i)?.[1] || '20', 10)
    const ema = add('emaIndicator', { period })
    link(feedIdx, 'priceSeries', ema, 'priceSeries')
    if (useCandles) link(ema, 'emaSeries', candleIdx, 'overlayB')
  }

  // Indicators whose series may be drawn on the chart, with the handle they plot from.
  const plotted: Array<{ node: number; handle: string; secondaryPanel: boolean }> = []

  if (flags.has('rsi')) {
    const period = parseInt(text.match(/rsi\s*(\d+)/i)?.[1] || '14', 10)
    const rsi = add('rsiIndicator', { period })
    link(feedIdx, 'priceSeries', rsi, 'priceSeries')
    plotted.push({ node: rsi, handle: 'rsiSeries', secondaryPanel: true })
  }

  if (flags.has('kalman')) {
    const k = add('kalmanFilter')
    link(feedIdx, 'priceSeries', k, 'priceSeries')
    plotted.push({ node: k, handle: 'smoothed', secondaryPanel: false })
  }

  if (flags.has('forecast')) {
    const fc = add('forecastNode', { model: 'auto', steps: stepsFrom(query) })
    link(feedIdx, 'priceSeries', fc, 'priceSeries')
    plotted.push({ node: fc, handle: 'forecastSeries', secondaryPanel: false })
  }

  if (flags.has('zscore')) {
    const z = add('zScore', { window: DEFAULT_WINDOW })
    link(feedIdx, 'priceSeries', z, 'priceSeries')
    plotted.push({ node: z, handle: 'zSeries', secondaryPanel: true })
  }

  if (flags.has('value')) {
    const fv = add('fairValue')
    link(symbolIdx, 'symbol', fv, 'symbol')
    link(feedIdx, 'priceSeries', fv, 'priceSeries')
    plotted.push({ node: fv, handle: 'fairValueSeries', secondaryPanel: false })
    const d = add('display')
    link(fv, 'upsidePct', d, 'value')
  }

  if (flags.has('fundamentals')) {
    const f = add('fundamentals')
    link(symbolIdx, 'symbol', f, 'symbol')
    const d = add('display')
    link(f, 'eps', d, 'value')
  }

  // ---- The plot: the candle chart, or a line chart (comparison and everything else) ----
  let plot = candleIdx
  if (!useCandles) {
    plot = add('chartOutput')
    if (compare) {
      rebased.forEach((r, i) => link(r, 'normalized', plot, ['mainSeries', ...CHART_INPUTS][i]))
    } else {
      link(feedIdx, 'priceSeries', plot, 'mainSeries')
    }
  }

  // Overlays go to the first free chart input; secondary-panel series only go to a line chart.
  const plotOverlay = (node: number, handle: string, secondaryPanel: boolean) => {
    if (secondaryPanel && useCandles) return
    const free = CHART_INPUTS.find(h => !edges.some(e => e.target === plot && e.targetHandle === h))
    if (free) link(node, handle, plot, free)
  }
  for (const p of plotted) plotOverlay(p.node, p.handle, p.secondaryPanel)

  // ---- Readouts: scalars shown on a Display node ----
  if (flags.has('forecast')) {
    const fc = nodes.findIndex(n => n.type === 'forecastNode')
    const d = add('display')
    link(fc, 'expectedReturn', d, 'value')
  }
  if (flags.has('zscore')) {
    const z = nodes.findIndex(n => n.type === 'zScore')
    const d = add('display')
    link(z, 'zScore', d, 'value')
  }

  return { nodes, edges }
}

export function useAIPipeline() {
  async function generate(query: string): Promise<PipelinePlan | { error: string }> {
    if (!isValidQuery(query)) {
      return { error: 'Describe qué pipeline quieres construir. Ej: "grafico AAPL con SMA20" o "velas BTC"' }
    }
    try {
      const res: any = await $fetch('/api/generate-pipeline', {
        method: 'POST',
        body: { query },
      })
      // Any server failure, or a plan that does not match the node definitions, falls back to the local generator.
      if (res && !res.error && validatePlan(res).ok) return res as PipelinePlan
    } catch {}
    return parseKeywords(query)
  }

  return { generate }
}
