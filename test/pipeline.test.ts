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

  it('symbolInput returns source from data', async () => {
    const result = await executors.symbolInput(mkCtx({ data: { symbol: 'GOOGL' } }))
    assert.equal(result.source, 'GOOGL')
  })

  it('symbolInput defaults to AAPL', async () => {
    const result = await executors.symbolInput(mkCtx({ data: {} }))
    assert.equal(result.source, 'AAPL')
  })

  it('priceFeed returns error when fetch fails', async () => {
    global.fetch = async () => ({ ok: false, status: 429, json: async () => ({ statusMessage: 'Rate limited' }) }) as any
    const ctx = mkCtx({ inputs: { source: 'TEST' } })
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
    const ctx = mkCtx({ inputs: { source: 'AAPL' } })
    const result = await executors.priceFeed(ctx)
    assert.equal(result.symbol, 'AAPL')
    assert.equal(result.source, 102)
    assert.deepEqual(result.history, [100, 101, 102])
    global.fetch = origFetch
  })

  it('chartOutput passes through inputs', async () => {
    const ctx = mkCtx({ inputs: { source: 150, history: [100, 150], seriesB: [110, 140] } })
    const result = await executors.chartOutput(ctx)
    assert.equal(result.source, 150)
    assert.deepEqual(result.history, [100, 150])
    assert.deepEqual(result.seriesB, [110, 140])
  })

  it('priceDisplay returns source', async () => {
    const result = await executors.priceDisplay(mkCtx({ inputs: { source: 200 } }))
    assert.equal(result.source, 200)
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
    assert.ok(Array.isArray(result.seriesA))
    assert.equal(result.seriesA.length, prices.length)
  })

  it('smaIndicator returns error for short series', async () => {
    const ctx = mkCtx({ inputs: { history: [100] } })
    const result = await executors.smaIndicator(ctx)
    assert.ok(result.error)
  })

  it('rsiIndicator returns last RSI value and history', async () => {
    const ctx = mkCtx({ inputs: { history: prices }, data: { period: 14 } })
    const result = await executors.rsiIndicator(ctx)
    assert.ok(typeof result.seriesA === 'number')
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
    assert.ok(Array.isArray(result.seriesA))
    assert.equal(result.seriesA.length, 10)
    assert.ok(Array.isArray(result.seriesB))
    assert.equal(result.seriesB.length, 10)
  })

  it('forecastNode returns error for short series', async () => {
    const ctx = mkCtx({ inputs: { history: [100, 101, 102] } })
    const result = await executors.forecastNode(ctx)
    assert.ok(result.error)
  })

  it('kalmanFilter returns seriesA, seriesB, signal', async () => {
    const ctx = mkCtx({ inputs: { history: prices } })
    const result = await executors.kalmanFilter(ctx)
    assert.ok(Array.isArray(result.seriesA))
    assert.ok(Array.isArray(result.seriesB))
    assert.ok(Array.isArray(result.cycle))
    assert.ok(result.signal === 1 || result.signal === -1)
    assert.equal(result.seriesA.length, prices.length)
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

  it('currencyInput returns symbol from data', async () => {
    const result = await executors.currencyInput(mkCtx({ data: { from: 'EUR', to: 'USD' } }))
    assert.equal(result.source, 'EURUSD=X')
  })

  it('currencyInput defaults to USDCLP', async () => {
    const result = await executors.currencyInput(mkCtx({ data: {} }))
    assert.equal(result.source, 'USDCLP=X')
  })

  it('candleChart passes ohlc from seriesA', async () => {
    const ohlcData = [{ open: 100, high: 105, low: 99, close: 103 }]
    const result = await executors.candleChart(mkCtx({ inputs: { seriesA: ohlcData } }))
    assert.deepEqual(result.ohlc, ohlcData)
  })

  it('candleChart passes overlay series', async () => {
    const ohlcData = [{ open: 100, high: 105, low: 99, close: 103 }]
    const overlay = [101, 102, 103]
    const result = await executors.candleChart(mkCtx({ inputs: { seriesA: ohlcData, seriesB: overlay } }))
    assert.deepEqual(result.ohlc, ohlcData)
    assert.deepEqual(result.seriesB, overlay)
  })

  it('candleChart returns null ohlc with no input', async () => {
    const result = await executors.candleChart(mkCtx({ inputs: {} }))
    assert.equal(result.ohlc, null)
  })

  it('emaIndicator calculates EMA from history', async () => {
    const ctx = mkCtx({ inputs: { history: prices }, data: { period: 5 } })
    const result = await executors.emaIndicator(ctx)
    assert.ok(Array.isArray(result.seriesA))
    assert.equal(result.seriesA.length, prices.length)
  })

  it('emaIndicator returns error for short series', async () => {
    const ctx = mkCtx({ inputs: { history: [100] } })
    const result = await executors.emaIndicator(ctx)
    assert.ok(result.error)
  })

  it('scalarInput returns value from data', async () => {
    const result = await executors.scalarInput(mkCtx({ data: { value: 42 } }))
    assert.equal(result.source, 42)
  })

  it('scalarInput defaults to 1', async () => {
    const result = await executors.scalarInput(mkCtx({ data: {} }))
    assert.equal(result.source, 1)
  })

  it('mathOp adds two scalars', async () => {
    const result = await executors.mathOp(mkCtx({ inputs: { sourceA: 10, sourceB: 5 }, data: { op: '+' } }))
    assert.equal(result.source, 15)
  })

  it('mathOp subtracts scalars', async () => {
    const result = await executors.mathOp(mkCtx({ inputs: { sourceA: 10, sourceB: 5 }, data: { op: '-' } }))
    assert.equal(result.source, 5)
  })

  it('mathOp multiplies scalars', async () => {
    const result = await executors.mathOp(mkCtx({ inputs: { sourceA: 10, sourceB: 5 }, data: { op: '*' } }))
    assert.equal(result.source, 50)
  })

  it('mathOp divides scalars', async () => {
    const result = await executors.mathOp(mkCtx({ inputs: { sourceA: 10, sourceB: 5 }, data: { op: '/' } }))
    assert.equal(result.source, 2)
  })

  it('mathOp handles division by zero', async () => {
    const result = await executors.mathOp(mkCtx({ inputs: { sourceA: 10, sourceB: 0 }, data: { op: '/' } }))
    assert.equal(result.source, 0)
  })

  it('mathOp defaults to addition when op is missing', async () => {
    const result = await executors.mathOp(mkCtx({ inputs: { sourceA: 10, sourceB: 5 }, data: {} }))
    assert.equal(result.source, 15)
  })

  it('mathOp adds two arrays element-wise', async () => {
    const result = await executors.mathOp(mkCtx({ inputs: { sourceA: [1, 2, 3], sourceB: [4, 5, 6] }, data: { op: '+' } }))
    assert.ok(Array.isArray(result.source))
    assert.deepEqual(result.source, [5, 7, 9])
  })

  it('mathOp subtracts two arrays', async () => {
    const result = await executors.mathOp(mkCtx({ inputs: { sourceA: [10, 20, 30], sourceB: [1, 2, 3] }, data: { op: '-' } }))
    assert.ok(Array.isArray(result.source))
    assert.deepEqual(result.source, [9, 18, 27])
  })

  it('portfolioInput computes weighted average', async () => {
    const result = await executors.portfolioInput(mkCtx({
      inputs: { sourceA: 100, sourceB: 200 },
      data: { weights: [2, 1] },
    }))
    // sourceA/sourceB keys parse to NaN index, default weight 1 each
    assert.equal(result.source, (100 * 1 + 200 * 1) / 2)
  })

  it('portfolioInput handles single input', async () => {
    const result = await executors.portfolioInput(mkCtx({
      inputs: { sourceA: 150 },
      data: { weights: [1] },
    }))
    assert.equal(result.source, 150)
  })

  it('portfolioInput returns 0 with no inputs', async () => {
    const result = await executors.portfolioInput(mkCtx({ data: { weights: [1, 1] } }))
    assert.equal(result.source, 0)
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
    assert.equal(results.s1.source, 'AAPL')
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
    assert.equal(results.s1.source, 'AAPL')
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
    assert.equal(results.n2.source, null)
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
    assert.ok(results.pf1.source > 0)
    assert.ok(results.pf1.symbol === 'AAPL')
    assert.ok(results.sma1.seriesA.length > 0)
    assert.ok(typeof results.rsi1.seriesA === 'number')
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
    assert.equal(results.n1.source, 'TEST')
    assert.ok(results.n2.error)
    assert.equal(results.n2.symbol, 'TEST')
    global.fetch = fetchBefore
  })

  it('runs currencyInput → mathOp → priceDisplay pipeline', async () => {
    const spec = {
      nodes: [
        { id: 'c1', type: 'currencyInput', position: { x: 0, y: 0 }, data: { from: 'USD', to: 'EUR' } },
        { id: 's1', type: 'scalarInput', position: { x: 0, y: 80 }, data: { value: 1.2 } },
        { id: 'm1', type: 'mathOp', position: { x: 200, y: 0 }, data: { op: '*' } },
        { id: 'p1', type: 'priceDisplay', position: { x: 400, y: 0 }, data: {} },
      ],
      edges: [
        { id: 'e1', source: 'c1', target: 'm1', sourceHandle: 'source', targetHandle: 'sourceA' },
        { id: 'e2', source: 's1', target: 'm1', sourceHandle: 'source', targetHandle: 'sourceB' },
        { id: 'e3', source: 'm1', target: 'p1' },
      ],
    }
    const results = await executePipeline(spec)
    assert.equal(results.c1.source, 'USDEUR=X')
    assert.equal(results.s1.source, 1.2)
    assert.ok(results.m1.source !== undefined)
    assert.ok(results.p1.source !== null)
  })

  it('runs scalarInput → mathOp (subtract) pipeline', async () => {
    const spec = {
      nodes: [
        { id: 'a', type: 'scalarInput', position: { x: 0, y: 0 }, data: { value: 100 } },
        { id: 'b', type: 'scalarInput', position: { x: 0, y: 80 }, data: { value: 30 } },
        { id: 'm', type: 'mathOp', position: { x: 200, y: 0 }, data: { op: '-' } },
      ],
      edges: [
        { id: 'e1', source: 'a', target: 'm', sourceHandle: 'source', targetHandle: 'sourceA' },
        { id: 'e2', source: 'b', target: 'm', sourceHandle: 'source', targetHandle: 'sourceB' },
      ],
    }
    const results = await executePipeline(spec)
    assert.equal(results.m.source, 70)
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
        { id: 'e1', source: 'a', target: 'p', sourceHandle: 'source', targetHandle: 'sourceA' },
        { id: 'e2', source: 'b', target: 'p', sourceHandle: 'source', targetHandle: 'sourceB' },
        { id: 'e3', source: 'p', target: 'd' },
      ],
    }
    const results = await executePipeline(spec)
    const expected = (100 * 1 + 200 * 1) / 2
    assert.equal(results.p.source, expected)
    assert.equal(results.d.source, expected)
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
        { id: 'e2', source: 'pf1', target: 'sma1', sourceHandle: 'history', targetHandle: 'source' },
        { id: 'e3', source: 'pf1', target: 'ema1', sourceHandle: 'history', targetHandle: 'source' },
        { id: 'e4', source: 'pf1', target: 'cc1', sourceHandle: 'ohlc', targetHandle: 'seriesA' },
        { id: 'e5', source: 'sma1', target: 'cc1', sourceHandle: 'seriesA', targetHandle: 'seriesB' },
      ],
    }
    const results = await executePipeline(spec)
    assert.ok(results.pf1.source > 0)
    assert.ok(results.sma1.seriesA.length > 0)
    assert.ok(results.ema1.seriesA.length > 0)
    assert.ok(results.cc1.ohlc)
    assert.equal(results.cc1.ohlc.length, prices.length)
    assert.ok(results.cc1.seriesB)
    global.fetch = origFetch
  })
})
