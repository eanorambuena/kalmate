import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { snapshotAt, snapshotSeries, quarterEnds, type CompanyFacts } from '../utils/fundamentals.ts'

// Synthetic company facts shaped like SEC companyfacts JSON.
const q = (start: string, end: string, val: number, filed: string) => ({ start, end, val, form: '10-Q', filed })
const cf: CompanyFacts = {
  facts: {
    'us-gaap': {
      NetIncomeLoss: { units: { USD: [
        q('2024-01-01', '2024-03-31', 10, '2024-05-01'),
        q('2024-04-01', '2024-06-30', 10, '2024-08-01'),
        q('2024-07-01', '2024-09-30', 10, '2024-11-01'),
        q('2024-10-01', '2024-12-31', 10, '2025-02-01'),
        { start: '2024-01-01', end: '2024-12-31', val: 40, form: '10-K', filed: '2025-02-01' },
      ] } },
      StockholdersEquity: { units: { USD: [
        { end: '2024-12-31', val: 200, form: '10-K', filed: '2025-02-01' },
      ] } },
      WeightedAverageNumberOfDilutedSharesOutstanding: { units: { shares: [
        { end: '2024-12-31', val: 20, form: '10-K', filed: '2025-02-01' },
      ] } },
      NetCashProvidedByUsedInOperatingActivities: { units: { USD: [
        { start: '2024-01-01', end: '2024-12-31', val: 60, form: '10-K', filed: '2025-02-01' },
      ] } },
      PaymentsToAcquirePropertyPlantAndEquipment: { units: { USD: [
        { start: '2024-01-01', end: '2024-12-31', val: 15, form: '10-K', filed: '2025-02-01' },
      ] } },
    },
  },
}

describe('point-in-time fundamentals', () => {
  it('ignores anything filed after the as-of date (no look-ahead)', () => {
    const before = snapshotAt(cf, '2025-01-15')
    assert.equal(before.equity, null)
    assert.equal(before.netIncome, null)
    assert.equal(before.freeCashFlow, null)
  })

  it('uses the annual 10-K only once it was filed', () => {
    const after = snapshotAt(cf, '2025-03-01')
    assert.equal(after.equity, 200)
    assert.equal(after.bookValuePerShare, 10)
    assert.equal(after.freeCashFlow, 45)
  })

  it('computes TTM net income from four quarters known at the date', () => {
    const at = snapshotAt(cf, '2025-02-01')
    assert.equal(at.netIncome, 40)
  })

  it('TTM net income excludes quarters not yet filed', () => {
    const at = snapshotAt(cf, '2024-09-01')
    // only Q1 (filed 2024-05-01) and Q2 (filed 2024-08-01) are known: no full TTM window
    assert.equal(at.netIncome, null)
  })

  it('reports coverage as the share of metrics available', () => {
    const at = snapshotAt(cf, '2025-03-01')
    assert.ok(at.coverage > 0.5 && at.coverage <= 1)
  })
})

import { SEC_CIKS } from '../utils/secCiks.ts'
describe('SEC CIK map', () => {
  it('maps DUOL to its verified CIK and uses 10-digit zero-padded ids', () => {
    assert.equal(SEC_CIKS.DUOL, '0001562088')
    assert.ok(Object.values(SEC_CIKS).every(c => /^\d{10}$/.test(c)))
  })
})

// Helpers for the cases below: one concept, one unit.
const facts1 = (concept: string, unit: string, list: any[]): CompanyFacts =>
  ({ facts: { 'us-gaap': { [concept]: { units: { [unit]: list } } } } })
const annual = (start: string, end: string, val: number, filed: string) => ({ start, end, val, form: '10-K', filed })
const ytd = (start: string, end: string, val: number, filed: string) => ({ start, end, val, form: '10-Q', filed })
const NI = (list: any[]) => facts1('NetIncomeLoss', 'USD', list)

