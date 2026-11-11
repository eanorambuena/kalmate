export interface SeriesPoint {
  timestamp: number
  value: number
  lower?: number
  upper?: number
}

export type Series = SeriesPoint[]

const DAY_MS = 86_400_000
const NUMERIC_FAMILY = new Set(['price', 'scalar', 'signal'])

function isFiniteNumber(x: unknown): x is number {
  return typeof x === 'number' && Number.isFinite(x)
}

/** Timestamps below 1e11 are in seconds (true until the year 5138 in ms terms). */
export function toMs(ts: number): number {
  return ts < 1e11 ? ts * 1000 : ts
}

/** Turns any supported input into a millisecond series sorted by time. */
export function normalizeSeries(input: any): Series {
  return parseSeries(input, true)
}

function parseSeries(input: any, toMilliseconds: boolean): Series {
  if (!Array.isArray(input) || input.length === 0) return []

  if (input.every(v => typeof v === 'number')) {
    const now = Date.now()
    const n = input.length
    const out: Series = []
    for (let i = 0; i < n; i++) {
      const v = input[i] as number
      if (!isFiniteNumber(v)) continue
      out.push({ timestamp: now - (n - 1 - i) * DAY_MS, value: v })
    }
    return out
  }

  const out: Series = []
  for (const p of input) {
    if (!p || typeof p !== 'object') continue
    const raw = p.timestamp ?? p.t
    if (!isFiniteNumber(raw)) continue
    const value = typeof p.value === 'number' ? p.value : typeof p.close === 'number' ? p.close : p.c
    if (!isFiniteNumber(value)) continue
    const point: SeriesPoint = { timestamp: toMilliseconds ? toMs(raw) : raw, value }
    if (isFiniteNumber(p.lower)) point.lower = p.lower
    if (isFiniteNumber(p.upper)) point.upper = p.upper
    out.push(point)
  }
  out.sort((a, b) => a.timestamp - b.timestamp)
  return out
}

type Kind = 'number' | 'numberArray' | 'series' | 'empty' | null

function kindOf(x: any): Kind {
  if (typeof x === 'number') return 'number'
  if (!Array.isArray(x)) return null
  if (x.length === 0) return 'empty'
  if (x.every(v => typeof v === 'number')) return 'numberArray'
  if (x.every(v => v !== null && typeof v === 'object' && !Array.isArray(v))) return 'series'
  return null
}

function opFn(op: string): (x: number, y: number) => number {
  switch (op) {
    case '-': return (x, y) => x - y
    case '*': return (x, y) => x * y
    case '/': return (x, y) => x / y
    default: return (x, y) => x + y
  }
}

/** Combines two operands (numbers, series or number arrays) with one of + - * /. */
export function combine(a: any, b: any, op: string): any {
  const f = opFn(op)
  const ka = kindOf(a)
  const kb = kindOf(b)
  if (ka === null || kb === null) return null

  if (ka === 'empty' || kb === 'empty') {
    // An empty array with a valid operand yields an empty result.
    return []
  }

  if (ka === 'number' && kb === 'number') {
    if (op === '/' && b === 0) return null
    const r = f(a, b)
    return Number.isFinite(r) ? r : null
  }

  if (ka === 'numberArray' || kb === 'numberArray') {
    if (ka === 'series' || kb === 'series') return null
    if (ka === 'numberArray' && kb === 'numberArray') {
      const len = Math.min(a.length, b.length)
      const out: number[] = new Array(len)
      for (let i = 0; i < len; i++) out[i] = finiteOrZero(f(a[i], b[i]))
      return out
    }
    if (ka === 'numberArray' && kb === 'number') {
      return a.map((x: number) => finiteOrZero(f(x, b)))
    }
    if (ka === 'number' && kb === 'numberArray') {
      return b.map((y: number) => finiteOrZero(f(a, y)))
    }
    return null
  }

  // At least one side is a series; numbers broadcast over it.
  if (ka === 'series' && kb === 'series') {
    // Timestamps are joined and returned as given (already ms in the pipeline).
    const sa = parseSeries(a, false)
    const byTs = new Map<number, number>()
    for (const p of parseSeries(b, false)) byTs.set(p.timestamp, p.value)
    const out: Series = []
    for (const p of sa) {
      const other = byTs.get(p.timestamp)
      if (other === undefined) continue
      const r = f(p.value, other)
      if (Number.isFinite(r)) out.push({ timestamp: p.timestamp, value: r })
    }
    return out
  }
  if (ka === 'series' && kb === 'number') {
    if (op === '/' && b === 0) return []
    return mapSeries(parseSeries(a, false), v => f(v, b))
  }
  if (ka === 'number' && kb === 'series') {
    return mapSeries(parseSeries(b, false), v => f(a, v))
  }
  return null
}

function finiteOrZero(r: number): number {
  return Number.isFinite(r) ? r : 0
}

function mapSeries(s: Series, g: (v: number) => number): Series {
  const out: Series = []
  for (const p of s) {
    const r = g(p.value)
    if (Number.isFinite(r)) out.push({ timestamp: p.timestamp, value: r })
  }
  return out
}

/** Last numeric value of a number, number array or series; null otherwise. */
export function lastValue(x: any): number | null {
  if (typeof x === 'number') return Number.isFinite(x) ? x : null
  if (!Array.isArray(x) || x.length === 0) return null
  if (x.every(v => typeof v === 'number')) {
    const last = x[x.length - 1]
    return Number.isFinite(last) ? last : null
  }
  const s = normalizeSeries(x)
  return s.length ? s[s.length - 1].value : null
}

const fmt = (min: number, max: number) => (v: number) =>
  v.toLocaleString('en-US', { minimumFractionDigits: min, maximumFractionDigits: max })

const fmt2 = fmt(2, 2)
const fmt1 = fmt(1, 1)
const fmtTrim = (v: number) => v.toLocaleString('en-US', { maximumFractionDigits: 6 })

/** Formats a value for display in the given unit. */
export function formatValue(v: any, unit?: string): string {
  if (typeof v === 'string') return v
  if (!isFiniteNumber(v)) return '—'

  switch (unit) {
    case 'price':
      return Math.abs(v) >= 1 ? fmt2(v) : fmtTrim(v)
    case 'percent': {
      const x = v * 100
      const sign = x > 0 ? '+' : x < 0 ? '-' : ''
      return `${sign}${fmt2(Math.abs(x))}%`
    }
    case 'index':
      return fmt1(v)
    case 'ratio':
      return `${fmt1(v)}x`
    case 'money': {
      const abs = Math.abs(v)
      const sign = v < 0 ? '-' : ''
      const units: Array<[number, string]> = [[1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K']]
      for (const [div, suffix] of units) {
        if (abs >= div) return `${sign}${fmt2(abs / div)}${suffix}`
      }
      return `${sign}${fmt2(abs)}`
    }
    default:
      return Math.abs(v) >= 1 ? fmt2(v) : fmtTrim(v)
  }
}

/** Whether an output of type sourceType may feed an input of type targetType. */
export function canConnect(sourceType: string, targetType: string): boolean {
  if (sourceType === 'any' || targetType === 'any') return true
  if (sourceType === targetType) return true
  return NUMERIC_FAMILY.has(sourceType) && NUMERIC_FAMILY.has(targetType)
}
