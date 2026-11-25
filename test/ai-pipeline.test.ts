import { describe, it, before, mock } from 'node:test'
import assert from 'node:assert/strict'
import { validatePlan, buildNodeCatalog } from '../utils/pipeline/plan.ts'
import { nodeDefinitions } from '../utils/pipeline/nodeDefinitions.ts'

const g = globalThis as any

const validPlan = () => ({
  nodes: [
    { type: 'symbolInput', data: { symbol: 'AAPL' } },
    { type: 'priceFeed', data: {} },
    { type: 'chartOutput', data: {} },
  ],
  edges: [
    { source: 0, target: 1, sourceHandle: 'symbol', targetHandle: 'symbol' },
    { source: 1, target: 2, sourceHandle: 'priceSeries', targetHandle: 'mainSeries' },
  ],
})

describe('validatePlan', () => {
  it('accepts a well-formed plan', () => {
    assert.deepEqual(validatePlan(validPlan()), { ok: true })
  })

  it('accepts a plan without edges', () => {
    assert.deepEqual(validatePlan({ nodes: [{ type: 'symbolInput' }], edges: [] }), { ok: true })
  })

  it('rejects non-object input and an empty node list', () => {
    assert.equal(validatePlan(null).ok, false)
    assert.equal(validatePlan('plan').ok, false)
    assert.equal(validatePlan({ nodes: [], edges: [] }).ok, false)
    assert.equal(validatePlan({ edges: [] }).ok, false)
  })

  it('rejects an unknown node type', () => {
    const p = validPlan()
    p.nodes[1].type = 'telegramOutput'
    assert.equal(validatePlan(p).ok, false)
  })

  it('rejects removed node types', () => {
    for (const type of ['multiSymbolInput', 'emailOutput', 'valueScore', 'priceDisplay']) {
      assert.equal(validatePlan({ nodes: [{ type }], edges: [] }).ok, false, type)
    }
  })

  it('rejects node data that is not an object', () => {
    const p: any = validPlan()
    p.nodes[0].data = 'AAPL'
    assert.equal(validatePlan(p).ok, false)
  })

  it('rejects edge indices that are out of range, fractional or equal', () => {
    const outOfRange = validPlan()
    outOfRange.edges[0].target = 9
    assert.equal(validatePlan(outOfRange).ok, false)

    const fractional = validPlan()
    fractional.edges[0].source = 0.5
    assert.equal(validatePlan(fractional).ok, false)

    const selfLoop = validPlan()
    selfLoop.edges[0].target = 0
    assert.equal(validatePlan(selfLoop).ok, false)
  })

  it('rejects handles that the node does not declare', () => {
    const badSource = validPlan()
    badSource.edges[0].sourceHandle = 'price'
    assert.equal(validatePlan(badSource).ok, false)

    const badTarget = validPlan()
    badTarget.edges[1].targetHandle = 'overlayD'
    assert.equal(validatePlan(badTarget).ok, false)
  })

  it('accepts any in<number> handle on Weighted Average and rejects other names', () => {
    const p = {
      nodes: [
        { type: 'rsiIndicator', data: {} },
        { type: 'smaIndicator', data: {} },
        { type: 'portfolioInput', data: { weights: [1, 1, 1] } },
      ],
      edges: [
        { source: 0, target: 2, sourceHandle: 'rsiValue', targetHandle: 'in0' },
        { source: 1, target: 2, sourceHandle: 'smaSeries', targetHandle: 'in7' },
      ],
    }
    // rsiValue/smaSeries types are signal/series; both are accepted by 'any' inputs.
    assert.deepEqual(validatePlan(p), { ok: true })
    p.edges[1].targetHandle = 'inX'
    assert.equal(validatePlan(p).ok, false)
  })

  it('rejects incompatible port types', () => {
    const p = {
      nodes: [
        { type: 'symbolInput', data: {} },
        { type: 'smaIndicator', data: {} },
      ],
      // symbol -> series is not allowed
      edges: [{ source: 0, target: 1, sourceHandle: 'symbol', targetHandle: 'priceSeries' }],
    }
    assert.equal(validatePlan(p).ok, false)
  })

  it('rejects two edges into the same input', () => {
    const p = validPlan()
    p.nodes.push({ type: 'priceFeed', data: {} })
    p.edges.push({ source: 3, target: 2, sourceHandle: 'priceSeries', targetHandle: 'mainSeries' })
    assert.equal(validatePlan(p).ok, false)
  })

  it('allows one output to feed several different inputs', () => {
    const p = {
      nodes: [
        { type: 'symbolInput', data: {} },
        { type: 'priceFeed', data: {} },
        { type: 'smaIndicator', data: {} },
        { type: 'chartOutput', data: {} },
      ],
      edges: [
        { source: 0, target: 1, sourceHandle: 'symbol', targetHandle: 'symbol' },
        { source: 1, target: 2, sourceHandle: 'priceSeries', targetHandle: 'priceSeries' },
        { source: 1, target: 3, sourceHandle: 'priceSeries', targetHandle: 'mainSeries' },
      ],
    }
    assert.deepEqual(validatePlan(p), { ok: true })
  })
})