describe('TTM flows: annual + current YTD - prior-year YTD', () => {
  const base = [
    annual('2023-01-01', '2023-12-31', 400, '2024-02-15'),
    ytd('2024-01-01', '2024-06-30', 260, '2024-08-01'),
    ytd('2023-01-01', '2023-06-30', 180, '2023-08-01'),
  ]

  it('adds the current half-year and removes the same half a year earlier', () => {
    assert.equal(snapshotAt(NI(base), '2024-09-01').netIncome, 480)
  })

  it('uses the annual value while the current YTD is not yet filed', () => {
    assert.equal(snapshotAt(NI(base), '2024-07-01').netIncome, 400)
  })

  it('falls back to the annual value when the prior-year YTD is missing', () => {
    const noPrior = base.filter(f => f.val !== 180)
    assert.equal(snapshotAt(NI(noPrior), '2024-09-01').netIncome, 400)
  })

  it('works for a non-calendar fiscal year (ends 2024-09-28)', () => {
    const nonCal = [
      annual('2023-09-30', '2024-09-28', 1000, '2024-11-01'),
      ytd('2023-09-30', '2024-03-30', 450, '2024-05-01'),
      ytd('2024-09-29', '2025-03-29', 500, '2025-05-01'),
    ]
    assert.equal(snapshotAt(NI(nonCal), '2025-06-01').netIncome, 1050)
  })

  it('applies the same formula to operating cash flow and EPS', () => {
    const ocf = facts1('NetCashProvidedByUsedInOperatingActivities', 'USD', base)
    assert.equal(snapshotAt(ocf, '2024-09-01').operatingCashFlow, 480)
    const eps = facts1('EarningsPerShareDiluted', 'USD/shares', base)
    assert.equal(snapshotAt(eps, '2024-09-01').eps, 480)
  })

  it('sums four quarters when no annual value is known', () => {
    const qs = [
      ytd('2024-01-01', '2024-03-31', 10, '2024-05-01'),
      ytd('2024-04-01', '2024-06-30', 10, '2024-08-01'),
      ytd('2024-07-01', '2024-09-30', 10, '2024-11-01'),
      ytd('2024-10-01', '2024-12-31', 10, '2025-02-01'),
    ]
    assert.equal(snapshotAt(NI(qs), '2025-02-01').netIncome, 40)
    assert.equal(snapshotAt(NI(qs), '2024-11-15').netIncome, null)
  })
})

describe('stock splits', () => {
  const eps = facts1('EarningsPerShareDiluted', 'USD/shares', [annual('2019-01-01', '2019-12-31', 8, '2020-02-01')])
  const split4 = [{ date: '2020-08-31', ratio: 4 }]

  it('divides per-share facts filed before a split by the split ratio', () => {
    assert.equal(snapshotAt(eps, '2020-09-15', split4).eps, 2)
  })

  it('multiplies share counts filed before a split', () => {
    const cf = { facts: { 'us-gaap': {
      WeightedAverageNumberOfDilutedSharesOutstanding: { units: { shares: [{ end: '2019-12-31', val: 100, form: '10-K', filed: '2020-02-01' }] } },
      StockholdersEquity: { units: { USD: [{ end: '2019-12-31', val: 800, form: '10-K', filed: '2020-02-01' }] } },
    } } } as CompanyFacts
    const at = snapshotAt(cf, '2020-09-15', split4)
    assert.equal(at.shares, 400)
    assert.equal(at.bookValuePerShare, 2)
  })

  it('does not adjust a fact filed after the split', () => {
    const cf = facts1('EarningsPerShareDiluted', 'USD/shares', [
      annual('2019-01-01', '2019-12-31', 8, '2020-02-01'),
      annual('2020-01-01', '2020-12-31', 2.5, '2021-02-01'),
    ])
    assert.equal(snapshotAt(cf, '2021-03-01', split4).eps, 2.5)
  })

  it('multiplies the factors of all later splits, regardless of asOf', () => {
    const splits = [{ date: '2020-08-31', ratio: 4 }, { date: '2021-06-01', ratio: 2 }]
    assert.equal(snapshotAt(eps, '2020-09-15', splits).eps, 1)
    const early = facts1('EarningsPerShareDiluted', 'USD/shares', [annual('2018-01-01', '2018-12-31', 8, '2019-03-01')])
    assert.equal(snapshotAt(early, '2019-06-01', splits).eps, 1)
  })

  it('leaves net income and cash flows unadjusted', () => {
    const ni = NI([annual('2019-01-01', '2019-12-31', 800, '2020-02-01')])
    assert.equal(snapshotAt(ni, '2020-09-15', split4).netIncome, 800)
  })

  it('snapshotSeries passes the splits through', () => {
    const [s] = snapshotSeries(eps, ['2020-09-15'], split4)
    assert.equal(s.eps, 2)
  })
})

describe('free cash flow per share and quarter ends', () => {
  it('computes freeCashFlowPerShare from free cash flow and shares', () => {
    const cf = { facts: { 'us-gaap': {
      NetCashProvidedByUsedInOperatingActivities: { units: { USD: [annual('2024-01-01', '2024-12-31', 60, '2025-02-01')] } },
      PaymentsToAcquirePropertyPlantAndEquipment: { units: { USD: [annual('2024-01-01', '2024-12-31', 15, '2025-02-01')] } },
      WeightedAverageNumberOfDilutedSharesOutstanding: { units: { shares: [{ end: '2024-12-31', val: 20, form: '10-K', filed: '2025-02-01' }] } },
    } } } as CompanyFacts
    assert.equal(snapshotAt(cf, '2025-03-01').freeCashFlowPerShare, 2.25)
    assert.equal(snapshotAt(cf, '2025-01-15').freeCashFlowPerShare, null)
  })

  it('quarterEnds returns the last quarter ends strictly before today, oldest first', () => {
    assert.deepEqual(quarterEnds(4, '2025-05-10'), ['2024-06-30', '2024-09-30', '2024-12-31', '2025-03-31'])
    assert.deepEqual(quarterEnds(2, '2025-06-30'), ['2024-12-31', '2025-03-31'])
  })
})
