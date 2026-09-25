import { readFileSync } from 'fs'
import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'

const FILE = new URL('../utils/yahoo.ts', import.meta.url).pathname

// Shape documented by Yahoo's unofficial quoteSummary endpoint (each numeric
// field wrapped as { raw, fmt }) — used since the sandbox this was built in
// cannot reach finance.yahoo.com to record a real response. Verify this
// against a live response before relying on it in production.
function mockQuoteSummaryResponse(overrides: any = {}) {
  return {
    quoteSummary: {
      result: [{
        incomeStatementHistory: {
          incomeStatementHistory: [
            {
              endDate: { raw: 1696032000, fmt: '2023-09-30' },
              totalRevenue: { raw: 383285000000, fmt: '383.29B' },
              grossProfit: { raw: 169148000000, fmt: '169.15B' },
              operatingIncome: { raw: 114301000000, fmt: '114.30B' },
              netIncome: { raw: 96995000000, fmt: '96.99B' },
            },
            {
              endDate: { raw: 1664496000, fmt: '2022-09-30' },
              totalRevenue: { raw: 394328000000, fmt: '394.33B' },
              grossProfit: { raw: 170782000000, fmt: '170.78B' },
              operatingIncome: { raw: 119437000000, fmt: '119.44B' },
              netIncome: { raw: 99803000000, fmt: '99.80B' },
            },
          ],
        },
        financialData: {
          currentRatio: { raw: 0.988, fmt: '0.99' },
          debtToEquity: { raw: 145.0, fmt: '145.00' },
          returnOnEquity: { raw: 1.479, fmt: '147.90%' },
          revenueGrowth: { raw: 0.021, fmt: '2.10%' },
          earningsGrowth: { raw: 0.11, fmt: '11.00%' },
          grossMargins: { raw: 0.4413, fmt: '44.13%' },
          operatingMargins: { raw: 0.2982, fmt: '29.82%' },
          profitMargins: { raw: 0.2531, fmt: '25.31%' },
          totalRevenue: { raw: 383285000000, fmt: '383.29B' },
        },
        defaultKeyStatistics: {
          priceToBook: { raw: 48.5, fmt: '48.50' },
        },
        summaryDetail: {
          trailingPE: { raw: 28.5, fmt: '28.50' },
          forwardPE: { raw: 26.2, fmt: '26.20' },
          marketCap: { raw: 2900000000000, fmt: '2.90T' },
        },
        ...overrides,
      }],
      error: null,
    },
  }
}

describe('yahoo fetch', () => {
  it('apiFetch debe usar AbortSignal.timeout para evitar cuelgues', () => {
    const content = readFileSync(FILE, 'utf-8')
    const lines = content.split('\n')

    const apiFetchLines = lines
      .map((l, i) => ({ line: l, idx: i }))
      .filter(({ line }) => line.includes('fetch(url,'))

    assert.ok(
      apiFetchLines.length > 0,
      'Debe existir al menos un fetch(url, ...)'
    )

    const hasSignal = apiFetchLines.some(({ line }) =>
      line.includes('AbortSignal.timeout') || line.includes('signal:')
    )

    assert.ok(
      hasSignal,
      `fetch(url, { ... }) debe incluir signal con timeout. Lineas encontradas:\n${
        apiFetchLines.map(({ line, idx }) => `  ${idx + 1}: ${line.trim()}`).join('\n')
      }`
    )
  })
})

describe('getFundamentals', () => {
  let getFundamentals: (symbol: string) => Promise<any>
  let origFetch: typeof global.fetch

  before(async () => {
    origFetch = global.fetch
    const mod = await import('../utils/yahoo.ts')
    getFundamentals = mod.getFundamentals
  })

  after(() => {
    global.fetch = origFetch
  })

  it('unwraps { raw, fmt } fields from a documented quoteSummary response', async () => {
    global.fetch = (async () => ({
      ok: true,
      json: async () => mockQuoteSummaryResponse(),
    })) as any

    const result = await getFundamentals('AAPL')
    assert.equal(result.symbol, 'AAPL')
    assert.equal(result.totalRevenue, 383285000000)
    assert.equal(result.netIncome, 96995000000)
    assert.equal(result.grossProfit, 169148000000)
    assert.equal(result.operatingIncome, 114301000000)
    assert.equal(result.netMargin, 0.2531)
    assert.equal(result.grossMargin, 0.4413)
    assert.equal(result.operatingMargin, 0.2982)
    assert.equal(result.revenueGrowth, 0.021)
    assert.equal(result.earningsGrowth, 0.11)
    assert.equal(result.returnOnEquity, 1.479)
    assert.equal(result.debtToEquity, 145.0)
    assert.equal(result.currentRatio, 0.988)
    assert.equal(result.trailingPE, 28.5)
    assert.equal(result.forwardPE, 26.2)
    assert.equal(result.priceToBook, 48.5)
    assert.equal(result.marketCap, 2900000000000)
  })

  it('maps the full incomeStatementHistory array in reported order', async () => {
    global.fetch = (async () => ({
      ok: true,
      json: async () => mockQuoteSummaryResponse(),
    })) as any

    const result = await getFundamentals('AAPL')
    assert.equal(result.incomeStatementHistory.length, 2)
    assert.equal(result.incomeStatementHistory[0].endDate, '2023-09-30')
    assert.equal(result.incomeStatementHistory[0].totalRevenue, 383285000000)
    assert.equal(result.incomeStatementHistory[1].endDate, '2022-09-30')
    assert.equal(result.incomeStatementHistory[1].totalRevenue, 394328000000)
  })

  it('falls back to financialData.totalRevenue when incomeStatementHistory is empty', async () => {
    global.fetch = (async () => ({
      ok: true,
      json: async () => mockQuoteSummaryResponse({ incomeStatementHistory: { incomeStatementHistory: [] } }),
    })) as any

    const result = await getFundamentals('AAPL')
    assert.equal(result.totalRevenue, 383285000000)
    assert.equal(result.netIncome, undefined)
    assert.deepEqual(result.incomeStatementHistory, [])
  })

  it('accepts plain (non-wrapped) numbers, not just { raw, fmt } objects', async () => {
    global.fetch = (async () => ({
      ok: true,
      json: async () => mockQuoteSummaryResponse({
        financialData: { profitMargins: 0.25, revenueGrowth: 0.05 },
      }),
    })) as any

    const result = await getFundamentals('AAPL')
    assert.equal(result.netMargin, 0.25)
    assert.equal(result.revenueGrowth, 0.05)
  })

  it('leaves fields undefined instead of throwing when a module is missing entirely', async () => {
    global.fetch = (async () => ({
      ok: true,
      json: async () => ({ quoteSummary: { result: [{}], error: null } }),
    })) as any

    const result = await getFundamentals('AAPL')
    assert.equal(result.totalRevenue, undefined)
    assert.equal(result.trailingPE, undefined)
    assert.deepEqual(result.incomeStatementHistory, [])
  })

  it('throws when Yahoo returns no result for the symbol', async () => {
    global.fetch = (async () => ({
      ok: true,
      json: async () => ({ quoteSummary: { result: [], error: { code: 'Not Found', description: 'No fundamentals data found' } } }),
    })) as any

    await assert.rejects(() => getFundamentals('NOTATICKER'), /No fundamentals data for NOTATICKER/)
  })

  it('throws when the HTTP request itself fails', async () => {
    global.fetch = (async () => ({ ok: false, status: 404, statusText: 'Not Found' })) as any
    await assert.rejects(() => getFundamentals('AAPL'), /Yahoo API 404/)
  })
})