describe('buildNodeCatalog', () => {
  it('lists every node definition with its exact handle ids', () => {
    const text = buildNodeCatalog()
    for (const def of nodeDefinitions) {
      assert.ok(text.includes(`"${def.type}"`), `missing ${def.type}`)
      for (const p of def.inputs) assert.ok(text.includes(p.id), `missing input ${p.id}`)
      for (const p of def.outputs) assert.ok(text.includes(p.id), `missing output ${p.id}`)
    }
    assert.ok(!text.includes('multiSymbolInput'))
    assert.ok(!text.includes('telegramOutput'))
  })
})

describe('local keyword generator plans', () => {
  let useAIPipeline: typeof import('../composables/useAIPipeline.ts').useAIPipeline
  before(async () => {
    ;({ useAIPipeline } = await import('../composables/useAIPipeline.ts'))
  })

  async function plan(query: string): Promise<any> {
    g.$fetch = mock.fn(async () => { throw new Error('offline') })
    return useAIPipeline().generate(query)
  }

  const QUERIES = [
    'is AAPL undervalued',
    'show TSLA',
    'grafico de nvda con rsi',
    'forecast BTC-USD',
    'chart',
    'AAPL candle chart',
    'velas BTC',
    'grafico AAPL con SMA20',
    'AAPL EMA 50 and RSI 14',
    'kalman filter AAPL',
    'filtro kalman SPY',
    'AAPL z-score',
    'grafico de ETH-USD con z-score',
    'compare AAPL vs MSFT vs GOOGL',
    'compara NVDA contra AMD',
    'compare AAPL MSFT NVDA GOOGL TSLA',
    'fundamentals for MSFT',
    'fundamentales de AAPL eps',
    'TSLA earnings',
    'book value of JPM',
    'BRK-B fair value',
    'valor justo de FALABELLA.SN',
    'AAPL infravalorado o caro?',
    'valoracion de AMZN',
    'forecast AAPL 60 days',
    'pronostico de BTC-USD 90 dias',
    'AAPL chart with SMA20, RSI and forecast',
    'MSFT overvalued?',
  ]

  it('covers at least 20 varied English and Spanish queries', () => {
    assert.ok(QUERIES.length >= 20)
  })

  for (const q of QUERIES) {
    it(`produces a valid plan for "${q}"`, async () => {
      const p = await plan(q)
      assert.ok(Array.isArray(p.nodes), 'nodes array')
      assert.deepEqual(validatePlan(p), { ok: true })
    })
  }
})

