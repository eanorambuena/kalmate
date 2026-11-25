import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { localTrendFilter } from '../utils/kalman.ts'

type Preset = 'responsive' | 'balanced' | 'smooth'
const PRESETS: Preset[] = ['responsive', 'balanced', 'smooth']

// Small deterministic LCG so the noisy series is reproducible.
function lcg(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 4294967296
  }
}

function noisySeries(n: number): number[] {
  const rand = lcg(42)
  const out: number[] = []
  let level = Math.log(100)
  for (let i = 0; i < n; i++) {
    level += 0.0005 + (rand() - 0.5) * 0.04
    out.push(Math.exp(level + (rand() - 0.5) * 0.02))
  }
  return out
}

function sumSqDiffLog(smoothed: number[]): number {
  let total = 0
  for (let i = 1; i < smoothed.length; i++) {
    const d = Math.log(smoothed[i]) - Math.log(smoothed[i - 1])
    total += d * d
  }
  return total
}

describe('localTrendFilter', () => {
  it('returns a constant series unchanged with zero deviation', () => {
    const prices = new Array(50).fill(42)
    for (const p of PRESETS) {
      const { smoothed, deviation } = localTrendFilter(prices, p)
      for (let i = 0; i < prices.length; i++) {
        assert.ok(Math.abs(smoothed[i] - 42) < 1e-9, `${p} smoothed[${i}]=${smoothed[i]}`)
        assert.ok(Math.abs(deviation[i]) < 1e-9, `${p} deviation[${i}]=${deviation[i]}`)
      }
    }
  })

  it('tracks an exact exponential trend closely for every preset', () => {
    const prices = Array.from({ length: 600 }, (_, i) => 100 * Math.pow(1.001, i))
    for (const p of PRESETS) {
      const { deviation } = localTrendFilter(prices, p)
      const last = deviation[deviation.length - 1]
      assert.ok(Math.abs(last) < 0.002, `${p} last deviation ${last}`)
    }
  })

  it('smooths more as the preset gets smoother', () => {
    const prices = noisySeries(800)
    const responsive = sumSqDiffLog(localTrendFilter(prices, 'responsive').smoothed)
    const balanced = sumSqDiffLog(localTrendFilter(prices, 'balanced').smoothed)
    const smooth = sumSqDiffLog(localTrendFilter(prices, 'smooth').smoothed)
    assert.ok(smooth < balanced, `smooth ${smooth} < balanced ${balanced}`)
    assert.ok(balanced < responsive, `balanced ${balanced} < responsive ${responsive}`)
  })

  it('is causal: earlier outputs do not depend on later prices', () => {
    const prices = noisySeries(400)
    for (const p of PRESETS) {
      const short = localTrendFilter(prices.slice(0, 300), p)
      const long = localTrendFilter(prices, p)
      for (let i = 0; i < 300; i++) {
        assert.ok(Math.abs(short.smoothed[i] - long.smoothed[i]) < 1e-12, `${p} smoothed[${i}]`)
        assert.ok(Math.abs(short.deviation[i] - long.deviation[i]) < 1e-12, `${p} deviation[${i}]`)
      }
    }
  })

  it('returns arrays matching the input length, positive and finite', () => {
    const prices = noisySeries(120)
    for (const p of PRESETS) {
      const { smoothed, deviation } = localTrendFilter(prices, p)
      assert.equal(smoothed.length, prices.length)
      assert.equal(deviation.length, prices.length)
      for (const v of smoothed) {
        assert.ok(Number.isFinite(v) && v > 0, `${p} smoothed value ${v}`)
      }
      for (const v of deviation) assert.ok(Number.isFinite(v), `${p} deviation value ${v}`)
    }
  })

  it('returns empty arrays for empty input and uses the first price at index 0', () => {
    const empty = localTrendFilter([])
    assert.deepEqual(empty.smoothed, [])
    assert.deepEqual(empty.deviation, [])
    const one = localTrendFilter([100, 101])
    assert.ok(Math.abs(one.smoothed[0] - 100) < 1e-9)
    assert.ok(Math.abs(one.deviation[0]) < 1e-9)
  })
})
