// Pure helpers that turn pipeline series into lightweight-charts data.
// lightweight-charts wants UTC seconds, strictly ascending and unique.

export interface SeriesPoint {
  timestamp: number
  value: number
  lower?: number
  upper?: number
}

export interface LinePoint {
  time: number
  value: number
}

export interface CandlePoint {
  time: number
  open: number
  high: number
  low: number
  close: number
}

const DAY_S = 86_400

/** Pipeline series carry ms timestamps (see normalizeSeries); charts want seconds. */
function toSeconds(ts: number): number {
  return Math.floor(ts / 1000)
}

/** Sorted, de-duplicated (last wins) by time. */
function ascendingUnique<T extends { time: number }>(rows: T[]): T[] {
  const byTime = new Map<number, T>()
  for (const r of rows) byTime.set(r.time, r)
  return [...byTime.values()].sort((a, b) => a.time - b.time)
}

export function toLineData(points: SeriesPoint[]): LinePoint[] {
  const rows: LinePoint[] = []
  for (const p of points ?? []) {
    if (!Number.isFinite(p?.timestamp) || !Number.isFinite(p?.value)) continue
    rows.push({ time: toSeconds(p.timestamp), value: p.value })
  }
  // Map keeps insertion order for the duplicate check, so sort input first.
  rows.sort((a, b) => a.time - b.time)
  return ascendingUnique(rows)
}

export function toBandData(points: SeriesPoint[]): { upper: LinePoint[]; lower: LinePoint[] } {
  const banded = (points ?? []).filter(p => Number.isFinite(p?.lower) && Number.isFinite(p?.upper))
  return {
    upper: toLineData(banded.map(p => ({ timestamp: p.timestamp, value: p.upper! }))),
    lower: toLineData(banded.map(p => ({ timestamp: p.timestamp, value: p.lower! }))),
  }
}

export function toCandleData(candles: { timestamp: number; open: number; high: number; low: number; close: number }[]): CandlePoint[] {
  const rows: CandlePoint[] = []
  for (const c of candles ?? []) {
    const prices = [c?.open, c?.high, c?.low, c?.close]
    if (!Number.isFinite(c?.timestamp) || !prices.every(v => Number.isFinite(v) && (v as number) > 0)) continue
    rows.push({ time: toSeconds(c.timestamp), open: c.open, high: c.high, low: c.low, close: c.close })
  }
  rows.sort((a, b) => a.time - b.time)
  return ascendingUnique(rows)
}

/**
 * Pane index per series. Pane 0 holds price series (or, without any, the
 * first series' unit); every other unit gets its own pane so an oscillator
 * never squashes the price scale.
 */
export function assignPanes(series: { unit?: string }[]): number[] {
  const unitOf = (s: { unit?: string }) => s.unit ?? 'price'
  const mainUnit = series.some(s => unitOf(s) === 'price') ? 'price' : (series[0] ? unitOf(series[0]) : 'price')
  const panes = new Map<string, number>([[mainUnit, 0]])
  return series.map(s => {
    const u = unitOf(s)
    if (!panes.has(u)) panes.set(u, panes.size)
    return panes.get(u)!
  })
}

export const HORIZONS = ['1M', '3M', '6M', '1Y', '2Y', 'ALL'] as const
const HORIZON_DAYS: Record<string, number> = { '1M': 30, '3M': 90, '6M': 180, '1Y': 365, '2Y': 730 }

/** Start of the visible range (seconds) for a horizon ending at `last`, or null for everything. */
export function visibleFrom(horizon: string, last: number): number | null {
  const d = HORIZON_DAYS[horizon]
  return d ? last - d * DAY_S : null
}

/** Value at or before `time` (seconds); the last value when `time` is null. */
export function legendAt(data: LinePoint[], time: number | null): number | null {
  if (!data.length) return null
  if (time == null) return data[data.length - 1]!.value
  let lo = 0
  let hi = data.length - 1
  let found = -1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (data[mid]!.time <= time) { found = mid; lo = mid + 1 } else hi = mid - 1
  }
  return found >= 0 ? data[found]!.value : null
}
