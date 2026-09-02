import { describe, it, before, mock } from 'node:test'
import assert from 'node:assert/strict'
import { calcSMA, calcRSI, calcEMA } from '../utils/indicators.ts'
import { runKalmanFilter, createDefaultParams, calibrateMLE } from '../utils/kalman.ts'
import type { ExecutionContext } from '../utils/pipeline/types.ts'

const prices = [100, 102, 101, 103, 105, 104, 106, 108, 107, 109, 110, 112, 111, 113, 115]

function mkCtx(overrides: Partial<ExecutionContext> = {}): ExecutionContext {
  return {
    nodeId: 'test',
    inputs: {},
    data: {},
    ...overrides,
  }
}

describe('indicators', () => {
  it('calcSMA returns correct length and values', () => {
    const sma = calcSMA(prices, 5)
    assert.equal(sma.length, prices.length)
    assert.equal(sma[3], 0) // first 4 (indices 0-3) are 0
    assert.equal(sma[4], (100 + 102 + 101 + 103 + 105) / 5)
    assert.ok(sma[sma.length - 1] > 0)
  })

  it('calcRSI returns values in 0-100 range', () => {
    const rsi = calcRSI(prices, 14)
    assert.equal(rsi.length, prices.length)
    assert.ok(rsi[rsi.length - 1] >= 0)
    assert.ok(rsi[rsi.length - 1] <= 100)
  })

  it('calcRSI with flat prices returns 50', () => {
    const flat = [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100]
    const rsi = calcRSI(flat, 14)
    assert.equal(rsi[rsi.length - 1], 50)
  })

  it('calcRSI is trend-direction aware', () => {
    const uptrend = [44, 44, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56]
    const downtrend = [56, 55, 54, 53, 52, 51, 50, 49, 48, 47, 46, 45, 44, 44, 44]
    const rsiUp = calcRSI(uptrend, 14)
    const rsiDown = calcRSI(downtrend, 14)
    assert.ok(rsiUp[rsiUp.length - 1] > 80)
    assert.ok(rsiDown[rsiDown.length - 1] < 20)
  })

  it('calcRSI all-gains returns 100', () => {
    const allGains = [100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114]
    const rsi = calcRSI(allGains, 14)
    assert.equal(rsi[rsi.length - 1], 100)
  })

  it('calcEMA returns correct length and first value', () => {
    const period = 5
    const ema = calcEMA(prices, period)
    assert.equal(ema.length, prices.length)
    assert.equal(ema[0], prices[0])
  })

  it('calcEMA with period 1 equals raw prices', () => {
    const ema = calcEMA(prices, 1)
    assert.deepEqual(ema, prices)
  })

  it('calcEMA recurrence matches known values', () => {
    const data = [10, 12, 11, 13, 14]
    const ema = calcEMA(data, 3)
    const k = 2 / (3 + 1)
    let expected = data[0]
    const known: number[] = []
    for (let i = 0; i < data.length; i++) {
      if (i === 0) {
        expected = data[0]
      } else {
        expected = data[i] * k + expected * (1 - k)
      }
      known.push(expected)
    }
    known.forEach((v, i) => assert.ok(Math.abs(ema[i] - v) < 1e-9))
  })

  it('calcRSI returns finite values within 0-100 for all samples', () => {
    const rsi = calcRSI(prices, 5)
    for (const v of rsi) {
      assert.ok(Number.isFinite(v))
      assert.ok(v >= 0 && v <= 100)
    }
  })
})

