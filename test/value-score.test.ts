import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { scoreValue } from '../utils/valuation.ts'
import { executors } from '../utils/pipeline/runner.ts'

describe('scoreValue', () => {
  it('cheap on book, cash flow and gap reads as undervalued', () => {
    const r = scoreValue({ price: 10, bookValuePerShare: 20, freeCashFlowPerShare: 1, gapPct: -0.3, zScore: -2.5 })
    assert.equal(r.verdict, 'Undervalued')
    assert.ok(r.score > 0.25)
  })

  it('expensive on every component reads as overvalued', () => {
    const r = scoreValue({ price: 100, bookValuePerShare: 5, freeCashFlowPerShare: 0.1, gapPct: 0.4, zScore: 2.5 })
    assert.equal(r.verdict, 'Overvalued')
    assert.ok(r.score < -0.25)
  })

  it('skips missing components and reports how many were used', () => {
    const r = scoreValue({ price: 10, gapPct: -0.2 })
    assert.equal(r.components_used, 1)
    assert.equal(r.components.bookYield, null)
    assert.ok(r.score > 0)
  })

  it('scores stay within [-1, 1]', () => {
    const r = scoreValue({ price: 1, bookValuePerShare: 1000, freeCashFlowPerShare: 1000, gapPct: -5, zScore: -50 })
    assert.ok(r.score <= 1 && r.score >= -1)
  })
})

describe('valueScore node', () => {
  it('needs enough price history', async () => {
    const out = await executors.valueScore!({ nodeId: 'v', inputs: { priceSeries: [] }, data: {} })
    assert.ok(out.error)
  })

  it('returns a verdict and components for a long series', async () => {
    const series = Array.from({ length: 400 }, (_, i) => ({ timestamp: i * 86_400_000, value: 100 + Math.sin(i / 10) * 5 }))
    const out = await executors.valueScore!({
      nodeId: 'v', inputs: { priceSeries: series, bookValuePerShare: 80, freeCashFlow: 100, shares: 50 }, data: {},
    })
    assert.ok(['Undervalued', 'Fair value', 'Overvalued'].includes(out.verdict))
    assert.ok(out.score >= -1 && out.score <= 1)
    assert.equal(out.components_used, 4)
  })
})
