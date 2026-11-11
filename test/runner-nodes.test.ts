import { describe, it, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { executors, executePipeline } from '../utils/pipeline/runner.ts'
import { nodeDefinitions } from '../utils/pipeline/nodeDefinitions.ts'
import { formatValue } from '../utils/pipeline/values.ts'
import { averageSentiment } from '../utils/sentiment.ts'
import type { ExecutionContext } from '../utils/pipeline/types.ts'

const DAY = 86_400_000
const START = Date.UTC(2024, 0, 1)
const realFetch = globalThis.fetch
afterEach(() => { globalThis.fetch = realFetch })

/** Daily series (ms timestamps) from a value function of the index. */
function series(n: number, f: (i: number) => number = i => 100 + Math.sin(i / 7) * 5 + i * 0.1, start = START) {
  return Array.from({ length: n }, (_, i) => ({ timestamp: start + i * DAY, value: f(i) }))
}

function ctx(over: Partial<ExecutionContext> = {}): ExecutionContext {
  return { nodeId: 'n', inputs: {}, data: {}, ...over }
}

function mockFetch(handler: (url: string) => { status?: number; body: any }) {
  const calls: string[] = []
  globalThis.fetch = (async (url: any) => {
    calls.push(String(url))
    const r = handler(String(url))
    return new Response(JSON.stringify(r.body), { status: r.status ?? 200 })
  }) as any
  return calls
}

const exec = (type: string) => {
  const fn = (executors as Record<string, any>)[type]
  assert.ok(fn, `executor ${type} exists`)
  return fn as (c: ExecutionContext) => Promise<any>
}

describe('priceFeed', () => {
  it('turns second timestamps into milliseconds for the price and candle series', async () => {
    const candles = [0, 1, 2].map(i => ({ timestamp: 1_700_000_000 + i * 86_400, open: 1, high: 2, low: 0.5, close: 100 + i }))
    const calls = mockFetch(() => ({ body: candles }))
    const out = await exec('priceFeed')(ctx({ inputs: { symbol: 'AAPL' } }))
    assert.ok(calls[0]!.startsWith('/api/history?symbol=AAPL&range=5y&interval=1d'))
    assert.equal(out.priceSeries[0].timestamp, 1_700_000_000_000)
    assert.equal(out.priceSeries[2].timestamp, 1_700_000_000_000 + 2 * DAY)
    assert.equal(out.candleSeries[0].timestamp, 1_700_000_000_000)
    assert.equal(out.candleSeries[0].close, 100)
    assert.equal(out.price, 102)
    assert.equal(out.symbol, 'AAPL')
  })
})

describe('smaIndicator and emaIndicator', () => {
  it('SMA drops the warm-up points, has no zeros and last equals the final value', async () => {
    const s = series(50)
    const out = await exec('smaIndicator')(ctx({ inputs: { priceSeries: s }, data: { period: 5 } }))
    assert.equal(out.smaSeries.length, 50 - 4)
    assert.equal(out.smaSeries[0].timestamp, s[4].timestamp)
    assert.ok(out.smaSeries.every((p: any) => p.value > 0))
    const expected = s.slice(-5).reduce((a, p) => a + p.value, 0) / 5
    assert.ok(Math.abs(out.smaSeries.at(-1).value - expected) < 1e-9)
    assert.equal(out.last, out.smaSeries.at(-1).value)
  })

  it('EMA drops the warm-up points, has no zeros and last equals the final value', async () => {
    const s = series(50)
    const out = await exec('emaIndicator')(ctx({ inputs: { priceSeries: s }, data: { period: 10 } }))
    assert.equal(out.emaSeries.length, 50 - 9)
    assert.equal(out.emaSeries[0].timestamp, s[9].timestamp)
    assert.ok(out.emaSeries.every((p: any) => Number.isFinite(p.value) && p.value > 0))
    assert.equal(out.last, out.emaSeries.at(-1).value)
  })

  it('use the default period 20 and clamp periods to the 2–400 range', async () => {
    const s = series(60)
    const dflt = await exec('smaIndicator')(ctx({ inputs: { priceSeries: s }, data: {} }))
    assert.equal(dflt.smaSeries.length, 60 - 19)
    const low = await exec('smaIndicator')(ctx({ inputs: { priceSeries: s }, data: { period: 1 } }))
    assert.equal(low.smaSeries.length, 60 - 1)
    const high = await exec('smaIndicator')(ctx({ inputs: { priceSeries: s }, data: { period: 9999 } }))
    assert.ok(high.error, 'too few points for a clamped period of 400')
  })

  it('fall back to the default when the period is not a finite number', async () => {
    const s = series(60)
    const out = await exec('emaIndicator')(ctx({ inputs: { priceSeries: s }, data: { period: 'abc' } }))
    assert.equal(out.emaSeries.length, 60 - 19)
  })

  it('report a clear error for a too-short input', async () => {
    const out = await exec('smaIndicator')(ctx({ inputs: { priceSeries: series(5) }, data: { period: 20 } }))
    assert.match(out.error, /20/)
    assert.deepEqual(out.smaSeries, [])
  })
})

describe('rsiIndicator', () => {
  it('drops the first period points, keeps values in 0–100 and rsiValue equals the last point', async () => {
    const s = series(60)
    const out = await exec('rsiIndicator')(ctx({ inputs: { priceSeries: s }, data: { period: 14 } }))
    assert.equal(out.rsiSeries.length, 60 - 14)
    assert.equal(out.rsiSeries[0].timestamp, s[14].timestamp)
    assert.ok(out.rsiSeries.every((p: any) => p.value >= 0 && p.value <= 100))
    assert.equal(out.rsiValue, out.rsiSeries.at(-1).value)
  })

  it('reports an error when there are not enough points for the period', async () => {
    const out = await exec('rsiIndicator')(ctx({ inputs: { priceSeries: series(10) }, data: { period: 14 } }))
    assert.ok(out.error)
  })
})

describe('kalmanFilter', () => {
  const trend = (n: number) => Array.from({ length: n }, (_, i) => 100 * Math.exp(0.002 * i))

  it('outputs smoothed, deviation, deviationPct and signal', async () => {
    const s = series(120, i => 100 * Math.exp(0.001 * i) + Math.sin(i) * 2)
    const out = await exec('kalmanFilter')(ctx({ inputs: { priceSeries: s } }))
    assert.equal(out.smoothed.length, s.length)
    assert.equal(out.deviation.length, s.length)
    assert.equal(typeof out.deviationPct, 'number')
    assert.equal(out.deviationPct, out.deviation.at(-1).value)
    assert.ok([1, -1].includes(out.signal))
    assert.ok(out.smoothed.every((p: any) => p.value > 0))
  })

  it('signal is +1 when the last price is far below the smoothed line and -1 when far above', async () => {
    const t = trend(120)
    const below = await exec('kalmanFilter')(ctx({ inputs: { priceSeries: series(120, i => (i === 119 ? t[i]! * 0.6 : t[i]!)) } }))
    const above = await exec('kalmanFilter')(ctx({ inputs: { priceSeries: series(120, i => (i === 119 ? t[i]! * 1.5 : t[i]!)) } }))
    assert.equal(below.signal, 1)
    assert.equal(above.signal, -1)
    assert.ok(below.deviationPct < 0)
    assert.ok(above.deviationPct > 0)
  })

  it('honours the smoothing preset', async () => {
    const s = series(120, i => 100 + Math.sin(i / 3) * 4)
    const responsive = await exec('kalmanFilter')(ctx({ inputs: { priceSeries: s }, data: { smoothing: 'responsive' } }))
    const smooth = await exec('kalmanFilter')(ctx({ inputs: { priceSeries: s }, data: { smoothing: 'smooth' } }))
    assert.notDeepEqual(responsive.smoothed, smooth.smoothed)
  })

  it('reports an error for a too-short series', async () => {
    const out = await exec('kalmanFilter')(ctx({ inputs: { priceSeries: [100, 101] } }))
    assert.ok(out.error)
  })
})

describe('zScore', () => {
  it('drops the first window - 1 points and last equals the final z-score', async () => {
    const s = series(60)
    const out = await exec('zScore')(ctx({ inputs: { priceSeries: s }, data: { window: 20 } }))
    assert.equal(out.zSeries.length, 60 - 19)
    assert.equal(out.zSeries[0].timestamp, s[19].timestamp)
    assert.equal(out.zScore, out.zSeries.at(-1).value)
  })

  it('reports an error when the window does not fit', async () => {
    const out = await exec('zScore')(ctx({ inputs: { priceSeries: series(10) }, data: { window: 252 } }))
    assert.ok(out.error)
  })
})

describe('normalize', () => {
  it('rebases the first value of the window to exactly 100 and reports changePct', async () => {
    const s = series(400)
    const out = await exec('normalize')(ctx({ inputs: { priceSeries: s }, data: { window: 'ALL' } }))
    assert.equal(out.normalized.length, 400)
    assert.equal(out.normalized[0].value, 100)
    const last = s.at(-1)!.value
    const first = s[0]!.value
    assert.ok(Math.abs(out.changePct - (last / first - 1)) < 1e-12)
  })

  it('keeps only points within 30 days of the last timestamp for the 1M window', async () => {
    const s = series(400)
    const out = await exec('normalize')(ctx({ inputs: { priceSeries: s }, data: { window: '1M' } }))
    const lastTs = s.at(-1)!.timestamp
    assert.equal(out.normalized.length, 31)
    assert.ok(out.normalized.every((p: any) => p.timestamp >= lastTs - 30 * DAY && p.timestamp <= lastTs))
    assert.equal(out.normalized[0].value, 100)
  })

  it('defaults to a one-year window', async () => {
    const s = series(400)
    const out = await exec('normalize')(ctx({ inputs: { priceSeries: s }, data: {} }))
    assert.ok(out.normalized.every((p: any) => p.timestamp >= s.at(-1)!.timestamp - 365 * DAY))
  })

  it('reports an error for a single point', async () => {
    const out = await exec('normalize')(ctx({ inputs: { priceSeries: series(1) }, data: {} }))
    assert.ok(out.error)
  })
})

describe('forecastNode', () => {
  const s = series(120, i => 100 + i * 0.4 + Math.sin(i / 2) * 3)

  it('starts at the last observed point with lower = upper = value, then one band per step', async () => {
    const out = await exec('forecastNode')(ctx({ inputs: { priceSeries: s }, data: { steps: 10, model: 'drift' } }))
    assert.equal(out.forecastSeries.length, 11)
    const anchor = out.forecastSeries[0]
    assert.equal(anchor.timestamp, s.at(-1)!.timestamp)
    assert.equal(anchor.value, s.at(-1)!.value)
    assert.equal(anchor.lower, anchor.value)
    assert.equal(anchor.upper, anchor.value)
    for (let i = 1; i < out.forecastSeries.length; i++) {
      const p = out.forecastSeries[i]
      assert.ok(p.lower < p.value && p.value < p.upper, `step ${i} band`)
    }
  })

  it('uses the series spacing for timestamps, strictly increasing', async () => {
    const out = await exec('forecastNode')(ctx({ inputs: { priceSeries: s }, data: { steps: 5 } }))
    const ts = out.forecastSeries.map((p: any) => p.timestamp)
    for (let i = 1; i < ts.length; i++) assert.equal(ts[i] - ts[i - 1], DAY)
  })

  it('returns expectedReturn, skill, n, hitRate, coverage and a verdict', async () => {
    const out = await exec('forecastNode')(ctx({ inputs: { priceSeries: s }, data: { steps: 10 } }))
    const last = s.at(-1)!.value
    const final = out.forecastSeries.at(-1)!.value
    assert.ok(Math.abs(out.expectedReturn - (final / last - 1)) < 1e-9)
    for (const k of ['skill', 'hitRate', 'coverage', 'n']) assert.equal(typeof out[k], 'number', k)
    assert.equal(typeof out.verdict, 'string')
  })

  it('treats a legacy algorithm or an unknown model as auto', async () => {
    const auto = await exec('forecastNode')(ctx({ inputs: { priceSeries: s }, data: { steps: 8 } }))
    const legacy = await exec('forecastNode')(ctx({ inputs: { priceSeries: s }, data: { steps: 8, algorithm: 'kalman' } }))
    const unknown = await exec('forecastNode')(ctx({ inputs: { priceSeries: s }, data: { steps: 8, model: 'arima' } }))
    assert.deepEqual(legacy.forecastSeries, auto.forecastSeries)
    assert.deepEqual(unknown.forecastSeries, auto.forecastSeries)
  })

  it('clamps steps to the 5–252 range', async () => {
    const out = await exec('forecastNode')(ctx({ inputs: { priceSeries: s }, data: { steps: 1000 } }))
    assert.equal(out.forecastSeries.length, 253)
  })

  it('reports an error with fewer than 60 points', async () => {
    const out = await exec('forecastNode')(ctx({ inputs: { priceSeries: series(59) }, data: {} }))
    assert.ok(out.error)
    assert.deepEqual(out.forecastSeries, [])
  })
})

describe('fundamentals', () => {
  it('requests the symbol and as-of date and maps every field', async () => {
    const calls = mockFetch(() => ({
      body: { eps: 1.5, bookValuePerShare: 10, freeCashFlowPerShare: 2, netIncome: 40, freeCashFlow: 50, shares: 9, coverage: 0.8 },
    }))
    const out = await exec('fundamentals')(ctx({ inputs: { symbol: 'DUOL' }, data: { asOf: '2025-03-01' } }))
    assert.equal(calls[0], '/api/fundamentals?symbol=DUOL&asOf=2025-03-01')
    assert.equal(out.eps, 1.5)
    assert.equal(out.bookValuePerShare, 10)
    assert.equal(out.freeCashFlowPerShare, 2)
    assert.equal(out.netIncome, 40)
    assert.equal(out.freeCashFlow, 50)
    assert.equal(out.shares, 9)
    assert.equal(out.coverage, 0.8)
    assert.equal(out.error, undefined)
  })

  it('surfaces the server statusMessage as error', async () => {
    mockFetch(() => ({ status: 502, body: { statusMessage: 'SEC facts HTTP 403' } }))
    const out = await exec('fundamentals')(ctx({ inputs: { symbol: 'DUOL' }, data: {} }))
    assert.equal(out.error, 'SEC facts HTTP 403')
    assert.equal(out.eps, null)
  })

  it('reports a missing symbol without calling the server', async () => {
    let called = false
    globalThis.fetch = (async () => { called = true; return new Response('{}') }) as any
    const out = await exec('fundamentals')(ctx({ inputs: {}, data: {} }))
    assert.equal(called, false)
    assert.equal(out.error, 'Need a symbol')
  })
})

describe('fairValue', () => {
  const prices = series(365 * 6, i => 100 + i * 0.05, Date.UTC(2020, 0, 1))
  const points = [2021, 2022, 2023, 2024, 2025].flatMap(y => [
    { asOf: `${y}-03-31`, eps: 4, bookValuePerShare: 20 },
    { asOf: `${y}-06-30`, eps: 4, bookValuePerShare: 20 },
    { asOf: `${y}-09-30`, eps: 4, bookValuePerShare: 20 },
    { asOf: `${y}-12-31`, eps: 4, bookValuePerShare: 20 },
  ])

  it('passes the symbol to the history route and returns the multiples-based fair value', async () => {
    const calls = mockFetch(() => ({ body: { points, current: { eps: 5, bookValuePerShare: 25 } } }))
    const out = await exec('fairValue')(ctx({ inputs: { symbol: 'AAPL', priceSeries: prices } }))
    assert.ok(calls[0]!.startsWith('/api/fundamentals/history?symbol=AAPL'))
    assert.equal(typeof out.fairValue, 'number')
    assert.equal(typeof out.upsidePct, 'number')
    assert.equal(typeof out.pe, 'number')
    assert.equal(typeof out.pb, 'number')
    assert.ok(out.fairValueSeries.length > 0)
    assert.equal(out.error, undefined)
  })

  it('surfaces the server statusMessage as error', async () => {
    mockFetch(() => ({ status: 404, body: { statusMessage: 'Unknown ticker' } }))
    const out = await exec('fairValue')(ctx({ inputs: { symbol: 'NOPE', priceSeries: prices } }))
    assert.equal(out.error, 'Unknown ticker')
  })

  it('reports a missing symbol or price series without calling the server', async () => {
    let called = false
    globalThis.fetch = (async () => { called = true; return new Response('{}') }) as any
    const noSymbol = await exec('fairValue')(ctx({ inputs: { priceSeries: prices } }))
    const noSeries = await exec('fairValue')(ctx({ inputs: { symbol: 'AAPL' } }))
    assert.equal(called, false)
    assert.match(noSymbol.error, /symbol/i)
    assert.match(noSeries.error, /price/i)
  })
})

describe('compareReference', () => {
  it('compares the last price of the series with a numeric reference', async () => {
    const out = await exec('compareReference')(ctx({ inputs: { priceSeries: series(10, () => 100), reference: 80 } }))
    assert.ok(Math.abs(out.diffPct - 0.25) < 1e-9)
    assert.equal(out.overvalued, 1)
    assert.equal(out.undervalued, 0)
    assert.equal(out.label, 'Above reference')
  })

  it('uses the last value of a reference series', async () => {
    const out = await exec('compareReference')(ctx({ inputs: { priceSeries: series(10, () => 100), reference: series(5, i => 50 + i * 20) } }))
    assert.ok(Math.abs(out.diffPct - (100 / 130 - 1)) < 1e-9)
    assert.equal(out.undervalued, 1)
  })

  it('reads data.band in percent points', async () => {
    const inputs = { priceSeries: series(10, () => 100), reference: 80 }
    const tight = await exec('compareReference')(ctx({ inputs, data: { band: 10 } }))
    const wide = await exec('compareReference')(ctx({ inputs, data: { band: 30 } }))
    assert.equal(tight.overvalued, 1)
    assert.equal(wide.overvalued, 0)
    assert.equal(wide.label, 'At reference')
  })
})

describe('mathOp', () => {
  const S = (pairs: [number, number][]) => pairs.map(([timestamp, value]) => ({ timestamp, value }))

  it('divides two series aligned by timestamp', async () => {
    const a = S([[1, 10], [2, 20], [3, 30]])
    const b = S([[2, 5], [3, 10]])
    const out = await exec('mathOp')(ctx({ inputs: { operandA: a, operandB: b }, data: { op: '/' } }))
    assert.deepEqual(out.scalar, S([[2, 4], [3, 3]]))
    assert.equal(out.last, 3)
  })

  it('multiplies a series by a number', async () => {
    const a = S([[1, 1.5], [2, 2]])
    const out = await exec('mathOp')(ctx({ inputs: { operandA: a, operandB: 2 }, data: { op: '*' } }))
    assert.deepEqual(out.scalar, S([[1, 3], [2, 4]]))
  })

  it('returns a division-by-zero error for a number divided by zero', async () => {
    const out = await exec('mathOp')(ctx({ inputs: { operandA: 10, operandB: 0 }, data: { op: '/' } }))
    assert.deepEqual(out, { error: 'Division by zero' })
  })

  it('takes the unit of A for + and -', async () => {
    const meta = { operandA: { unit: 'price' as const, label: 'A' }, operandB: { unit: 'percent' as const, label: 'B' } }
    for (const op of ['+', '-']) {
      const out = await exec('mathOp')(ctx({ inputs: { operandA: 10, operandB: 2 }, data: { op }, meta }))
      assert.equal(out.unit, 'price', op)
    }
  })

  it('keeps the unit of A for * and / only when B is a plain number', async () => {
    const plain = { operandA: { unit: 'percent' as const, label: 'A' }, operandB: { unit: 'number' as const, label: 'B' } }
    const other = { operandA: { unit: 'percent' as const, label: 'A' }, operandB: { unit: 'price' as const, label: 'B' } }
    const times = await exec('mathOp')(ctx({ inputs: { operandA: 0.1, operandB: 2 }, data: { op: '*' }, meta: plain }))
    const divOther = await exec('mathOp')(ctx({ inputs: { operandA: 0.1, operandB: 2 }, data: { op: '/' }, meta: other }))
    assert.equal(times.unit, 'percent')
    assert.equal(divOther.unit, 'number')
  })

  it('reports an error when an operand is not connected', async () => {
    const out = await exec('mathOp')(ctx({ inputs: { operandA: 1 }, data: { op: '+' } }))
    assert.ok(out.error)
  })
})

describe('portfolioInput', () => {
  it('weights in0 and in1 by index and reads series with their last value', async () => {
    const out = await exec('portfolioInput')(ctx({
      inputs: { in0: [{ timestamp: 1, value: 50 }, { timestamp: 2, value: 100 }], in1: 200 },
      data: { weights: [2, 1] },
    }))
    assert.ok(Math.abs(out.scalar - (100 * 2 + 200) / 3) < 1e-9)
  })

  it('still accepts the legacy operandA and operandB handles', async () => {
    const out = await exec('portfolioInput')(ctx({ inputs: { operandA: 100, operandB: 200 }, data: { weights: [2, 1] } }))
    assert.ok(Math.abs(out.scalar - (100 * 2 + 200) / 3) < 1e-9)
  })

  it('ignores unconnected slots and defaults weights to 1', async () => {
    const out = await exec('portfolioInput')(ctx({ inputs: { in0: 10, in2: 20 }, data: {} }))
    assert.equal(out.scalar, 15)
  })

  it('reports an error when nothing is connected', async () => {
    const out = await exec('portfolioInput')(ctx({ data: { weights: [1, 1] } }))
    assert.deepEqual(out, { error: 'Connect at least one input' })
  })
})

describe('newsOutput', () => {
  it('returns up to five headlines, the article count and their mean sentiment', async () => {
    const titles = [
      'Stock surges on record profit',
      'Analysts upgrade the shares',
      'Company announces a new product',
      'Quarterly beat lifts outlook',
      'Regulators open a probe',
      'Minor update to the app',
      'Sixth headline',
    ]
    const calls = mockFetch(() => ({ body: titles.map(title => ({ title })) }))
    const out = await exec('newsOutput')(ctx({ inputs: { symbol: 'AAPL' } }))
    assert.equal(calls[0], '/api/news?symbol=AAPL')
    assert.equal(out.headlines.length, 5)
    assert.equal(out.headlines[0], titles[0])
    assert.equal(out.count, 7)
    assert.equal(out.sentiment, averageSentiment(out.headlines))
    assert.ok(out.sentiment > 0)
  })

  it('returns zero sentiment and no headlines when there is no news', async () => {
    mockFetch(() => ({ body: [] }))
    const out = await exec('newsOutput')(ctx({ inputs: { symbol: 'AAPL' } }))
    assert.equal(out.sentiment, 0)
    assert.deepEqual(out.headlines, [])
    assert.equal(out.count, 0)
  })

  it('reports fetch failures as error', async () => {
    mockFetch(() => ({ status: 500, body: {} }))
    const out = await exec('newsOutput')(ctx({ inputs: { symbol: 'AAPL' } }))
    assert.ok(out.error)
  })
})

describe('display', () => {
  it('formats a number with the unit from the incoming connection', async () => {
    const out = await exec('display')(ctx({ inputs: { value: 42 }, meta: { value: { unit: 'price', label: 'Price' } } }))
    assert.equal(out.value, 42)
    assert.equal(out.unit, 'price')
    assert.equal(out.text, formatValue(42, 'price'))
  })

  it('defaults the unit to number when nothing describes the input', async () => {
    const out = await exec('display')(ctx({ inputs: { value: 3 } }))
    assert.equal(out.unit, 'number')
  })

  it('passes text through unchanged', async () => {
    const out = await exec('display')(ctx({ inputs: { value: 'Buy zone' } }))
    assert.equal(out.value, 'Buy zone')
    assert.equal(out.text, 'Buy zone')
  })

  it('shows the last value of a series', async () => {
    const out = await exec('display')(ctx({ inputs: { value: [{ timestamp: 1, value: 5 }, { timestamp: 2, value: 7 }] } }))
    assert.equal(out.value, 7)
  })
})

describe('alertOutput', () => {
  it('triggers above the threshold by default', async () => {
    const hit = await exec('alertOutput')(ctx({ inputs: { value: 0.5 }, data: { threshold: 0.2 } }))
    const miss = await exec('alertOutput')(ctx({ inputs: { value: 0.1 }, data: { threshold: 0.2 } }))
    assert.equal(hit.triggered, true)
    assert.equal(hit.message, 'Triggered')
    assert.equal(miss.triggered, false)
    assert.equal(miss.message, 'Watching')
  })

  it('triggers below the threshold for the below condition', async () => {
    const out = await exec('alertOutput')(ctx({ inputs: { value: -1 }, data: { condition: 'below', threshold: 0 } }))
    assert.equal(out.triggered, true)
  })

  it('still reads the legacy signal input', async () => {
    const out = await exec('alertOutput')(ctx({ inputs: { signal: 1 }, data: { threshold: 0 } }))
    assert.equal(out.value, 1)
    assert.equal(out.triggered, true)
  })

  it('reports an error when no value is connected', async () => {
    const out = await exec('alertOutput')(ctx({ inputs: {}, data: {} }))
    assert.equal(out.error, 'Connect a value')
  })
})

describe('chartOutput', () => {
  it('returns connected series in handle order with label and unit from meta', async () => {
    const main = series(5, () => 100)
    const out = await exec('chartOutput')(ctx({
      inputs: { mainSeries: main, overlayB: series(5, () => 3) },
      meta: {
        mainSeries: { unit: 'price', label: 'Price Feed · Price Series' },
        overlayB: { unit: 'index', label: 'RSI · RSI Series' },
      },
    }))
    assert.deepEqual(out.series.map((s: any) => s.handle), ['mainSeries', 'overlayB'])
    assert.equal(out.series[0].label, 'Price Feed · Price Series')
    assert.equal(out.series[0].unit, 'price')
    assert.equal(out.series[1].unit, 'index')
    assert.equal(out.series[1].points.length, 5)
  })

  it('falls back to the handle name and the price unit without meta', async () => {
    const out = await exec('chartOutput')(ctx({ inputs: { mainSeries: [1, 2, 3] } }))
    assert.equal(out.series[0].label, 'mainSeries')
    assert.equal(out.series[0].unit, 'price')
  })

  it('keeps the legacy keys', async () => {
    const out = await exec('chartOutput')(ctx({ inputs: { mainSeries: [10, 20], overlayA: [1, 2] } }))
    assert.deepEqual(out.mainSeries.map((p: any) => p.value), [10, 20])
    assert.deepEqual(out.overlayA.map((p: any) => p.value), [1, 2])
    assert.equal(out.overlayB, null)
    assert.equal(out.price, 20)
  })
})

describe('candleChart', () => {
  it('converts candle timestamps to milliseconds and labels overlays', async () => {
    const candles = [{ timestamp: 1_700_000_000, open: 1, high: 2, low: 0.5, close: 1.5 }]
    const out = await exec('candleChart')(ctx({
      inputs: { candleSeries: candles, overlayA: [1, 2] },
      meta: { overlayA: { unit: 'price', label: 'SMA · SMA' } },
    }))
    assert.equal(out.candleSeries[0].timestamp, 1_700_000_000_000)
    assert.equal(out.candleSeries[0].close, 1.5)
    assert.equal(out.overlays[0].label, 'SMA · SMA')
    assert.equal(out.overlays[0].handle, 'overlayA')
    assert.equal(out.overlayA.length, 2)
  })

  it('returns null candles with no input', async () => {
    const out = await exec('candleChart')(ctx({ inputs: {} }))
    assert.equal(out.candleSeries, null)
  })
})

describe('scalarInput and symbol inputs', () => {
  it('scalarInput returns its value, clamped and defaulting to 1', async () => {
    assert.equal((await exec('scalarInput')(ctx({ data: { value: 42 } }))).scalar, 42)
    assert.equal((await exec('scalarInput')(ctx({ data: {} }))).scalar, 1)
    assert.equal((await exec('scalarInput')(ctx({ data: { value: NaN } }))).scalar, 1)
  })

  it('symbolInput and currencyInput build their symbols', async () => {
    assert.equal((await exec('symbolInput')(ctx({ data: { symbol: 'MSFT' } }))).symbol, 'MSFT')
    assert.equal((await exec('currencyInput')(ctx({ data: { from: 'EUR', to: 'USD' } }))).symbol, 'EURUSD=X')
  })
})

describe('executePipeline', () => {
  it('passes the source port unit and a readable label to the target handle', async () => {
    mockFetch(() => ({ body: series(400).map(p => ({ timestamp: p.timestamp / 1000, open: 1, high: 1, low: 1, close: p.value })) }))
    const spec = {
      nodes: [
        { id: 's', type: 'symbolInput', position: { x: 0, y: 0 }, data: { type: 'symbolInput', symbol: 'AAPL' } },
        { id: 'p', type: 'priceFeed', position: { x: 0, y: 0 }, data: { type: 'priceFeed', label: 'Prices' } },
        { id: 'c', type: 'chartOutput', position: { x: 0, y: 0 }, data: { type: 'chartOutput' } },
      ],
      edges: [
        { id: 'e1', source: 's', target: 'p', sourceHandle: 'symbol', targetHandle: 'symbol' },
        { id: 'e2', source: 'p', target: 'c', sourceHandle: 'priceSeries', targetHandle: 'mainSeries' },
      ],
    }
    const results = await executePipeline(spec as any)
    assert.equal(results.c.series[0].label, 'Prices · Price Series')
    assert.equal(results.c.series[0].unit, 'price')
  })

  it('uses the unit of the source port definition, e.g. percent for normalize', async () => {
    mockFetch(() => ({ body: series(400).map(p => ({ timestamp: p.timestamp / 1000, open: 1, high: 1, low: 1, close: p.value })) }))
    const spec = {
      nodes: [
        { id: 's', type: 'symbolInput', position: { x: 0, y: 0 }, data: { type: 'symbolInput', symbol: 'AAPL' } },
        { id: 'p', type: 'priceFeed', position: { x: 0, y: 0 }, data: { type: 'priceFeed' } },
        { id: 'n', type: 'normalize', position: { x: 0, y: 0 }, data: { type: 'normalize', window: 'ALL' } },
        { id: 'd', type: 'display', position: { x: 0, y: 0 }, data: { type: 'display' } },
      ],
      edges: [
        { id: 'e1', source: 's', target: 'p', sourceHandle: 'symbol', targetHandle: 'symbol' },
        { id: 'e2', source: 'p', target: 'n', sourceHandle: 'priceSeries', targetHandle: 'priceSeries' },
        { id: 'e3', source: 'n', target: 'd', sourceHandle: 'changePct', targetHandle: 'value' },
      ],
    }
    const results = await executePipeline(spec as any)
    assert.equal(results.d.unit, 'percent')
    assert.match(results.d.text, /%$/)
  })

  it('turns an executor that throws into an error result', async () => {
    const original = (executors as any).scalarInput
    ;(executors as any).scalarInput = async () => { throw new Error('boom') }
    try {
      const results = await executePipeline({
        nodes: [{ id: 'a', type: 'scalarInput', position: { x: 0, y: 0 }, data: { type: 'scalarInput' } }],
        edges: [],
      } as any)
      assert.deepEqual(results.a, { error: 'boom' })
    } finally {
      ;(executors as any).scalarInput = original
    }
  })

  it('marks every node in a cycle with a circular connection error', async () => {
    const results = await executePipeline({
      nodes: [
        { id: 'm1', type: 'mathOp', position: { x: 0, y: 0 }, data: { type: 'mathOp', op: '+' } },
        { id: 'm2', type: 'mathOp', position: { x: 0, y: 0 }, data: { type: 'mathOp', op: '+' } },
      ],
      edges: [
        { id: 'e1', source: 'm1', target: 'm2', sourceHandle: 'scalar', targetHandle: 'operandA' },
        { id: 'e2', source: 'm2', target: 'm1', sourceHandle: 'scalar', targetHandle: 'operandA' },
      ],
    } as any)
    assert.deepEqual(results.m1, { error: 'Circular connection' })
    assert.deepEqual(results.m2, { error: 'Circular connection' })
  })

  it('reports unknown node types', async () => {
    const results = await executePipeline({
      nodes: [{ id: 'x', type: 'telegramOutput', position: { x: 0, y: 0 }, data: { type: 'telegramOutput' } }],
      edges: [],
    } as any)
    assert.deepEqual(results.x, { error: 'Unknown node type' })
  })
})

describe('node definitions and executors', () => {
  it('every definition has an executor and every executor has a definition', () => {
    const defined = new Set(nodeDefinitions.map(d => d.type))
    const implemented = new Set(Object.keys(executors))
    assert.deepEqual([...defined].filter(t => !implemented.has(t)), [])
    assert.deepEqual([...implemented].filter(t => !defined.has(t)), [])
  })

  it('every params key has a matching defaultData key', () => {
    for (const def of nodeDefinitions) {
      for (const p of def.params ?? []) {
        assert.ok(p.key in def.defaultData, `${def.type}.${p.key} has a default`)
      }
    }
  })

  it('removed node types are gone', () => {
    const types = nodeDefinitions.map(d => d.type)
    for (const removed of ['multiSymbolInput', 'telegramOutput', 'emailOutput', 'valueScore']) {
      assert.ok(!types.includes(removed), removed)
      assert.equal((executors as any)[removed], undefined, `${removed} executor`)
    }
  })

  it('priceFeed says it fetches up to five years of daily history', () => {
    const def = nodeDefinitions.find(d => d.type === 'priceFeed')
    assert.ok(def)
    assert.match(def.description, /5 years/)
  })

  it('every primary key and output is produced on a happy-path run', async () => {
    const fund = { eps: 4, bookValuePerShare: 20, freeCashFlowPerShare: 2, netIncome: 1e9, freeCashFlow: 5e8, shares: 1e8, coverage: 1 }
    const hist = {
      points: [2021, 2022, 2023, 2024, 2025].flatMap(y => [0, 1, 2, 3].map(q => ({ asOf: `${y}-${String(3 * q + 3).padStart(2, '0')}-28`, eps: 4, bookValuePerShare: 20, freeCashFlowPerShare: 2 }))),
      current: fund,
    }
    const candles = series(400).map(p => ({ timestamp: p.timestamp / 1000, open: 1, high: 2, low: 0.5, close: p.value }))
    const pricesLong = series(365 * 6, i => 100 + i * 0.05 + Math.sin(i / 9) * 3, Date.UTC(2020, 0, 1))
    mockFetch((url) => {
      if (url.includes('/api/history')) return { body: candles }
      if (url.includes('/api/fundamentals/history')) return { body: hist }
      if (url.includes('/api/fundamentals')) return { body: fund }
      if (url.includes('/api/news')) return { body: [{ title: 'Stock rises on strong profit' }] }
      return { status: 404, body: {} }
    })
    const s = series(400)
    const fixtures: Record<string, ExecutionContext> = {
      symbolInput: ctx({ data: { symbol: 'AAPL' } }),
      currencyInput: ctx({ data: { from: 'USD', to: 'CLP' } }),
      scalarInput: ctx({ data: { value: 2 } }),
      priceFeed: ctx({ inputs: { symbol: 'AAPL' } }),
      smaIndicator: ctx({ inputs: { priceSeries: s }, data: { period: 20 } }),
      emaIndicator: ctx({ inputs: { priceSeries: s }, data: { period: 20 } }),
      rsiIndicator: ctx({ inputs: { priceSeries: s }, data: { period: 14 } }),
      kalmanFilter: ctx({ inputs: { priceSeries: s }, data: { smoothing: 'balanced' } }),
      zScore: ctx({ inputs: { priceSeries: s }, data: { window: 252 } }),
      normalize: ctx({ inputs: { priceSeries: s }, data: { window: '1Y' } }),
      forecastNode: ctx({ inputs: { priceSeries: s }, data: { model: 'auto', steps: 10 } }),
      fundamentals: ctx({ inputs: { symbol: 'AAPL' }, data: { asOf: '' } }),
      fairValue: ctx({ inputs: { symbol: 'AAPL', priceSeries: pricesLong } }),
      compareReference: ctx({ inputs: { priceSeries: s, reference: 90 }, data: { band: 2 } }),
      mathOp: ctx({ inputs: { operandA: 4, operandB: 2 }, data: { op: '/' } }),
      portfolioInput: ctx({ inputs: { in0: 1, in1: 3 }, data: { weights: [1, 1] } }),
      newsOutput: ctx({ inputs: { symbol: 'AAPL' } }),
      display: ctx({ inputs: { value: 1 } }),
      alertOutput: ctx({ inputs: { value: 1 }, data: {} }),
      chartOutput: ctx({ inputs: { mainSeries: s } }),
      candleChart: ctx({ inputs: { candleSeries: candles } }),
    }
    for (const def of nodeDefinitions) {
      const fixture = fixtures[def.type]
      assert.ok(fixture, `fixture for ${def.type}`)
      const out = await exec(def.type)(fixture)
      assert.equal(out.error, undefined, `${def.type} runs without error: ${out.error}`)
      if (def.primary) assert.ok(def.primary.key in out, `${def.type} primary ${def.primary.key}`)
      for (const o of def.outputs) assert.ok(o.id in out, `${def.type} output ${o.id}`)
    }
  })
})