describe('kalman filter', () => {
  it('runKalmanFilter returns valid result structure', () => {
    const params = createDefaultParams()
    const result = runKalmanFilter(prices, params, 10)
    assert.ok(Array.isArray(result.smoothed))
    assert.ok(Array.isArray(result.trend))
    assert.ok(Array.isArray(result.cycle))
    assert.ok(Array.isArray(result.predicted))
    assert.ok(Array.isArray(result.confidence))
    assert.equal(result.smoothed.length, prices.length)
    assert.equal(result.predicted.length, 10)
    assert.ok(typeof result.logLikelihood === 'number')
  })

  it('calibrateMLE returns valid params', () => {
    const params = calibrateMLE(prices)
    assert.ok(params.phi >= 0.01 && params.phi <= 0.99)
    assert.ok(typeof params.mu === 'number')
    assert.ok(params.sigmaChi > 0)
    assert.ok(params.sigmaXi > 0)
    assert.ok(params.sigmaObs > 0)
  })

  it('short series (< 5) still returns with default params', () => {
    const short = [100, 101, 102]
    const params = createDefaultParams()
    const result = runKalmanFilter(short, params, 3)
    assert.ok(result.smoothed.length <= short.length)
  })

  it('calibrateMLE does not produce NaN on flat prices', () => {
    const flat = Array.from({ length: 110 }, (_, i) => 100)
    const params = calibrateMLE(flat)
    assert.ok(Number.isFinite(params.phi))
    assert.ok(Number.isFinite(params.mu))
    assert.ok(Number.isFinite(params.sigmaChi))
    assert.ok(Number.isFinite(params.sigmaXi))
    assert.ok(Number.isFinite(params.sigmaObs))
    const result = runKalmanFilter(flat, params, 5)
    for (const v of result.smoothed) {
      assert.ok(Number.isFinite(v))
    }
  })
})

