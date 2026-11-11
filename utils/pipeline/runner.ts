import type { PipelineEdge, PipelineNode, PipelineSpec, ExecutionContext, NodeExecutor, InputMeta, Unit } from './types.ts'
import type { ForecastModel } from '../forecasting.ts'
import { normalizeSeries, toMs, combine, lastValue, formatValue } from './values.ts'
import { nodeDefinitions } from './nodeDefinitions.ts'
import { calcSMA, calcEMA, calcRSI } from '../indicators.ts'
import { localTrendFilter } from '../kalman.ts'
import { rollingZScore, compareToReference, fairValueFromMultiples } from '../valuation.ts'
import { forecastWithBacktest, isForecastModel } from '../forecasting.ts'
import { averageSentiment } from '../sentiment.ts'

type Point = { timestamp: number; value: number }
type Candle = { timestamp: number; open: number; high: number; low: number; close: number }

const DAY = 86_400_000
const MIN_FORECAST_POINTS = 60
const NEWS_HEADLINES = 5
const CHART_HANDLES = ['mainSeries', 'overlayA', 'overlayB', 'overlayC'] as const
const OVERLAY_HANDLES = ['overlayA', 'overlayB', 'overlayC'] as const
const NORMALIZE_DAYS: Record<string, number> = { '1M': 30, '3M': 90, '6M': 180, '1Y': 365, '2Y': 730 }

const isFiniteNumber = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x)

/** A numeric param: clamped to [min, max]; the default when missing or not a finite number. */
function numParam(x: unknown, min: number, max: number, fallback: number, integer = false): number {
  if (!isFiniteNumber(x)) return fallback
  const v = Math.min(max, Math.max(min, x))
  return integer ? Math.floor(v) : v
}

/** A select param: the value when it is one of the options, the default otherwise. */
function choice<T extends string>(x: unknown, options: readonly T[], fallback: T): T {
  return (options as readonly string[]).includes(x as string) ? (x as T) : fallback
}

const lastOf = (s: Point[]): number | null => (s.length ? s[s.length - 1]!.value : null)

/** Non-positive prices cannot be put on a log scale. */
const hasNonPositive = (s: Point[]): boolean => s.some(p => !(p.value > 0))

const todayIso = () => new Date().toISOString().slice(0, 10)

/** Candles from the history route: timestamps to milliseconds, sorted by time. */
function toCandles(input: unknown): Candle[] {
  if (!Array.isArray(input)) return []
  const out: Candle[] = []
  for (const c of input) {
    if (!c || typeof c !== 'object') continue
    const raw = (c as any).timestamp ?? (c as any).t
    const close = (c as any).close
    if (!isFiniteNumber(raw) || !isFiniteNumber(close)) continue
    const pick = (v: unknown) => (isFiniteNumber(v) ? v : close)
    out.push({
      timestamp: toMs(raw),
      open: pick((c as any).open),
      high: pick((c as any).high),
      low: pick((c as any).low),
      close,
    })
  }
  return out.sort((a, b) => a.timestamp - b.timestamp)
}

/** Median gap between the most recent timestamps, used to space forecast steps. */
function medianSpacing(s: Point[]): number {
  const recent = s.slice(-21)
  const gaps: number[] = []
  for (let i = 1; i < recent.length; i++) gaps.push(recent[i]!.timestamp - recent[i - 1]!.timestamp)
  if (!gaps.length) return DAY
  gaps.sort((a, b) => a - b)
  const mid = Math.floor(gaps.length / 2)
  const m = gaps.length % 2 ? gaps[mid]! : (gaps[mid - 1]! + gaps[mid]!) / 2
  return m > 0 ? m : DAY
}

