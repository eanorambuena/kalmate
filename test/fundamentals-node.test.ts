import { describe, it, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { executors } from '../utils/pipeline/runner.ts'
import { nodeDefinitions } from '../utils/pipeline/nodeDefinitions.ts'

const realFetch = globalThis.fetch
afterEach(() => { globalThis.fetch = realFetch })

describe('fundamentals node', () => {
  it('is registered as a non-pro process node with the expected outputs', () => {
    const def = nodeDefinitions.find(n => n.type === 'fundamentals')
    assert.ok(def)
    assert.equal(def.pro, false)
    assert.deepEqual(def.outputs.map(o => o.id), ['eps', 'bookValuePerShare', 'freeCashFlow', 'netIncome', 'coverage'])
  })

  it('asks for the symbol and as-of date and maps the response', async () => {
    let requested = ''
    globalThis.fetch = (async (url: string) => {
      requested = url
      return new Response(JSON.stringify({ eps: 1.5, bookValuePerShare: 10, freeCashFlow: 99, netIncome: 40, coverage: 1 }), { status: 200 })
    }) as any
    const out = await executors.fundamentals!({ nodeId: 'f', inputs: { symbol: 'DUOL' }, data: { asOf: '2025-03-01' } })
    assert.equal(requested, '/api/fundamentals?symbol=DUOL&asOf=2025-03-01')
    assert.equal(out.eps, 1.5)
    assert.equal(out.bookValuePerShare, 10)
    assert.equal(out.freeCashFlow, 99)
    assert.equal(out.coverage, 1)
    assert.equal(out.error, undefined)
  })

  it('returns nulls and the server message when the request fails', async () => {
    globalThis.fetch = (async () => new Response(JSON.stringify({ statusMessage: 'SEC facts HTTP 403' }), { status: 502 })) as any
    const out = await executors.fundamentals!({ nodeId: 'f', inputs: { symbol: 'DUOL' }, data: {} })
    assert.equal(out.eps, null)
    assert.equal(out.error, 'SEC facts HTTP 403')
  })

  it('reports a missing symbol without calling the server', async () => {
    let called = false
    globalThis.fetch = (async () => { called = true; return new Response('{}') }) as any
    const out = await executors.fundamentals!({ nodeId: 'f', inputs: {}, data: {} })
    assert.equal(called, false)
    assert.equal(out.error, 'Need a symbol')
  })
})
