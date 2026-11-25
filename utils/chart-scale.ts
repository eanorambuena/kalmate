export interface TimeDomain {
  min: number
  max: number
}

export function pointX(
  ts: number | undefined,
  idx: number,
  len: number,
  timeDomain: TimeDomain | null,
  svgW: number,
  pad: number,
): number {
  if (timeDomain && Number.isFinite(timeDomain.min) && timeDomain.max > timeDomain.min &&
      typeof ts === 'number' && Number.isFinite(ts)) {
    return pad + ((ts - timeDomain.min) / (timeDomain.max - timeDomain.min)) * (svgW - pad * 2)
  }
  const last = Math.max(len - 1, 1)
  return pad + (idx / last) * (svgW - pad * 2)
}

export function toTimeDomain(
  series: Array<{ timestamps?: number[] }>,
): TimeDomain | null {
  let min = Infinity
  let max = -Infinity
  for (const s of series) {
    if (!s.timestamps || s.timestamps.length === 0) continue
    for (const t of s.timestamps) {
      if (t < min) min = t
      if (t > max) max = t
    }
  }
  if (!Number.isFinite(min) || !(max > min)) return null
  return { min, max }
}

export interface SplitDomainArgs {
  global?: TimeDomain | null
  mainTimes?: number[]
  fraction?: number
}

export function splitTimeDomain({ global, mainTimes, fraction = 0.5 }: SplitDomainArgs): TimeDomain | null {
  if (!global) return global
  if (!mainTimes || mainTimes.length === 0) return global
  const mainLast = mainTimes[mainTimes.length - 1]
  if (mainLast <= global.min) return global
  const naturalFraction = (mainLast - global.min) / (global.max - global.min)
  if (naturalFraction >= fraction) return global
  return { min: global.min, max: global.min + (mainLast - global.min) / fraction }
}

export function xLimit(svgW: number, pad: number): number {
  return svgW - pad
}


export interface ChartPoint {
  timestamp: number
  value: number
  lower?: number
  upper?: number
}

export interface ChartSeries {
  label: string
  /** Unit of the values. Missing means price. */
  unit?: string
  points: ChartPoint[]
}

export interface ChartPanels<T> {
  main: T[]
  secondary: T[]
}

/**
 * Splits chart series into the main panel and the secondary panel. Price
 * series share the main panel. When no price series is present, the unit of
 * the first series (the main input) is used for the main panel instead, so a
 * chart of rebased values still has a main panel. Everything else goes to
 * the secondary panel.
 */
export function splitPanels<T extends ChartSeries>(series: T[]): ChartPanels<T> {
  const unitOf = (s: T) => s.unit ?? 'price'
  const hasPrice = series.some(s => unitOf(s) === 'price')
  const mainUnit = hasPrice ? 'price' : (series[0] ? unitOf(series[0]) : 'price')
  return {
    main: series.filter(s => unitOf(s) === mainUnit),
    secondary: series.filter(s => unitOf(s) !== mainUnit),
  }
}

/** Series grouped by unit, in first-seen order. Each group gets its own scale. */
export function groupByUnit<T extends ChartSeries>(series: T[]): Map<string, T[]> {
  const groups = new Map<string, T[]>()
  for (const s of series) {
    const unit = s.unit ?? 'price'
    const list = groups.get(unit)
    if (list) list.push(s)
    else groups.set(unit, [s])
  }
  return groups
}

export interface ValueRange {
  min: number
  max: number
}

/**
 * The value range covering every point, including the lower and upper bands.
 * A flat range is padded so it never has zero width. Null when there are no
 * finite values.
 */
export function yRange(series: Array<{ points: ChartPoint[] }>): ValueRange | null {
  let min = Infinity
  let max = -Infinity
  const take = (v: number | undefined) => {
    if (typeof v !== 'number' || !Number.isFinite(v)) return
    if (v < min) min = v
    if (v > max) max = v
  }
  for (const s of series) {
    for (const p of s.points) {
      take(p.value)
      take(p.lower)
      take(p.upper)
    }
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null
  if (max === min) {
    const pad = Math.abs(min) * 0.05 || 1
    return { min: min - pad, max: max + pad }
  }
  return { min, max }
}

/** Y pixel for a value: min at the bottom edge (bottom), max at the top edge (top). */
export function valueToY(value: number, range: ValueRange, top: number, bottom: number): number {
  const span = range.max - range.min || 1
  return bottom - ((value - range.min) / span) * (bottom - top)
}

/** X pixel for a timestamp on a plot spanning [x0, x1]. Index spacing when there is no time domain. */
export function plotX(
  ts: number | undefined,
  idx: number,
  len: number,
  domain: TimeDomain | null,
  x0: number,
  x1: number,
): number {
  if (domain && domain.max > domain.min && typeof ts === 'number' && Number.isFinite(ts)) {
    return x0 + ((ts - domain.min) / (domain.max - domain.min)) * (x1 - x0)
  }
  const last = Math.max(len - 1, 1)
  return x0 + (idx / last) * (x1 - x0)
}

/** Closed SVG path between an upper edge (left to right) and a lower edge (right to left). */
export function bandPath(upper: Array<{ x: number; y: number }>, lower: Array<{ x: number; y: number }>): string {
  if (upper.length < 2 || lower.length < 2) return ''
  let d = `M${upper[0]!.x},${upper[0]!.y}`
  for (let i = 1; i < upper.length; i++) d += ` L${upper[i]!.x},${upper[i]!.y}`
  for (let i = lower.length - 1; i >= 0; i--) d += ` L${lower[i]!.x},${lower[i]!.y}`
  return `${d} Z`
}

/** Index of the timestamp closest to t in a sorted array; -1 when empty. */
export function nearestIndex(sortedTs: number[], t: number): number {
  if (sortedTs.length === 0) return -1
  let lo = 0
  let hi = sortedTs.length - 1
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (sortedTs[mid]! < t) lo = mid + 1
    else hi = mid
  }
  if (lo > 0 && Math.abs(sortedTs[lo - 1]! - t) <= Math.abs(sortedTs[lo]! - t)) return lo - 1
  return lo
}

/** Median gap between consecutive timestamps (0 with fewer than two). */
export function medianGap(sortedTs: number[]): number {
  if (sortedTs.length < 2) return 0
  const gaps: number[] = []
  for (let i = 1; i < sortedTs.length; i++) gaps.push(sortedTs[i]! - sortedTs[i - 1]!)
  gaps.sort((a, b) => a - b)
  const mid = gaps.length >> 1
  return gaps.length % 2 ? gaps[mid]! : (gaps[mid - 1]! + gaps[mid]!) / 2
}
