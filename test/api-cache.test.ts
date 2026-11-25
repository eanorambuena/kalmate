import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { cachedFetch } from '../utils/apiCache.ts'
import { reduceCompanyFacts, snapshotAt, type CompanyFacts } from '../utils/fundamentals.ts'

function fakeDb(initial: Record<string, { payload: string; expires_at: number }> = {}) {
  const rows = { ...initial } as Record<string, any>
  const db = {
    prepare(sql: string) {
      return {
        bind(...args: any[]) {
          return {
            first: async () => (sql.startsWith('SELECT') ? (rows[args[0]] ?? null) : null),
            run: async () => {
              if (sql.startsWith('INSERT')) rows[args[0]] = { payload: args[2], expires_at: args[4] }
              return {}
            },
          }
        },
      }
    },
  }
  return { db: db as any, rows }
}

describe('cachedFetch', () => {
  it('serves a fresh row without calling upstream', async () => {
    const { db } = fakeDb({ k: { payload: '{"a":1}', expires_at: Date.now() + 60_000 } })
    let called = false
    const v = await cachedFetch(db, 'k', { source: 's', ttlMs: 1000 }, async () => { called = true; return { a: 2 } })
    assert.deepEqual(v, { a: 1 })
    assert.equal(called, false)
  })

  it('fetches and stores on a miss', async () => {
    const { db, rows } = fakeDb()
    const v = await cachedFetch(db, 'k', { source: 's', ttlMs: 1000 }, async () => ({ a: 2 }))
    assert.deepEqual(v, { a: 2 })
    assert.equal(JSON.parse(rows.k.payload).a, 2)
  })

  it('serves a stale row when upstream fails', async () => {
    const { db } = fakeDb({ k: { payload: '{"a":1}', expires_at: 0 } })
    const v = await cachedFetch(db, 'k', { source: 's', ttlMs: 1000 }, async () => { throw new Error('down') })
    assert.deepEqual(v, { a: 1 })
  })

  it('rethrows when there is neither cache nor upstream', async () => {
    await assert.rejects(cachedFetch(null, 'k', { source: 's', ttlMs: 1000 }, async () => { throw new Error('down') }))
  })

  it('works without a database', async () => {
    assert.deepEqual(await cachedFetch(null, 'k', { source: 's', ttlMs: 1 }, async () => ({ ok: true })), { ok: true })
  })
})

describe('reduceCompanyFacts', () => {
  it('keeps only the concepts used and preserves the snapshot', () => {
    const big: CompanyFacts = { facts: { 'us-gaap': {
      NetIncomeLoss: { units: { USD: [{ start: '2024-01-01', end: '2024-12-31', val: 40, form: '10-K', filed: '2025-02-01' }] } },
      SomethingUnused: { units: { USD: [{ end: '2024-12-31', val: 1, form: '10-K', filed: '2025-02-01' }] } },
    } } }
    const small = reduceCompanyFacts(big)
    assert.equal(small.facts?.['us-gaap']?.SomethingUnused, undefined)
    assert.deepEqual(snapshotAt(small, '2025-03-01').netIncome, snapshotAt(big, '2025-03-01').netIncome)
  })
})