describe('executors', () => {
  let executors: Record<string, (ctx: ExecutionContext) => any>
  let origFetch: typeof global.fetch

  before(async () => {
    origFetch = global.fetch
    const mod = await import('../utils/pipeline/runner.ts')
    executors = (mod as any).executors
  })

  it('symbolInput returns symbol from data', async () => {
    const result = await executors.symbolInput(mkCtx({ data: { symbol: 'GOOGL' } }))
    assert.equal(result.symbol, 'GOOGL')
  })

  it('symbolInput defaults to AAPL', async () => {
    const result = await executors.symbolInput(mkCtx({ data: {} }))
    assert.equal(result.symbol, 'AAPL')
  })

  it('priceFeed returns error when fetch fails', async () => {
    global.fetch = async () => ({ ok: false, status: 429, json: async () => ({ statusMessage: 'Rate limited' }) }) as any
    const ctx = mkCtx({ inputs: { symbol: 'TEST' } })
    const result = await executors.priceFeed(ctx)
    assert.ok(result.error)
    assert.equal(result.symbol, 'TEST')
    global.fetch = origFetch
  })

  it('priceFeed propagates symbol on success', async () => {
    global.fetch = async () => ({
      ok: true,
      json: async () => [{ close: 100 }, { close: 101 }, { close: 102 }],
    }) as any
    const ctx = mkCtx({ inputs: { symbol: 'AAPL' } })
    const result = await executors.priceFeed(ctx)
    assert.equal(result.symbol, 'AAPL')
    assert.equal(result.price, 102)
    assert.deepEqual(result.priceSeries, [100, 101, 102])
    global.fetch = origFetch
  })

  it('chartOutput passes through inputs', async () => {
    const ctx = mkCtx({ inputs: { price: 150, mainSeries: [100, 150], overlayA: [110, 140] } })
    const result = await executors.chartOutput(ctx)
    assert.equal(result.price, 150)
    assert.deepEqual(result.mainSeries, [100, 150])
    assert.deepEqual(result.overlayA, [110, 140])
  })

  it('priceDisplay returns price', async () => {
    const result = await executors.priceDisplay(mkCtx({ inputs: { price: 200 } }))
    assert.equal(result.price, 200)
  })

  it('alertOutput returns signal and threshold', async () => {
    const ctx = mkCtx({ inputs: { signal: 1 }, data: { threshold: 0.05 } })
    const result = await executors.alertOutput(ctx)
    assert.equal(result.signal, 1)
    assert.equal(result.threshold, 0.05)
  })

  it('smaIndicator calculates SMA from price series', async () => {
    const ctx = mkCtx({ inputs: { priceSeries: prices }, data: { period: 5 } })
    const result = await executors.smaIndicator(ctx)
    assert.ok(Array.isArray(result.smaSeries))
    assert.equal(result.smaSeries.length, prices.length)
  })

  it('smaIndicator returns error for short series', async () => {
    const ctx = mkCtx({ inputs: { priceSeries: [100] } })
    const result = await executors.smaIndicator(ctx)
    assert.ok(result.error)
  })

  it('rsiIndicator returns last RSI value and series', async () => {
    const ctx = mkCtx({ inputs: { priceSeries: prices }, data: { period: 14 } })
    const result = await executors.rsiIndicator(ctx)
    assert.ok(typeof result.rsiValue === 'number')
    assert.ok(Array.isArray(result.rsiSeries))
    assert.equal(result.rsiSeries.length, prices.length)
  })

  it('rsiIndicator returns error for short series', async () => {
    const ctx = mkCtx({ inputs: { priceSeries: [100] } })
    const result = await executors.rsiIndicator(ctx)
    assert.ok(result.error)
  })

  it('forecastNode returns forecast array', async () => {
    const ctx = mkCtx({ inputs: { priceSeries: prices }, data: { steps: 10 } })
    const result = await executors.forecastNode(ctx)
    assert.ok(Array.isArray(result.forecastSeries))
    assert.equal(result.forecastSeries.length, 10)
    assert.ok(Array.isArray(result.confidenceSeries))
    assert.equal(result.confidenceSeries.length, 10)
  })

  it('forecastNode values are positive and finite', async () => {
    const ctx = mkCtx({ inputs: { priceSeries: prices }, data: { steps: 10 } })
    const result = await executors.forecastNode(ctx)
    for (const v of result.forecastSeries) {
      assert.ok(Number.isFinite(v))
      assert.ok(v > 0)
    }
    for (const b of result.confidenceSeries) {
      assert.ok(Number.isFinite(b))
      assert.ok(b >= 0)
    }
  })

  it('forecastNode confidence bands expand with steps', async () => {
    const ctx = mkCtx({ inputs: { priceSeries: prices }, data: { steps: 10 } })
    const result = await executors.forecastNode(ctx)
    for (let i = 1; i < result.confidenceSeries.length; i++) {
      assert.ok(result.confidenceSeries[i] >= result.confidenceSeries[i - 1])
    }
  })

  it('forecastNode follows positive trend', async () => {
    const trending = Array.from({ length: 30 }, (_, i) => 100 + i * 2)
    const ctx = mkCtx({ inputs: { priceSeries: trending }, data: { steps: 10 } })
    const result = await executors.forecastNode(ctx)
    const lastSmoothed = result.forecastSeries[0] - (result.forecastSeries[1] - result.forecastSeries[0])
    assert.ok(result.forecastSeries[result.forecastSeries.length - 1] > lastSmoothed)
  })

  it('forecastNode returns error for short series', async () => {
    const ctx = mkCtx({ inputs: { priceSeries: [100, 101, 102] } })
    const result = await executors.forecastNode(ctx)
    assert.ok(result.error)
  })

  it('kalmanFilter returns smoothed, trend, signal', async () => {
    const ctx = mkCtx({ inputs: { priceSeries: prices } })
    const result = await executors.kalmanFilter(ctx)
    assert.ok(Array.isArray(result.smoothed))
    assert.ok(Array.isArray(result.trend))
    assert.ok(Array.isArray(result.cycle))
    assert.ok(result.signal === 1 || result.signal === -1)
    assert.equal(result.smoothed.length, prices.length)
  })

  it('kalmanFilter returns error for short series', async () => {
    const ctx = mkCtx({ inputs: { priceSeries: [100, 101] } })
    const result = await executors.kalmanFilter(ctx)
    assert.ok(result.error)
  })

  it('newsOutput returns error when fetch fails', async () => {
    global.fetch = async () => ({ ok: false, status: 500 }) as any
    const ctx = mkCtx({ inputs: { symbol: 'AAPL' } })
    const result = await executors.newsOutput(ctx)
    assert.ok(result.error)
    assert.equal(result.latest, '-')
    global.fetch = origFetch
  })

  it('newsOutput returns headlines on success', async () => {
    global.fetch = async () => ({
      ok: true,
      json: async () => [
        { title: 'AAPL surges' },
        { title: 'New iPhone released' },
      ],
    }) as any
    const ctx = mkCtx({ inputs: { symbol: 'AAPL' } })
    const result = await executors.newsOutput(ctx)
    assert.equal(result.count, 2)
    assert.equal(result.latest, 'AAPL surges')
    assert.deepEqual(result.headlines, ['AAPL surges', 'New iPhone released'])
    assert.equal(result.symbol, 'AAPL')
    global.fetch = origFetch
  })

  it('newsOutput handles empty articles', async () => {
    global.fetch = async () => ({
      ok: true,
      json: async () => [],
    }) as any
    const result = await executors.newsOutput(mkCtx({ inputs: { symbol: 'AAPL' } }))
    assert.equal(result.count, 0)
    assert.equal(result.latest, 'No recent news')
    global.fetch = origFetch
  })

  it('currencyInput returns symbol from data', async () => {
    const result = await executors.currencyInput(mkCtx({ data: { from: 'EUR', to: 'USD' } }))
    assert.equal(result.symbol, 'EURUSD=X')
  })

  it('currencyInput defaults to USDCLP', async () => {
    const result = await executors.currencyInput(mkCtx({ data: {} }))
    assert.equal(result.symbol, 'USDCLP=X')
  })

  it('candleChart passes candle series from candleSeries', async () => {
    const ohlcData = [{ open: 100, high: 105, low: 99, close: 103 }]
    const result = await executors.candleChart(mkCtx({ inputs: { candleSeries: ohlcData } }))
    assert.deepEqual(result.candleSeries, ohlcData)
  })

  it('candleChart passes overlay series', async () => {
    const ohlcData = [{ open: 100, high: 105, low: 99, close: 103 }]
    const overlay = [101, 102, 103]
    const result = await executors.candleChart(mkCtx({ inputs: { candleSeries: ohlcData, overlayA: overlay } }))
    assert.deepEqual(result.candleSeries, ohlcData)
    assert.deepEqual(result.overlayA, overlay)
  })

  it('candleChart returns null candle series with no input', async () => {
    const result = await executors.candleChart(mkCtx({ inputs: {} }))
    assert.equal(result.candleSeries, null)
  })

  it('emaIndicator calculates EMA from price series', async () => {
    const ctx = mkCtx({ inputs: { priceSeries: prices }, data: { period: 5 } })
    const result = await executors.emaIndicator(ctx)
    assert.ok(Array.isArray(result.emaSeries))
    assert.equal(result.emaSeries.length, prices.length)
  })

  it('emaIndicator returns error for short series', async () => {
    const ctx = mkCtx({ inputs: { priceSeries: [100] } })
    const result = await executors.emaIndicator(ctx)
    assert.ok(result.error)
  })

  it('scalarInput returns value from data', async () => {
    const result = await executors.scalarInput(mkCtx({ data: { value: 42 } }))
    assert.equal(result.scalar, 42)
  })

  it('scalarInput defaults to 1', async () => {
    const result = await executors.scalarInput(mkCtx({ data: {} }))
    assert.equal(result.scalar, 1)
  })

  it('mathOp adds two scalars', async () => {
    const result = await executors.mathOp(mkCtx({ inputs: { operandA: 10, operandB: 5 }, data: { op: '+' } }))
    assert.equal(result.scalar, 15)
  })

  it('mathOp subtracts scalars', async () => {
    const result = await executors.mathOp(mkCtx({ inputs: { operandA: 10, operandB: 5 }, data: { op: '-' } }))
    assert.equal(result.scalar, 5)
  })

  it('mathOp multiplies scalars', async () => {
    const result = await executors.mathOp(mkCtx({ inputs: { operandA: 10, operandB: 5 }, data: { op: '*' } }))
    assert.equal(result.scalar, 50)
  })

  it('mathOp divides scalars', async () => {
    const result = await executors.mathOp(mkCtx({ inputs: { operandA: 10, operandB: 5 }, data: { op: '/' } }))
    assert.equal(result.scalar, 2)
  })

  it('mathOp handles division by zero', async () => {
    const result = await executors.mathOp(mkCtx({ inputs: { operandA: 10, operandB: 0 }, data: { op: '/' } }))
    assert.equal(result.scalar, 0)
  })

  it('mathOp defaults to addition when op is missing', async () => {
    const result = await executors.mathOp(mkCtx({ inputs: { operandA: 10, operandB: 5 }, data: {} }))
    assert.equal(result.scalar, 15)
  })

  it('mathOp adds two arrays element-wise', async () => {
    const result = await executors.mathOp(mkCtx({ inputs: { operandA: [1, 2, 3], operandB: [4, 5, 6] }, data: { op: '+' } }))
    assert.ok(Array.isArray(result.scalar))
    assert.deepEqual(result.scalar, [5, 7, 9])
  })

  it('mathOp subtracts two arrays', async () => {
    const result = await executors.mathOp(mkCtx({ inputs: { operandA: [10, 20, 30], operandB: [1, 2, 3] }, data: { op: '-' } }))
    assert.ok(Array.isArray(result.scalar))
    assert.deepEqual(result.scalar, [9, 18, 27])
  })

  it('mathOp multiplies two arrays element-wise', async () => {
    const result = await executors.mathOp(mkCtx({ inputs: { operandA: [2, 3, 4], operandB: [5, 6, 7] }, data: { op: '*' } }))
    assert.deepEqual(result.scalar, [10, 18, 28])
  })

  it('mathOp divides two arrays element-wise', async () => {
    const result = await executors.mathOp(mkCtx({ inputs: { operandA: [10, 20, 30], operandB: [2, 4, 5] }, data: { op: '/' } }))
    assert.deepEqual(result.scalar, [5, 5, 6])
  })

  it('portfolioInput computes weighted average', async () => {
    const result = await executors.portfolioInput(mkCtx({
      inputs: { operandA: 100, operandB: 200 },
      data: { weights: [2, 1] },
    }))
    assert.equal(result.scalar, (100 * 2 + 200 * 1) / 3)
  })

  it('portfolioInput handles single input', async () => {
    const result = await executors.portfolioInput(mkCtx({
      inputs: { operandA: 150 },
      data: { weights: [1] },
    }))
    assert.equal(result.scalar, 150)
  })

  it('portfolioInput handles more than two inputs', async () => {
    const result = await executors.portfolioInput(mkCtx({
      inputs: { operandA: 100, operandB: 200, operandC: 300 },
      data: { weights: [1, 1, 2] },
    }))
    assert.equal(result.scalar, (100 * 1 + 200 * 1 + 300 * 2) / 4)
  })

  it('portfolioInput returns 0 with no inputs', async () => {
    const result = await executors.portfolioInput(mkCtx({ data: { weights: [1, 1] } }))
    assert.equal(result.scalar, 0)
  })
})

