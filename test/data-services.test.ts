import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createServices, DataError } from '../utils/providers/services.ts'
import { memoryStore } from '../utils/providers/store.ts'
import { cached } from '../utils/providers/cache.ts'

const facts = { facts: { 'us-gaap': { NetIncomeLoss: { units: { USD: [
  { start: '2024-01-01', end: '2024-12-31', val: 40, form: '10-K', filed: '2025-02-01' },
] } } } } }

function fakeFetch(log: string[], body: unknown = facts, ok = true) {
  return (async (url: string) => {
    log.push(url)
    return new Response(JSON.stringify(body), { status: ok ? 200 : 503 })
  }) as any
}

describe('data services', () => {
  it('returns fundamentals for a mapped ticker without needing the tickers file', async () => {
    const log: string[] = []
    const svc = createServices({ upstream: { fetch: fakeFetch(log) } })
    const out = await svc.fundamentals('duol', '2025-03-01')
    assert.equal(out.symbol, 'DUOL')
    assert.equal(out.netIncome, 40)
    assert.ok(log.every(u => !u.includes('company_tickers')))
  })

  it('answers the second request from cache without calling upstream', async () => {
    const log: string[] = []
    const svc = createServices({ upstream: { fetch: fakeFetch(log) } })
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
