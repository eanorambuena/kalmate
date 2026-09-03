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

