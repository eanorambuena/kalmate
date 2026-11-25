import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { analyzeKalman, cleanHistory } from '../utils/kalmanAnalysis.ts'
import { localTrendFilter } from '../utils/kalman.ts'

// Deterministic trending series with noise and a cycle.
const prices = Array.from({ length: 250 }, (_, i) => 100 * Math.exp(0.0008 * i + 0.03 * Math.sin(i / 9) + 0.004 * Math.sin(i * 1.7)))

describe('cleanHistory', () => {
  it('keeps timestamps aligned with prices when dropping invalid closes', () => {
    const out = cleanHistory([
      { timestamp: 1, close: 10 },
      { timestamp: 2, close: 0 },
      { timestamp: 3, close: NaN },
      { timestamp: 4, close: 12 },
    ])
    assert.deepEqual(out, { timestamps: [1, 4], prices: [10, 12] })
  })
})

describe('analyzeKalman', () => {
  it('uses the same local-trend filter as the pipeline Kalman node', () => {
    const r = analyzeKalman(prices, 15)
    const ref = localTrendFilter(prices, 'balanced')
    assert.deepEqual(r.smoothed, ref.smoothed)
    assert.deepEqual(r.deviation, ref.deviation)
  })

  it('returns a forecast path with an ordered 95% band', () => {
    const r = analyzeKalman(prices, 15)
    assert.equal(r.predicted.length, 15)
    assert.equal(r.lower.length, 15)
    assert.equal(r.upper.length, 15)
    r.predicted.forEach((v, i) => {
      assert.ok(Number.isFinite(v) && v > 0)
      assert.ok(r.lower[i]! <= v && v <= r.upper[i]!)
    })
    assert.equal(r.predictedPrice, r.predicted[14])
    assert.equal(r.lastPrice, prices[prices.length - 1])
  })

  it('reports a walk-forward backtest instead of an in-sample likelihood', () => {
    const r = analyzeKalman(prices, 15)
    assert.ok(r.backtest.n > 0)
    assert.ok(Number.isFinite(r.backtest.skill))
    assert.ok(r.backtest.hitRate >= 0 && r.backtest.hitRate <= 1)
  })

  it('labels the price relative to its trend descriptively', () => {
    const r = analyzeKalman(prices, 15)
    const last = r.deviation[r.deviation.length - 1]!
    assert.equal(r.deviationPct, last)
    assert.equal(r.position, last > 0 ? 'above' : 'below')
  })

  it('skips the forecast but still filters when history is too short', () => {
    const short = prices.slice(0, 30)
    const r = analyzeKalman(short, 15)
    assert.equal(r.smoothed.length, 30)
    assert.deepEqual(r.predicted, [])
    assert.equal(r.predictedPrice, null)
    assert.equal(r.backtest.n, 0)
  })

  it('clamps the horizon to a sane range', () => {
    assert.equal(analyzeKalman(prices, 0).predicted.length, 1)
    assert.equal(analyzeKalman(prices, 10_000).predicted.length, 60)
    assert.equal(analyzeKalman(prices, NaN).predicted.length, 10)
  })
})