export const executors: Record<string, NodeExecutor> = {
  currencyInput: async (ctx) => {
    const from = String(ctx.data.from || 'USD')
    const to = String(ctx.data.to || 'CLP')
    return { symbol: `${from}${to}=X` }
  },

  symbolInput: async (ctx) => {
    return { symbol: String(ctx.data.symbol ?? '').trim() || 'AAPL' }
  },

  scalarInput: async (ctx) => {
    return { scalar: isFiniteNumber(ctx.data.value) ? ctx.data.value : 1 }
  },

  priceFeed: async (ctx) => {
    const symbol = String(ctx.inputs.symbol || ctx.data.symbol || 'AAPL')
    const qualified = symbol.includes('.') || symbol.includes('=') || symbol.startsWith('^')
    const targets = qualified ? [symbol] : [symbol, `${symbol}.SN`]
    let error = 'Fetch failed'
    for (const target of targets) {
      try {
        const res = await fetch(`/api/history?symbol=${encodeURIComponent(target)}&range=5y&interval=1d`)
        const data = await res.json()
        if (!res.ok) throw new Error(data?.statusMessage || `HTTP ${res.status}`)
        if (!Array.isArray(data)) throw new Error('Unexpected response format')
        const candles = toCandles(data).filter(c => c.close > 0)
        if (!candles.length) throw new Error('No price history for this symbol')
        const priceSeries = candles.map(c => ({ timestamp: c.timestamp, value: c.close }))
        return { price: priceSeries[priceSeries.length - 1]!.value, priceSeries, candleSeries: candles, symbol: target }
      } catch (e: any) {
        error = e?.message || 'Fetch failed'
      }
    }
    return { price: null, priceSeries: [], candleSeries: [], error, symbol }
  },

  smaIndicator: async (ctx) => {
    const period = numParam(ctx.data.period, 2, 400, 20, true)
    const s = normalizeSeries(ctx.inputs.priceSeries)
    if (s.length < period) return { smaSeries: [], last: null, error: `Need at least ${period} price points` }
    const sma = calcSMA(s.map(p => p.value), period)
    const smaSeries = s.slice(period - 1).map((p, i) => ({ timestamp: p.timestamp, value: sma[i + period - 1]! }))
    return { smaSeries, last: lastOf(smaSeries) }
  },

  emaIndicator: async (ctx) => {
    const period = numParam(ctx.data.period, 2, 400, 20, true)
    const s = normalizeSeries(ctx.inputs.priceSeries)
    if (s.length < period) return { emaSeries: [], last: null, error: `Need at least ${period} price points` }
    const ema = calcEMA(s.map(p => p.value), period)
    const emaSeries = s.slice(period - 1).map((p, i) => ({ timestamp: p.timestamp, value: ema[i + period - 1]! }))
    return { emaSeries, last: lastOf(emaSeries) }
  },

  rsiIndicator: async (ctx) => {
    const period = numParam(ctx.data.period, 2, 100, 14, true)
    const s = normalizeSeries(ctx.inputs.priceSeries)
    if (s.length < period + 1) return { rsiSeries: [], rsiValue: null, error: `Need at least ${period + 1} price points` }
    const rsi = calcRSI(s.map(p => p.value), period)
    const rsiSeries = s.slice(period).map((p, i) => ({ timestamp: p.timestamp, value: rsi[i + period]! }))
    return { rsiValue: lastOf(rsiSeries), rsiSeries }
  },

  kalmanFilter: async (ctx) => {
    const s = normalizeSeries(ctx.inputs.priceSeries)
    const smoothing = choice(ctx.data.smoothing, ['responsive', 'balanced', 'smooth'] as const, 'balanced')
    if (s.length < 5) return { smoothed: [], deviation: [], deviationPct: null, signal: 0, error: 'Need at least 5 price points' }
    if (hasNonPositive(s)) return { smoothed: [], deviation: [], deviationPct: null, signal: 0, error: 'Prices must be positive' }
    const values = s.map(p => p.value)
    const { smoothed, deviation } = localTrendFilter(values, smoothing)
    const last = s.length - 1
    return {
      smoothed: s.map((p, i) => ({ timestamp: p.timestamp, value: smoothed[i]! })),
      deviation: s.map((p, i) => ({ timestamp: p.timestamp, value: deviation[i]! })),
      deviationPct: deviation[last]!,
      signal: values[last]! < smoothed[last]! ? 1 : -1,
    }
  },

  zScore: async (ctx) => {
    const window = numParam(ctx.data.window, 20, 1260, 252, true)
    const s = normalizeSeries(ctx.inputs.priceSeries)
    if (s.length < window) return { zSeries: [], zScore: null, error: `Need at least ${window} price points` }
    if (hasNonPositive(s)) return { zSeries: [], zScore: null, error: 'Prices must be positive' }
    const { z } = rollingZScore(s.map(p => p.value), window)
    const zSeries = s.slice(window - 1).map((p, i) => ({ timestamp: p.timestamp, value: z[i + window - 1]! }))
    return { zSeries, zScore: lastOf(zSeries) }
  },

  normalize: async (ctx) => {
    const window = choice(ctx.data.window, ['1M', '3M', '6M', '1Y', '2Y', 'ALL'] as const, '1Y')
    const s = normalizeSeries(ctx.inputs.priceSeries)
    if (!s.length) return { normalized: [], changePct: null, error: 'Need a price series' }
    const lastTs = s[s.length - 1]!.timestamp
    const kept = window === 'ALL' ? s : s.filter(p => p.timestamp >= lastTs - NORMALIZE_DAYS[window]! * DAY)
    if (kept.length < 2) return { normalized: [], changePct: null, error: 'Need at least 2 price points in this window' }
    const first = kept[0]!.value
    if (!(first > 0)) return { normalized: [], changePct: null, error: 'Prices must be positive' }
    return {
      normalized: kept.map(p => ({ timestamp: p.timestamp, value: (p.value / first) * 100 })),
      changePct: kept[kept.length - 1]!.value / first - 1,
    }
  },

  forecastNode: async (ctx) => {
    const steps = numParam(ctx.data.steps, 5, 252, 30, true)
    const model: ForecastModel = isForecastModel(ctx.data.model) ? ctx.data.model : 'auto'
    const s = normalizeSeries(ctx.inputs.priceSeries)
    const empty = { forecastSeries: [], expectedReturn: null, skill: null, hitRate: null, coverage: null, n: 0 }
    if (s.length < MIN_FORECAST_POINTS) {
      return { ...empty, verdict: '', error: `Need at least ${MIN_FORECAST_POINTS} price points to forecast` }
    }
    if (hasNonPositive(s)) return { ...empty, verdict: '', error: 'Prices must be positive' }
    let fit
    try {
      fit = forecastWithBacktest(s.map(p => p.value), steps, model, 16)
    } catch (e: any) {
      return { ...empty, verdict: '', error: e?.message || 'Forecast failed' }
    }
    const { path, backtest } = fit
    const last = s[s.length - 1]!
    const spacing = medianSpacing(s)
    const forecastSeries = [{ timestamp: last.timestamp, value: last.value, lower: last.value, upper: last.value }]
    for (let i = 0; i < steps; i++) {
      forecastSeries.push({
        timestamp: last.timestamp + spacing * (i + 1),
        value: path.values[i]!,
        lower: path.lower[i]!,
        upper: path.upper[i]!,
      })
    }
    const verdict = backtest.n < 4
      ? 'Not enough history to check accuracy'
      : backtest.skill > 0.005
        ? `Beat "no change" by ${(backtest.skill * 100).toFixed(1)}% over ${backtest.n} past forecasts`
        : 'No edge over "no change" on this series'
    return {
      forecastSeries,
      expectedReturn: path.values[steps - 1]! / last.value - 1,
      skill: backtest.skill,
      hitRate: backtest.hitRate,
      coverage: backtest.coverage,
      n: backtest.n,
      verdict,
    }
  },

  fundamentals: async (ctx) => {
    const symbol = ctx.inputs.symbol
    const nulls = {
      eps: null, bookValuePerShare: null, freeCashFlowPerShare: null,
      netIncome: null, freeCashFlow: null, shares: null, coverage: 0,
    }
    if (!symbol) return { ...nulls, error: 'Need a symbol' }
    const asOf = /^\d{4}-\d{2}-\d{2}$/.test(String(ctx.data.asOf ?? '')) ? String(ctx.data.asOf) : todayIso()
    try {
      const res = await fetch(`/api/fundamentals?symbol=${encodeURIComponent(String(symbol))}&asOf=${asOf}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.statusMessage || `HTTP ${res.status}`)
      const num = (x: unknown) => (isFiniteNumber(x) ? x : null)
      return {
        eps: num(data.eps),
        bookValuePerShare: num(data.bookValuePerShare),
        freeCashFlowPerShare: num(data.freeCashFlowPerShare),
        netIncome: num(data.netIncome),
        freeCashFlow: num(data.freeCashFlow),
        shares: num(data.shares),
        coverage: isFiniteNumber(data.coverage) ? data.coverage : 0,
      }
    } catch (e: any) {
      return { ...nulls, error: e?.message || 'Fundamentals fetch failed' }
    }
  },

  fairValue: async (ctx) => {
    const symbol = ctx.inputs.symbol
    const s = normalizeSeries(ctx.inputs.priceSeries)
    const empty: Record<string, any> = { fairValue: null, upsidePct: null, pe: null, pb: null, fairValueSeries: [] }
    if (!symbol) return { ...empty, error: 'Connect a symbol' }
    if (!s.length) return { ...empty, error: 'Connect a price series' }
    try {
      const res = await fetch(`/api/fundamentals/history?symbol=${encodeURIComponent(String(symbol))}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.statusMessage || `HTTP ${res.status}`)
      const fv = fairValueFromMultiples(
        s,
        Array.isArray(data?.points) ? data.points : [],
        data?.current ?? { eps: null, bookValuePerShare: null },
      )
      const out: Record<string, any> = {
        fairValue: fv.fairValue,
        upsidePct: fv.upsidePct,
        pe: fv.pe,
        pb: fv.pb,
        fairValueSeries: fv.fairValueSeries,
        observations: fv.observations,
      }
      if (fv.error) out.error = fv.error
      return out
    } catch (e: any) {
      return { ...empty, error: e?.message || 'Fair value fetch failed' }
    }
  },

  compareReference: async (ctx) => {
    const price = lastOf(normalizeSeries(ctx.inputs.priceSeries))
    const reference = lastValue(ctx.inputs.reference)
    const band = numParam(ctx.data.band, 0, 50, 2) / 100
    if (price == null) {
      return { diffPct: null, label: 'No reference', undervalued: 0, overvalued: 0, error: 'Connect a price series' }
    }
    const cmp = compareToReference(price, reference, band)
    return {
      diffPct: cmp.diffPct,
      label: cmp.label,
      undervalued: cmp.label === 'Below reference' ? 1 : 0,
      overvalued: cmp.label === 'Above reference' ? 1 : 0,
    }
  },

  mathOp: async (ctx) => {
    const a = ctx.inputs.operandA
    const b = ctx.inputs.operandB
    const op = choice(ctx.data.op, ['+', '-', '*', '/'] as const, '+')
    if (a == null || b == null) return { error: 'Connect two inputs' }
    if (op === '/' && b === 0) return { error: 'Division by zero' }
    const r = combine(a, b, op)
    if (r === null) return { error: 'Cannot combine these inputs' }
    const unitA: Unit = ctx.meta?.operandA?.unit ?? 'number'
    const unitB = ctx.meta?.operandB?.unit
    const unit: Unit = op === '+' || op === '-' ? unitA : unitB === 'number' ? unitA : 'number'
    return { scalar: r, last: lastValue(r), unit }
  },

  portfolioInput: async (ctx) => {
    const weights = Array.isArray(ctx.data.weights) ? ctx.data.weights : []
    // Indexed inputs (in0, in1, ...) and the legacy operandA, operandB, ... handles.
    const slots: { idx: number; key: string }[] = []
    for (const key of Object.keys(ctx.inputs)) {
      const indexed = /^in(\d+)$/.exec(key)
      const legacy = /^operand([A-Z])$/i.exec(key)
      if (indexed) slots.push({ idx: Number(indexed[1]), key })
      else if (legacy) slots.push({ idx: legacy[1]!.toUpperCase().charCodeAt(0) - 65, key })
    }
    slots.sort((x, y) => x.idx - y.idx)
    let sum = 0
    let totalWeight = 0
    let connected = 0
    let unit: Unit | undefined
    for (const { idx, key } of slots) {
      const v = lastValue(ctx.inputs[key])
      if (v == null) continue
      const w = isFiniteNumber(weights[idx]) ? weights[idx] : 1
      sum += v * w
      totalWeight += w
      connected++
      unit ??= ctx.meta?.[key]?.unit
    }
    if (connected === 0) return { error: 'Connect at least one input' }
    if (totalWeight <= 0) return { error: 'Weights must add up to more than zero' }
    return { scalar: sum / totalWeight, unit: unit ?? 'number' }
  },

  newsOutput: async (ctx) => {
    const symbol = ctx.inputs.symbol
    if (!symbol) return { headlines: [], count: 0, sentiment: 0, error: 'Connect a symbol' }
    try {
      const res = await fetch(`/api/news?symbol=${encodeURIComponent(String(symbol))}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const articles = await res.json()
      if (!Array.isArray(articles)) throw new Error('Unexpected news format')
      const headlines = articles
        .map((a: any) => (typeof a?.title === 'string' ? a.title.trim() : ''))
        .filter((t: string) => t.length > 0)
        .slice(0, NEWS_HEADLINES)
      return { headlines, count: articles.length, sentiment: averageSentiment(headlines), symbol }
    } catch (e: any) {
      return { headlines: [], count: 0, sentiment: 0, error: e?.message || 'News fetch failed' }
    }
  },

  chartOutput: async (ctx) => {
    const series: { handle: string; label: string; unit: Unit; points: Point[] }[] = []
    const points: Record<string, Point[] | null> = {}
    for (const handle of CHART_HANDLES) {
      const pts = normalizeSeries(ctx.inputs[handle])
      points[handle] = pts.length ? pts : null
      if (pts.length) {
        series.push({
          handle,
          label: ctx.meta?.[handle]?.label ?? handle,
          unit: ctx.meta?.[handle]?.unit ?? 'price',
          points: pts,
        })
      }
    }
    return {
      series,
      price: lastOf(points.mainSeries ?? []),
      mainSeries: points.mainSeries,
      overlayA: points.overlayA,
      overlayB: points.overlayB,
      overlayC: points.overlayC,
    }
  },

  candleChart: async (ctx) => {
    const candles = toCandles(ctx.inputs.candleSeries)
    const overlays: { handle: string; label: string; unit: Unit; points: Point[] }[] = []
    const legacy: Record<string, Point[] | null> = {}
    for (const handle of OVERLAY_HANDLES) {
      const pts = normalizeSeries(ctx.inputs[handle])
      legacy[handle] = pts.length ? pts : null
      if (pts.length) {
        overlays.push({
          handle,
          label: ctx.meta?.[handle]?.label ?? handle,
          unit: ctx.meta?.[handle]?.unit ?? 'price',
          points: pts,
        })
      }
    }
    return {
      candleSeries: candles.length ? candles : null,
      overlays,
      overlayA: legacy.overlayA,
      overlayB: legacy.overlayB,
      overlayC: legacy.overlayC,
    }
  },

  display: async (ctx) => {
    const raw = ctx.inputs.value
    if (typeof raw === 'string') return { value: raw, unit: 'text' as Unit, text: raw }
    const value = lastValue(raw)
    if (value == null) return { value: null, unit: 'number' as Unit, text: '—' }
    const unit: Unit = ctx.meta?.value?.unit ?? 'number'
    return { value, unit, text: formatValue(value, unit) }
  },

  alertOutput: async (ctx) => {
    const value = lastValue(ctx.inputs.value ?? ctx.inputs.signal)
    if (value == null) return { value: null, triggered: false, message: 'No value', error: 'Connect a value' }
    const threshold = isFiniteNumber(ctx.data.threshold) ? ctx.data.threshold : 0
    const triggered = ctx.data.condition === 'below' ? value < threshold : value > threshold
    return { value, triggered, message: triggered ? 'Triggered' : 'Watching' }
  },
}

/** The unit and label a source port contributes to the node it feeds. */
function portMeta(src: PipelineNode, handle: string, srcResult: any): InputMeta {
  const def = nodeDefinitions.find(d => d.type === src.type)
  const port = def?.outputs.find(o => o.id === handle)
  const nodeLabel = src.data?.label || def?.label || src.type
  const unit = port?.unit ?? (typeof srcResult?.unit === 'string' ? (srcResult.unit as Unit) : undefined)
  return { unit, label: `${nodeLabel} · ${port?.label ?? handle}` }
}

export async function executePipeline(spec: PipelineSpec): Promise<Record<string, any>> {
  const nodeMap = new Map<string, PipelineNode>(spec.nodes.map(n => [n.id, n]))
  const results: Record<string, any> = {}
  const incoming = new Map<string, PipelineEdge[]>()
  const outgoing = new Map<string, string[]>()
  const indegree = new Map<string, number>()
  for (const n of spec.nodes) {
    incoming.set(n.id, [])
    outgoing.set(n.id, [])
    indegree.set(n.id, 0)
  }
  for (const e of spec.edges) {
    if (!nodeMap.has(e.source) || !nodeMap.has(e.target)) continue
    incoming.get(e.target)!.push(e)
    outgoing.get(e.source)!.push(e.target)
    indegree.set(e.target, indegree.get(e.target)! + 1)
  }

  const done = new Set<string>()
  const ready = spec.nodes.filter(n => indegree.get(n.id) === 0).map(n => n.id)

  const release = (id: string) => {
    done.add(id)
    for (const next of outgoing.get(id)!) {
      const d = indegree.get(next)! - 1
      indegree.set(next, d)
      if (d === 0 && !done.has(next)) ready.push(next)
    }
  }

  /** Whether `id` can reach itself through the unfinished nodes. */
  const onCycle = (id: string, stuck: Set<string>): boolean => {
    const seen = new Set<string>()
    const stack = outgoing.get(id)!.filter(x => stuck.has(x))
    while (stack.length) {
      const x = stack.pop()!
      if (x === id) return true
      if (seen.has(x)) continue
      seen.add(x)
      for (const y of outgoing.get(x)!) if (stuck.has(y)) stack.push(y)
    }
    return false
  }

  const runNode = async (id: string): Promise<any> => {
    const node = nodeMap.get(id)!
    if (!Object.prototype.hasOwnProperty.call(executors, node.type)) return { error: 'Unknown node type' }
    const inputs: Record<string, any> = {}
    const meta: Record<string, InputMeta> = {}
    for (const e of incoming.get(id)!) {
      const src = results[e.source]
      if (!src) continue
      if (e.sourceHandle && e.targetHandle) {
        inputs[e.targetHandle] = src[e.sourceHandle]
        meta[e.targetHandle] = portMeta(nodeMap.get(e.source)!, e.sourceHandle, src)
      } else if (e.sourceHandle) {
        inputs[e.sourceHandle] = src[e.sourceHandle]
      } else {
        Object.assign(inputs, src)
      }
    }
    const ctx: ExecutionContext = { nodeId: id, inputs, data: node.data ?? {}, meta }
    try {
      return (await executors[node.type]!(ctx)) ?? {}
    } catch (e: any) {
      return { error: e?.message || String(e) }
    }
  }

  while (true) {
    while (ready.length) {
      const id = ready.shift()!
      results[id] = await runNode(id)
      release(id)
    }
    const stuck = spec.nodes.map(n => n.id).filter(id => !done.has(id))
    if (!stuck.length) break
    const stuckSet = new Set(stuck)
    // Every unfinished node has an unfinished predecessor, so a cycle exists. Every node on
    // a cycle is marked, and the others downstream of it run with the missing inputs.
    const cyclic = stuck.filter(x => onCycle(x, stuckSet))
    const batch = cyclic.length ? cyclic : [stuck[0]!]
    for (const id of batch) {
      results[id] = { error: 'Circular connection' }
      done.add(id)
    }
    for (const id of batch) release(id)
  }

  return results
}