describe('full pipeline execution', () => {
  let executePipeline: Function

  before(async () => {
    const mod = await import('../utils/pipeline/runner.ts')
    executePipeline = mod.executePipeline
  })

  it('executes simple symbolInput → priceDisplay', async () => {
    const spec = {
      nodes: [
        { id: 's1', type: 'symbolInput', position: { x: 0, y: 0 }, data: { symbol: 'AAPL' } },
        { id: 'd1', type: 'priceDisplay', position: { x: 200, y: 0 }, data: {} },
      ],
      edges: [
        { id: 'e1', source: 's1', target: 'd1' },
      ],
    }
    const results = await executePipeline(spec)
    assert.ok(results.s1)
    assert.equal(results.s1.symbol, 'AAPL')
    assert.ok(results.d1)
  })

  it('executes symbolInput → priceDisplay without edges', async () => {
    const spec = {
      nodes: [
        { id: 's1', type: 'symbolInput', position: { x: 0, y: 0 }, data: {} },
      ],
      edges: [],
    }
    const results = await executePipeline(spec)
    assert.equal(results.s1.symbol, 'AAPL')
  })

  it('handles disconnected nodes gracefully', async () => {
    const spec = {
      nodes: [
        { id: 'n1', type: 'symbolInput', position: { x: 0, y: 0 }, data: {} },
        { id: 'n2', type: 'priceDisplay', position: { x: 200, y: 0 }, data: {} },
      ],
      edges: [],
    }
    const results = await executePipeline(spec)
    assert.ok(results.n1)
    assert.equal(results.n2.price, null)
  })

  it('runs SMA + RSI pipeline with mock fetch', async () => {
    const origFetch = global.fetch
    global.fetch = async () => ({
      ok: true,
      json: async () => prices.map(p => ({ close: p })),
    }) as any

    const spec = {
      nodes: [
        { id: 's1', type: 'symbolInput', position: { x: 0, y: 0 }, data: { symbol: 'AAPL' } },
        { id: 'pf1', type: 'priceFeed', position: { x: 200, y: 0 }, data: {} },
        { id: 'sma1', type: 'smaIndicator', position: { x: 400, y: -80 }, data: { period: 5 } },
        { id: 'rsi1', type: 'rsiIndicator', position: { x: 400, y: 80 }, data: { period: 14 } },
      ],
      edges: [
        { id: 'e1', source: 's1', target: 'pf1' },
        { id: 'e2', source: 'pf1', target: 'sma1' },
        { id: 'e3', source: 'pf1', target: 'rsi1' },
      ],
    }
    const results = await executePipeline(spec)
    assert.ok(results.pf1.price > 0)
    assert.ok(results.pf1.symbol === 'AAPL')
    assert.ok(results.sma1.smaSeries.length > 0)
    assert.ok(typeof results.rsi1.rsiValue === 'number')
    global.fetch = origFetch
  })

  it('handles unregistered node types gracefully', async () => {
    const spec = {
      nodes: [
        { id: 'n1', type: 'multiSymbolInput', position: { x: 0, y: 0 }, data: {} },
        { id: 'n2', type: 'telegramOutput', position: { x: 200, y: 0 }, data: {} },
        { id: 'n3', type: 'emailOutput', position: { x: 300, y: 0 }, data: {} },
      ],
      edges: [],
    }
    const results = await executePipeline(spec)
    assert.deepEqual(results, {})
  })

  it('handles circular edges without crashing', async () => {
    const spec = {
      nodes: [
        { id: 'a', type: 'symbolInput', position: { x: 0, y: 0 }, data: {} },
        { id: 'b', type: 'priceDisplay', position: { x: 200, y: 0 }, data: {} },
      ],
      edges: [
        { id: 'e1', source: 'a', target: 'b' },
        { id: 'e2', source: 'b', target: 'a' },
      ],
    }
    const results = await executePipeline(spec)
    assert.equal(Object.keys(results).length, 0)
  })

  it('handles node with executor that throws', async () => {
    const fetchBefore = global.fetch
    global.fetch = async () => { throw new Error('Network error') }
    const spec = {
      nodes: [
        { id: 'n1', type: 'symbolInput', position: { x: 0, y: 0 }, data: { symbol: 'TEST' } },
        { id: 'n2', type: 'priceFeed', position: { x: 200, y: 0 }, data: {} },
      ],
      edges: [{ id: 'e1', source: 'n1', target: 'n2' }],
    }
    const results = await executePipeline(spec)
    assert.ok(results.n1)
    assert.equal(results.n1.symbol, 'TEST')
    assert.ok(results.n2.error)
    assert.equal(results.n2.symbol, 'TEST')
    global.fetch = fetchBefore
  })

  it('runs scalarInput → mathOp → priceDisplay pipeline', async () => {
    const spec = {
      nodes: [
        { id: 's1', type: 'scalarInput', position: { x: 0, y: 0 }, data: { value: 1.2 } },
        { id: 'h1', type: 'scalarInput', position: { x: 0, y: 80 }, data: { value: 2 } },
        { id: 'm1', type: 'mathOp', position: { x: 200, y: 0 }, data: { op: '*' } },
        { id: 'p1', type: 'priceDisplay', position: { x: 400, y: 0 }, data: {} },
      ],
      edges: [
        { id: 'e1', source: 's1', target: 'm1', sourceHandle: 'scalar', targetHandle: 'operandA' },
        { id: 'e2', source: 'h1', target: 'm1', sourceHandle: 'scalar', targetHandle: 'operandB' },
        { id: 'e3', source: 'm1', target: 'p1', sourceHandle: 'scalar', targetHandle: 'price' },
      ],
    }
    const results = await executePipeline(spec)
    assert.equal(results.s1.scalar, 1.2)
    assert.equal(results.m1.scalar, 2.4)
    assert.equal(results.p1.price, 2.4)
  })

  it('runs scalarInput → mathOp (subtract) pipeline', async () => {
    const spec = {
      nodes: [
        { id: 'a', type: 'scalarInput', position: { x: 0, y: 0 }, data: { value: 100 } },
        { id: 'b', type: 'scalarInput', position: { x: 0, y: 80 }, data: { value: 30 } },
        { id: 'm', type: 'mathOp', position: { x: 200, y: 0 }, data: { op: '-' } },
      ],
      edges: [
        { id: 'e1', source: 'a', target: 'm', sourceHandle: 'scalar', targetHandle: 'operandA' },
        { id: 'e2', source: 'b', target: 'm', sourceHandle: 'scalar', targetHandle: 'operandB' },
      ],
    }
    const results = await executePipeline(spec)
    assert.equal(results.m.scalar, 70)
  })

  it('runs portfolioInput pipeline', async () => {
    const spec = {
      nodes: [
        { id: 'a', type: 'scalarInput', position: { x: 0, y: 0 }, data: { value: 100 } },
        { id: 'b', type: 'scalarInput', position: { x: 0, y: 80 }, data: { value: 200 } },
        { id: 'p', type: 'portfolioInput', position: { x: 200, y: 0 }, data: { weights: [2, 1] } },
        { id: 'd', type: 'priceDisplay', position: { x: 400, y: 0 }, data: {} },
      ],
      edges: [
        { id: 'e1', source: 'a', target: 'p', sourceHandle: 'scalar', targetHandle: 'operandA' },
        { id: 'e2', source: 'b', target: 'p', sourceHandle: 'scalar', targetHandle: 'operandB' },
        { id: 'e3', source: 'p', target: 'd', sourceHandle: 'scalar', targetHandle: 'price' },
      ],
    }
    const results = await executePipeline(spec)
    const expected = (100 * 2 + 200 * 1) / 3
    assert.equal(results.p.scalar, expected)
    assert.equal(results.d.price, expected)
  })

  it('runs SMA + EMA + candleChart pipeline with mock fetch', async () => {
    const origFetch = global.fetch
    global.fetch = async () => ({
      ok: true,
      json: async () => prices.map(p => ({ close: p, open: p - 1, high: p + 1, low: p - 2 })),
    }) as any

    const spec = {
      nodes: [
        { id: 's1', type: 'symbolInput', position: { x: 0, y: 0 }, data: { symbol: 'AAPL' } },
        { id: 'pf1', type: 'priceFeed', position: { x: 200, y: 0 }, data: {} },
        { id: 'sma1', type: 'smaIndicator', position: { x: 400, y: -80 }, data: { period: 5 } },
        { id: 'ema1', type: 'emaIndicator', position: { x: 400, y: 0 }, data: { period: 10 } },
        { id: 'cc1', type: 'candleChart', position: { x: 600, y: 0 }, data: {} },
      ],
      edges: [
        { id: 'e1', source: 's1', target: 'pf1' },
        { id: 'e2', source: 'pf1', target: 'sma1', sourceHandle: 'priceSeries', targetHandle: 'priceSeries' },
        { id: 'e3', source: 'pf1', target: 'ema1', sourceHandle: 'priceSeries', targetHandle: 'priceSeries' },
        { id: 'e4', source: 'pf1', target: 'cc1', sourceHandle: 'candleSeries', targetHandle: 'candleSeries' },
        { id: 'e5', source: 'sma1', target: 'cc1', sourceHandle: 'smaSeries', targetHandle: 'overlayA' },
      ],
    }
    const results = await executePipeline(spec)
    assert.ok(results.pf1.price > 0)
    assert.ok(results.sma1.smaSeries.length > 0)
    assert.ok(results.ema1.emaSeries.length > 0)
    assert.ok(results.cc1.candleSeries)
    assert.equal(results.cc1.candleSeries.length, prices.length)
    assert.ok(results.cc1.overlayA)
    global.fetch = origFetch
  })
})
