import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { tickerDb, getStoredTicker, saveTicker, type D1Like } from '../utils/tickerStore.ts'

function fakeDb(row: any = null) {
  const calls: { sql: string; args: unknown[] }[] = []
  const db: D1Like = {
    prepare(sql) {
      return {
        bind(...args) {
          calls.push({ sql, args })
          return { first: async () => row, run: async () => ({ success: true }) }
        },
      }
    },
  }
  return { db, calls }
}

describe('ticker store', () => {
  it('returns no database when the binding is missing', () => {
    assert.equal(tickerDb({ context: {} }), null)
  })

  it('finds the binding on the Cloudflare context', () => {
    const { db } = fakeDb()
    assert.equal(tickerDb({ context: { cloudflare: { env: { TICKERS_DB: db } } } }), db)
  })

  it('reads a stored ticker by upper-cased symbol', async () => {
    const { db, calls } = fakeDb({ symbol: 'DUOL', cik: '0001562088', source: 'sec-map' })
    const rec = await getStoredTicker(db, 'duol')
    assert.equal(rec?.cik, '0001562088')
    assert.deepEqual(calls[0].args, ['DUOL'])
  })

  it('writes a resolved ticker with an upsert', async () => {
    const { db, calls } = fakeDb()
    await saveTicker(db, { symbol: 'meta', cik: '0001326801', source: 'sec-map' })
    assert.match(calls[0].sql, /INSERT INTO tickers/)
    assert.equal(calls[0].args[0], 'META')
  })

  it('is a no-op without a database and never throws', async () => {
    assert.equal(await getStoredTicker(null, 'AAPL'), null)
    await saveTicker(null, { symbol: 'AAPL', source: 'x' })
  })
})