describe('ticker extraction', () => {
  let useAIPipeline: typeof import('../composables/useAIPipeline.ts').useAIPipeline
  before(async () => {
    ;({ useAIPipeline } = await import('../composables/useAIPipeline.ts'))
  })

  async function symbolOf(query: string): Promise<string> {
    g.$fetch = mock.fn(async () => { throw new Error('offline') })
    const p = await useAIPipeline().generate(query) as any
    const sym = p.nodes.find((n: any) => n.type === 'symbolInput')
    return sym.data.symbol
  }

  it('ignores uppercase stop words such as IS', async () => {
    assert.equal(await symbolOf('is AAPL undervalued'), 'AAPL')
  })

  it('ignores uppercase stop words such as SHOW', async () => {
    assert.equal(await symbolOf('show TSLA'), 'TSLA')
  })

  it('falls back to the first lowercase non-keyword token', async () => {
    assert.equal(await symbolOf('grafico de nvda con rsi'), 'NVDA')
  })

  it('keeps a dashed crypto ticker', async () => {
    assert.equal(await symbolOf('forecast BTC-USD'), 'BTC-USD')
  })

  it('defaults to AAPL when no ticker is present', async () => {
    assert.equal(await symbolOf('chart'), 'AAPL')
  })

  it('keeps a .SN suffix up to 12 letters', async () => {
    assert.equal(await symbolOf('valor justo de FALABELLA.SN'), 'FALABELLA.SN')
  })
})

