import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { estimateFairValue, rollingZScore } from '../utils/valuation.ts'
import { executors } from '../utils/pipeline/runner.ts'
import { nodeDefinitions } from '../utils/pipeline/nodeDefinitions.ts'

// Deterministic PRNG so the tests are reproducible.
function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0x100000000
  }
}

function randomWalk(n: number, seed: number, start = 100): number[] {
  const r = rng(seed)
  const out = [start]
  for (let i = 1; i < n; i++) out.push((out[i - 1] ?? start) * Math.exp((r() - 0.5) * 0.04))
  return out
}

describe('valuation', () => {
  it('fair value gap is negative after a sharp drop below a stable equilibrium', () => {
    // Stable level near 100 for a long stretch, then a sudden 25% dislocation at the end.
    const r = rng(7)
    const prices: number[] = []
    for (let i = 0; i < 300; i++) prices.push(100 * Math.exp((r() - 0.5) * 0.01))
    for (let i = 0; i < 5; i++) prices.push(75 * Math.exp((r() - 0.5) * 0.01))
    const { gap } = estimateFairValue(prices)
    const last = gap[gap.length - 1] ?? NaN
    assert.ok(last < -0.1, `expected undervalued gap, got ${last}`)
  })

  it('fair value gap is positive after a spike above equilibrium', () => {
    const r = rng(11)
    const prices: number[] = []
    for (let i = 0; i < 300; i++) prices.push(100 * Math.exp((r() - 0.5) * 0.01))
    for (let i = 0; i < 5; i++) prices.push(130 * Math.exp((r() - 0.5) * 0.01))
    const { gap } = estimateFairValue(prices)
    const last = gap[gap.length - 1] ?? NaN
    assert.ok(last > 0.1, `expected overvalued gap, got ${last}`)
  })

  it('fair value rejects too-short series', () => {
    assert.throws(() => estimateFairValue([1, 2, 3]))
  })

  it('fair value returns one value per input point', () => {
    const prices = randomWalk(120, 3)
    const { fairValue, gap } = estimateFairValue(prices)
    assert.equal(fairValue.length, prices.length)
    assert.equal(gap.length, prices.length)
    assert.ok(fairValue.every(v => Number.isFinite(v) && v > 0))
  })

  it('z-score is zero before the window fills and flags a dislocation', () => {
    const prices = [...Array(60).fill(100), 80]
    const { z } = rollingZScore(prices, 20)
    assert.equal(z[5], 0)
    const last = z[z.length - 1] ?? NaN
    assert.ok(last < -2, `expected strong negative z, got ${last}`)
  })

  it('z-score of a flat window is zero, not NaN', () => {
    const { z } = rollingZScore(Array(40).fill(50), 10)
    assert.ok(z.every(v => v === 0))
  })

  it('runner executors expose fairValue and zScore outputs', async () => {
    const series = randomWalk(400, 5).map((v, i) => ({ timestamp: i * 86_400_000, value: v }))
    const fv = await executors.fairValue!({ nodeId: 'f', inputs: { priceSeries: series }, data: {} })
    assert.equal(fv.fairValueSeries.length, series.length)
    assert.equal(typeof fv.gapPct, 'number')
    const zs = await executors.zScore!({ nodeId: 'z', inputs: { priceSeries: series }, data: { window: 50 } })
    assert.equal(zs.zSeries.length, series.length)
    assert.ok(Number.isFinite(zs.zScore))
  })

  it('node definitions exist for the new valuation nodes', () => {
    const types = nodeDefinitions.map(n => n.type)
    assert.ok(types.includes('fairValue'))
    assert.ok(types.includes('zScore'))
  })
})
