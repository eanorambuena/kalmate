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

import { compareToReference } from '../utils/valuation.ts'
describe('compareToReference', () => {
  it('labels above, below and at-reference positions', () => {
    assert.equal(compareToReference(120, 100).label, 'Above reference')
    assert.equal(compareToReference(80, 100).label, 'Below reference')
    assert.equal(compareToReference(101, 100).label, 'At reference')
  })
  it('reports the percentage difference against the reference', () => {
    assert.ok(Math.abs(compareToReference(120, 100).diffPct! - 0.2) < 1e-9)
  })
  it('returns no reference when the reference is missing or invalid', () => {
    assert.equal(compareToReference(100, null).label, 'No reference')
    assert.equal(compareToReference(100, 0).label, 'No reference')
  })
})

import { executors as ex2 } from '../utils/pipeline/runner.ts'
describe('compareReference outputs', () => {
  it('flags undervalued when the price is below the reference', async () => {
    const out = await ex2.compareReference!({ nodeId: 'c', inputs: { price: 80, reference: 100 }, data: {} })
    assert.equal(out.undervalued, 1)
    assert.equal(out.overvalued, 0)
  })
  it('flags overvalued when the price is above the reference', async () => {
    const out = await ex2.compareReference!({ nodeId: 'c', inputs: { price: 130, reference: 100 }, data: {} })
    assert.equal(out.undervalued, 0)
    assert.equal(out.overvalued, 1)
  })
  it('flags neither inside the band', async () => {
    const out = await ex2.compareReference!({ nodeId: 'c', inputs: { price: 101, reference: 100 }, data: {} })
    assert.equal(out.undervalued, 0)
    assert.equal(out.overvalued, 0)
  })
})
