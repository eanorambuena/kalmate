import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { executors } from '../utils/pipeline/runner.ts'
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

const at = (value: number) => [{ timestamp: 1, value }]

describe('compareReference outputs', () => {
  it('flags undervalued when the price is below the reference', async () => {
    const out = await executors.compareReference!({ nodeId: 'c', inputs: { priceSeries: at(80), reference: 100 }, data: {} })
    assert.equal(out.undervalued, 1)
    assert.equal(out.overvalued, 0)
  })
  it('flags overvalued when the price is above the reference', async () => {
    const out = await executors.compareReference!({ nodeId: 'c', inputs: { priceSeries: at(130), reference: 100 }, data: {} })
    assert.equal(out.undervalued, 0)
    assert.equal(out.overvalued, 1)
  })
  it('flags neither inside the band', async () => {
    const out = await executors.compareReference!({ nodeId: 'c', inputs: { priceSeries: at(101), reference: 100 }, data: {} })
    assert.equal(out.undervalued, 0)
    assert.equal(out.overvalued, 0)
  })
})
