import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { snapshotAt, type CompanyFacts } from '../utils/fundamentals.ts'

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
