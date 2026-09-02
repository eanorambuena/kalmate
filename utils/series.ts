export interface SeriesPoint {
  timestamp: number
  value: number
}

export type Series = SeriesPoint[]

export type Candle = {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
}

const DAY_MS = 86_400_000

function isNumberArray(v: any): v is number[] {
  return Array.isArray(v) && v.length > 0 && typeof v[0] === 'number'
}

function hasKey(v: any, key: string): boolean {
  return v && typeof v === 'object' && typeof v[key] === 'number'
}

export function toSeriesValues(input: any): number[] {
  if (!Array.isArray(input)) return []
  if (isNumberArray(input)) return input
  const first = input[0]
  if (!first || typeof first !== 'object') return []
  if (hasKey(first, 'value')) return input.map((p: any) => p.value)
  if (hasKey(first, 'close')) return input.map((p: any) => p.close)
  if (hasKey(first, 'c')) return input.map((p: any) => p.c)
  return []
}

export function toSeriesTimestamps(input: any, valueCount?: number): number[] {
  const count = valueCount ?? (Array.isArray(input) ? input.length : 0)
  if (!Array.isArray(input) || count === 0) return []

  const first = input[0]
  let lastTs: number | undefined
  let hasAny = false
  if (first && typeof first === 'object') {
    if (hasKey(first, 'timestamp')) {
      lastTs = input[input.length - 1].timestamp
      hasAny = true
    } else if (hasKey(first, 't')) {
      lastTs = input[input.length - 1].t
      hasAny = true
    }
  }

  const extent = count * DAY_MS
  const anchor = lastTs ?? Date.now()
  const out: number[] = []
  for (let i = 0; i < count; i++) {
    if (hasAny) {
      out.push(input[i].timestamp ?? input[i].t ?? (anchor - extent + i * DAY_MS))
    } else {
      out.push(anchor - extent + i * DAY_MS)
    }
  }
  return out
}

export function withTimestamps(values: number[], timestamps: number[]): Series {
  const n = Math.min(values.length, timestamps.length)
  const out: Series = []
  for (let i = 0; i < n; i++) {
    out.push({ timestamp: timestamps[i], value: values[i] })
  }
  return out
}

export function toSeries(input: any): Series {
  if (!Array.isArray(input)) return []
  const values = toSeriesValues(input)
  const timestamps = toSeriesTimestamps(input, values.length)
  return withTimestamps(values, timestamps)
}

export function isSeries(input: any): input is Series {
  return Array.isArray(input) && input.length > 0
    && typeof input[0] === 'object'
    && hasKey(input[0], 'value') && hasKey(input[0], 'timestamp')
}