describe('local keyword generator intents', () => {
  let useAIPipeline: typeof import('../composables/useAIPipeline.ts').useAIPipeline
  before(async () => {
    ;({ useAIPipeline } = await import('../composables/useAIPipeline.ts'))
  })

  async function plan(query: string): Promise<{ nodes: any[]; edges: any[] }> {
    g.$fetch = mock.fn(async () => { throw new Error('offline') })
    return useAIPipeline().generate(query) as Promise<{ nodes: any[]; edges: any[] }>
  }

  const idx = (p: { nodes: any[] }, type: string) => p.nodes.findIndex(n => n.type === type)
  const edgeFrom = (p: { edges: any[] }, source: number, sourceHandle: string) =>
    p.edges.find(e => e.source === source && e.sourceHandle === sourceHandle)

  it('value intent: Symbol feeds Fair Value with the price feed; upside goes to a Display', async () => {
    const p = await plan('is AAPL undervalued')
    const sym = idx(p, 'symbolInput')
    const feed = idx(p, 'priceFeed')
    const fv = idx(p, 'fairValue')
    assert.ok(p.edges.some(e => e.source === sym && e.target === fv && e.targetHandle === 'symbol'))
    assert.ok(p.edges.some(e => e.source === feed && e.target === fv && e.targetHandle === 'priceSeries'))
    const pct = edgeFrom(p, fv, 'upsidePct')
    assert.ok(pct)
    assert.equal(p.nodes[pct!.target].type, 'display')
    assert.equal(pct!.targetHandle, 'value')
  })

  it('value intent: fairValueSeries becomes a free chart overlay', async () => {
    const p = await plan('is AAPL undervalued')
    const fv = idx(p, 'fairValue')
    const chart = idx(p, 'chartOutput')
    const overlay = edgeFrom(p, fv, 'fairValueSeries')
    assert.ok(overlay)
    assert.equal(overlay!.target, chart)
    assert.equal(overlay!.targetHandle, 'overlayA')
  })

  it('no edge in the plan uses a removed or renamed handle', async () => {
    const p = await plan('is AAPL undervalued')
    assert.ok(!p.edges.some(e => e.sourceHandle === 'gapPct' || e.sourceHandle === 'gapSeries'))
  })

  it('fundamentals intent: Symbol feeds Fundamentals and EPS goes to a Display', async () => {
    const p = await plan('fundamentales de AAPL eps')
    const f = idx(p, 'fundamentals')
    assert.ok(f > 0)
    assert.ok(p.edges.some(e => e.source === idx(p, 'symbolInput') && e.target === f && e.targetHandle === 'symbol'))
    const eps = edgeFrom(p, f, 'eps')
    assert.ok(eps)
    assert.equal(p.nodes[eps!.target].type, 'display')
  })

  it('compare intent: one Symbol, Price Feed and Rebase per ticker, all into one chart', async () => {
    const p = await plan('compare AAPL vs MSFT vs GOOGL')
    assert.equal(p.nodes.filter(n => n.type === 'symbolInput').length, 3)
    assert.equal(p.nodes.filter(n => n.type === 'priceFeed').length, 3)
    assert.equal(p.nodes.filter(n => n.type === 'normalize').length, 3)
    assert.equal(p.nodes.filter(n => n.type === 'chartOutput').length, 1)
    assert.equal(p.nodes.some(n => n.type === 'portfolioInput' || n.type === 'multiSymbolInput'), false)
    const chart = idx(p, 'chartOutput')
    const into = p.edges.filter(e => e.target === chart).map(e => e.targetHandle).sort()
    assert.deepEqual(into, ['mainSeries', 'overlayA', 'overlayB'])
    for (const e of p.edges.filter(e => e.target === chart)) {
      assert.equal(e.sourceHandle, 'normalized')
      assert.equal(p.nodes[e.source].type, 'normalize')
    }
  })

  it('compare intent caps the number of tickers at four', async () => {
    const p = await plan('compare AAPL MSFT NVDA GOOGL TSLA')
    assert.equal(p.nodes.filter(n => n.type === 'symbolInput').length, 4)
    const chart = idx(p, 'chartOutput')
    assert.equal(p.edges.filter(e => e.target === chart).length, 4)
  })

  it('forecast intent: Forecast with auto model and parsed horizon, band and expected return wired', async () => {
    const p = await plan('forecast AAPL 60 days')
    const f = idx(p, 'forecastNode')
    assert.ok(f > 0)
    assert.deepEqual(p.nodes[f].data, { model: 'auto', steps: 60 })
    const series = edgeFrom(p, f, 'forecastSeries')
    assert.ok(series)
    assert.equal(p.nodes[series!.target].type, 'chartOutput')
    assert.equal(p.edges.some(e => e.sourceHandle === 'confidenceSeries'), false)
    const ret = edgeFrom(p, f, 'expectedReturn')
    assert.ok(ret)
    assert.equal(p.nodes[ret!.target].type, 'display')
  })

  it('forecast horizon defaults to 30 and is clamped to 5-252', async () => {
    const def = await plan('forecast AAPL')
    assert.equal(def.nodes[idx(def, 'forecastNode')].data.steps, 30)
    const big = await plan('forecast AAPL 900 days')
    assert.equal(big.nodes[idx(big, 'forecastNode')].data.steps, 252)
    const small = await plan('forecast AAPL 1 day')
    assert.equal(small.nodes[idx(small, 'forecastNode')].data.steps, 5)
  })

  it('kalman intent: smoothed becomes a free overlay', async () => {
    const p = await plan('kalman filter AAPL')
    const k = idx(p, 'kalmanFilter')
    const e = edgeFrom(p, k, 'smoothed')
    assert.ok(e)
    assert.equal(p.nodes[e!.target].type, 'chartOutput')
    assert.match(e!.targetHandle, /^overlay[ABC]$/)
  })

  it('rsi intent: rsiSeries becomes a chart overlay', async () => {
    const p = await plan('AAPL rsi 14')
    const r = idx(p, 'rsiIndicator')
    const e = edgeFrom(p, r, 'rsiSeries')
    assert.ok(e)
    assert.equal(p.nodes[e!.target].type, 'chartOutput')
  })

  it('z-score intent: zSeries overlay and zScore to a Display', async () => {
    const p = await plan('AAPL z-score')
    const z = idx(p, 'zScore')
    assert.ok(edgeFrom(p, z, 'zSeries'))
    assert.equal(p.nodes[edgeFrom(p, z, 'zScore')!.target].type, 'display')
  })

  it('never emits two edges into the same chart input', async () => {
    const p = await plan('chart AAPL with SMA20, RSI, kalman, forecast, z-score, is it undervalued')
    const keys = p.edges.map(e => `${e.target}:${e.targetHandle}`)
    assert.equal(new Set(keys).size, keys.length)
  })

  it('keeps the candle plan unchanged', async () => {
    const p = await plan('AAPL candle chart')
    assert.deepEqual(p.nodes.map(n => n.type), ['symbolInput', 'priceFeed', 'candleChart'])
  })
})
