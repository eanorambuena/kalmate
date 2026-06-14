import { describe, it, before, mock } from 'node:test'
import assert from 'node:assert/strict'
import { calcSMA, calcRSI } from '../utils/indicators.ts'
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

  it('calcRSI with flat prices returns 100', () => {
    const flat = [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100]
    const rsi = calcRSI(flat, 14)
    assert.equal(rsi[rsi.length - 1], 100)
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
    assert.deepEqual(result.history, [100, 101, 102])
    global.fetch = origFetch
  })

  it('chartOutput passes through inputs', async () => {
    const ctx = mkCtx({ inputs: { price: 150, history: [100, 150], smoothed: [110, 140] } })
    const result = await executors.chartOutput(ctx)
    assert.equal(result.price, 150)
    assert.deepEqual(result.history, [100, 150])
    assert.deepEqual(result.smoothed, [110, 140])
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

  it('smaIndicator calculates SMA from history', async () => {
    const ctx = mkCtx({ inputs: { history: prices }, data: { period: 5 } })
    const result = await executors.smaIndicator(ctx)
    assert.ok(Array.isArray(result.sma))
    assert.equal(result.sma.length, prices.length)
  })

  it('smaIndicator returns error for short series', async () => {
    const ctx = mkCtx({ inputs: { history: [100] } })
    const result = await executors.smaIndicator(ctx)
    assert.ok(result.error)
  })

  it('rsiIndicator returns last RSI value and history', async () => {
    const ctx = mkCtx({ inputs: { history: prices }, data: { period: 14 } })
    const result = await executors.rsiIndicator(ctx)
    assert.ok(typeof result.rsi === 'number')
    assert.ok(Array.isArray(result.rsi_history))
    assert.equal(result.rsi_history.length, prices.length)
  })

  it('rsiIndicator returns error for short series', async () => {
    const ctx = mkCtx({ inputs: { history: [100] } })
    const result = await executors.rsiIndicator(ctx)
    assert.ok(result.error)
  })

  it('forecastNode returns forecast array', async () => {
    const ctx = mkCtx({ inputs: { history: prices }, data: { steps: 10 } })
    const result = await executors.forecastNode(ctx)
    assert.ok(Array.isArray(result.forecast))
    assert.equal(result.forecast.length, 10)
    assert.ok(Array.isArray(result.confidence))
    assert.equal(result.confidence.length, 10)
  })

  it('forecastNode returns error for short series', async () => {
    const ctx = mkCtx({ inputs: { history: [100, 101, 102] } })
    const result = await executors.forecastNode(ctx)
    assert.ok(result.error)
  })

  it('kalmanFilter returns smoothed, trend, cycle, signal', async () => {
    const ctx = mkCtx({ inputs: { history: prices } })
    const result = await executors.kalmanFilter(ctx)
    assert.ok(Array.isArray(result.smoothed))
    assert.ok(Array.isArray(result.trend))
    assert.ok(Array.isArray(result.cycle))
    assert.ok(result.signal === 1 || result.signal === -1)
    assert.equal(result.smoothed.length, prices.length)
  })

  it('kalmanFilter returns error for short series', async () => {
    const ctx = mkCtx({ inputs: { history: [100, 101] } })
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
    assert.equal(result.latest, 'Sin noticias recientes')
    global.fetch = origFetch
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
    assert.ok(results.sma1.sma.length > 0)
    assert.ok(typeof results.rsi1.rsi === 'number')
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
})
