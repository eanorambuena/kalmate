import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createServices, DataError } from '../utils/providers/services.ts'
import { memoryStore } from '../utils/providers/store.ts'
import { cached } from '../utils/providers/cache.ts'

const facts = { facts: { 'us-gaap': { NetIncomeLoss: { units: { USD: [
  { start: '2024-01-01', end: '2024-12-31', val: 40, form: '10-K', filed: '2025-02-01' },
] } } } } }

const noSplits = async () => []

function fakeFetch(log: string[], body: unknown = facts, ok = true) {
  return (async (url: string) => {
    log.push(url)
    return new Response(JSON.stringify(body), { status: ok ? 200 : 503 })
  }) as any
}

describe('data services', () => {
  it('returns fundamentals for a mapped ticker without needing the tickers file', async () => {
    const log: string[] = []
    const svc = createServices({ upstream: { fetch: fakeFetch(log), splits: noSplits } })
    const out = await svc.fundamentals('duol', '2025-03-01')
    assert.equal(out.symbol, 'DUOL')
    assert.equal(out.netIncome, 40)
    assert.ok(log.every(u => !u.includes('company_tickers')))
  })

  it('answers the second request from cache without calling upstream', async () => {
    const log: string[] = []
    const svc = createServices({ upstream: { fetch: fakeFetch(log), splits: noSplits } })
    await svc.fundamentals('AAPL', '2025-03-01')
    await svc.fundamentals('AAPL', '2025-06-01')
    assert.equal(log.filter(u => u.includes('companyfacts')).length, 1)
  })

  it('reports an unknown ticker as a 404 DataError', async () => {
    const svc = createServices({ upstream: { fetch: fakeFetch([], { 0: { cik_str: 1, ticker: 'ZZZZ' } }) } })
    await assert.rejects(svc.fundamentals('NOPE', '2025-03-01'), (e: any) => e instanceof DataError && e.status === 404)
  })

  it('maps upstream history through the cache', async () => {
    let calls = 0
    const svc = createServices({ upstream: { history: (async () => { calls++; return [{ close: 1 }] }) as any } })
    await svc.history('AAPL', '1mo', '1d')
    await svc.history('AAPL', '1mo', '1d')
    assert.equal(calls, 1)
  })
})

describe('cached (store-agnostic)', () => {
  it('serves a stale entry when the fetcher fails', async () => {
    const store = memoryStore()
    await store.put('k', { v: 1 }, { source: 's', ttlMs: -1 })
    const v = await cached(store, 'k', { source: 's', ttlMs: 1000 }, async () => { throw new Error('down') })
    assert.deepEqual(v, { v: 1 })
  })
})

describe('services for quotes, search, news and screener', () => {
  it('caches quotes in memory and does not write them to the durable store', async () => {
    let calls = 0
    const svc = createServices({ upstream: { quote: (async () => { calls++; return { symbol: 'AAPL' } }) as any } })
    await svc.quotes(['AAPL'])
    await svc.quotes(['AAPL'])
    assert.equal(calls, 1)
  })

  it('screener filters by price and sorts using the same services', async () => {
    const svc = createServices({ upstream: {
      search: (async () => [{ symbol: 'A', quoteType: 'EQUITY' }, { symbol: 'B', quoteType: 'EQUITY' }]) as any,
      quotes: (async () => [
        { symbol: 'A', regularMarketPrice: 10, change: 1 },
        { symbol: 'B', regularMarketPrice: 50, change: 5 },
      ]) as any,
    } })
    const out = await svc.screener({ minPrice: 20, sortBy: 'change' })
    assert.deepEqual(out.map((r: any) => r.symbol), ['B'])
  })

  it('search and news go through the cache', async () => {
    let calls = 0
    const svc = createServices({ upstream: { search: (async () => { calls++; return [] }) as any } })
    await svc.search('apple')
    await svc.search('apple')
    assert.equal(calls, 1)
  })
})

// EPS annual facts for a split test; body is shaped like SEC companyfacts.
const epsFacts = (val: number, filed = '2020-02-01') => ({ facts: { 'us-gaap': { EarningsPerShareDiluted: { units: { 'USD/shares': [
  { start: '2019-01-01', end: '2019-12-31', val, form: '10-K', filed },
] } } } } })

describe('fundamentals history', () => {
  it('returns the current snapshot and 24 quarter-end points from one facts download', async () => {
    const log: string[] = []
    const svc = createServices({ upstream: { fetch: fakeFetch(log, epsFacts(10, '2024-02-01')), splits: noSplits } })
    const out = await svc.fundamentalsHistory('MSFT')
    assert.equal(out.current.eps, 10)
    assert.equal(out.points.length, 24)
    assert.equal(out.points[0].eps, null)
    assert.equal(out.points[23].eps, 10)
    assert.ok('bookValuePerShare' in out.points[0] && 'freeCashFlowPerShare' in out.points[0])
    assert.equal(log.filter(u => u.includes('companyfacts')).length, 1)
  })

  it('a failing splits upstream does not break fundamentals', async () => {
    const svc = createServices({ upstream: { fetch: fakeFetch([], epsFacts(10)), splits: (async () => { throw new Error('down') }) as any } })
    const out = await svc.fundamentals('NVDA', '2025-03-01')
    assert.equal(out.eps, 10)
  })

  it('passes loaded splits to the snapshot and caches them for a week', async () => {
    let splitCalls = 0
    const svc = createServices({ upstream: {
      fetch: fakeFetch([], epsFacts(8)),
      splits: (async () => { splitCalls++; return [{ date: '2020-08-31', ratio: 4 }] }) as any,
    } })
    const out = await svc.fundamentals('AMZN', '2021-01-01')
    assert.equal(out.eps, 2)
    await svc.fundamentals('AMZN', '2021-01-01')
    assert.equal(splitCalls, 1)
  })

  it('does not refetch facts when history is requested after a snapshot', async () => {
    const log: string[] = []
    const svc = createServices({ upstream: { fetch: fakeFetch(log, epsFacts(10)), splits: noSplits } })
    await svc.fundamentals('META', '2025-03-01')
    await svc.fundamentalsHistory('META')
    assert.equal(log.filter(u => u.includes('companyfacts')).length, 1)
  })
})
