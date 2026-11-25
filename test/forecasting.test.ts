import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  FORECAST_MODELS,
  autoWeights,
  backtest,
  calibrateMeanReversion,
  fitAR,
  fitDrift,
  forecast,
  forecastWithBacktest,
  isForecastModel,
  nelderMead,
} from '../utils/forecasting.ts'

// ---------- seeded randomness (never Math.random) ----------

/** Linear congruential generator returning uniforms in (0, 1). */
function lcg(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return (s + 0.5) / 4294967296
  }
}

/** Box-Muller standard normal from two uniforms. */
function gauss(next: () => number): number {
  const u1 = next()
  const u2 = next()
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
}

/** Prices from a list of log returns, starting at `start`. */
function pricesFromReturns(returns: number[], start = 100): number[] {
  const out = [start]
  let level = Math.log(start)
  for (const r of returns) {
    level += r
    out.push(Math.exp(level))
  }
  return out
}

function trendPrices(seed = 1, n = 800): number[] {
  const next = lcg(seed)
  const returns: number[] = []
  for (let i = 1; i < n; i++) returns.push(0.002 + 0.005 * gauss(next))
  return pricesFromReturns(returns)
}

function randomWalkPrices(seed = 2, n = 800): number[] {
  const next = lcg(seed)
  const returns: number[] = []
  for (let i = 1; i < n; i++) returns.push(0.01 * gauss(next))
  return pricesFromReturns(returns)
}

function arPrices(seed = 3): number[] {
  const next = lcg(seed)
  const returns: number[] = []
  let r = 0
  for (let i = 0; i < 1500; i++) {
    r = 0.5 * r + 0.01 * gauss(next)
    returns.push(r)
  }
  // One final clearly positive return.
  returns.push(0.03)
  return pricesFromReturns(returns)
}

function meanRevertingPrices(seed = 4, n = 1200): number[] {
  const next = lcg(seed)
  const prices: number[] = []
  let x = 0
  for (let i = 0; i < n; i++) {
    x = 0.95 * x + 0.01 * gauss(next)
    prices.push(100 * Math.exp(x))
  }
  // Push the last three points well above the level (+15%).
  for (let i = n - 3; i < n; i++) prices[i] = prices[i]! * 1.15
  return prices
}

const logs = (prices: number[]) => prices.map(p => Math.log(p))

// ---------- optimiser ----------

describe('nelderMead', () => {
  it('finds the minimum of a separable quadratic within 1e-3', () => {
    const best = nelderMead(p => (p[0]! - 3) ** 2 + (p[1]! + 1) ** 2, [0, 0])
    assert.ok(Math.abs(best[0]! - 3) < 1e-3, `x = ${best[0]}`)
    assert.ok(Math.abs(best[1]! + 1) < 1e-3, `y = ${best[1]}`)
  })
})

// ---------- public API contract ----------

describe('forecast', () => {
  it('throws on fewer than 60 usable prices', () => {
    const prices = randomWalkPrices(5, 59)
    assert.throws(() => forecast(prices, 10), Error)
  })

  it('returns positive, finite, ordered bands whose width grows with the step', () => {
    const path = forecast(randomWalkPrices(), 30)
    assert.equal(path.values.length, 30)
    assert.equal(path.lower.length, 30)
    assert.equal(path.upper.length, 30)
    for (let i = 0; i < 30; i++) {
      const v = path.values[i]!
      const lo = path.lower[i]!
      const hi = path.upper[i]!
      assert.ok(Number.isFinite(v) && v > 0, `value ${i} = ${v}`)
      assert.ok(Number.isFinite(lo) && lo > 0, `lower ${i} = ${lo}`)
      assert.ok(Number.isFinite(hi), `upper ${i} = ${hi}`)
      assert.ok(lo < v && v < hi, `band ${i}: ${lo} < ${v} < ${hi}`)
    }
    for (let i = 1; i < 30; i++) {
      const wPrev = path.upper[i - 1]! - path.lower[i - 1]!
      const w = path.upper[i]! - path.lower[i]!
      assert.ok(w > wPrev, `width at step ${i + 1} (${w}) should exceed step ${i} (${wPrev})`)
    }
  })
})

describe('isForecastModel and FORECAST_MODELS', () => {
  it('lists exactly auto, drift, ar and meanReversion', () => {
    assert.deepEqual(FORECAST_MODELS.map(m => m.id).sort(), ['ar', 'auto', 'drift', 'meanReversion'])
  })

  it('accepts the four ids and rejects holt and kalman', () => {
    for (const id of ['auto', 'drift', 'ar', 'meanReversion']) assert.equal(isForecastModel(id), true, id)
    assert.equal(isForecastModel('holt'), false)
    assert.equal(isForecastModel('kalman'), false)
    assert.equal(isForecastModel(undefined), false)
  })
})

// ---------- individual models ----------

describe('drift model', () => {
  it('projects a strong steady trend upward, close to the true drift', () => {
    const y = logs(trendPrices())
    const last = y[y.length - 1]!
    const f = fitDrift(y, 30)
    const move = f.mean[29]! - last
    const expected = 0.002 * 30
    assert.ok(move > 0, `forecast should end above the last price, move = ${move}`)
    assert.ok(Math.abs(move - expected) <= 0.25 * expected, `move ${move} vs ${expected}`)
  })

  it('shrinks the drift of a driftless random walk toward zero', () => {
    const prices = randomWalkPrices()
    const last = prices[prices.length - 1]!
    const f = fitDrift(logs(prices), 30)
    const finalPrice = Math.exp(f.mean[29]!)
    assert.ok(Math.abs(finalPrice / last - 1) < 0.015, `final ${finalPrice} vs last ${last}`)
  })
})

describe('ar model', () => {
  it('forecasts above the last price after a positive shock to an AR(1) return series', () => {
    const y = logs(arPrices())
    const last = y[y.length - 1]!
    const f = fitAR(y, 1)
    assert.ok(f.mean[0]! > last, `1-step forecast ${f.mean[0]} vs last ${last}`)
  })
})

describe('meanReversion model', () => {
  it('forecasts back down after a sharp spike above the level', () => {
    const prices = meanRevertingPrices()
    const last = prices[prices.length - 1]!
    const path = forecast(prices, 60, 'meanReversion')
    assert.ok(path.values[59]! < last, `60-step forecast ${path.values[59]} vs last ${last}`)
  })

  it('calibrates a persistent temporary component and positive sigmas', () => {
    const p = calibrateMeanReversion(logs(meanRevertingPrices()))
    assert.ok(p.phi > 0.5 && p.phi < 1, `phi = ${p.phi}`)
    assert.ok(p.sigmaChi > 0, `sigmaChi = ${p.sigmaChi}`)
    assert.ok(p.sigmaXi > 0, `sigmaXi = ${p.sigmaXi}`)
  })
})

// ---------- backtest ----------

describe('backtest', () => {
  it('drift has positive skill and a good hit rate on a strong trend', () => {
    const r = backtest(trendPrices(), 20, 'drift')
    assert.ok(r.n >= 8, `n = ${r.n}`)
    assert.ok(r.skill > 0, `skill = ${r.skill}`)
    assert.ok(r.hitRate > 0.6, `hitRate = ${r.hitRate}`)
  })

  it('drift is calibrated and has no skill on a driftless random walk', () => {
    const r = backtest(randomWalkPrices(), 20, 'drift')
    assert.ok(r.n >= 8, `n = ${r.n}`)
    assert.ok(r.coverage >= 0.75 && r.coverage <= 1, `coverage = ${r.coverage}`)
    assert.ok(Math.abs(r.skill) < 0.25, `skill = ${r.skill}`)
  })

  it('returns zeros when the series is too short to replay', () => {
    const r = backtest(randomWalkPrices(7, 70), 30, 'drift')
    assert.deepEqual(r, { skill: 0, hitRate: 0, coverage: 0, n: 0 })
  })
})

// ---------- automatic blend ----------

describe('auto mode', () => {
  it('autoWeights are non-negative and sum to one over the four candidates', () => {
    const w = autoWeights(trendPrices(), 30)
    assert.deepEqual(Object.keys(w).sort(), ['ar', 'drift', 'meanReversion', 'naive'])
    let total = 0
    for (const v of Object.values(w)) {
      assert.ok(v >= 0, `weight ${v} is negative`)
      total += v
    }
    assert.ok(Math.abs(total - 1) < 1e-9, `weights sum to ${total}`)
  })

  it('has positive backtest skill on a strong trend', () => {
    const r = backtest(trendPrices(), 20, 'auto')
    assert.ok(r.n >= 8, `n = ${r.n}`)
    assert.ok(r.skill > 0, `skill = ${r.skill}`)
  })

  it('stays within 3% of the last price on a driftless random walk', () => {
    const prices = randomWalkPrices()
    const last = prices[prices.length - 1]!
    const path = forecast(prices, 30, 'auto')
    assert.ok(Math.abs(path.values[29]! / last - 1) < 0.03, `final ${path.values[29]} vs last ${last}`)
  })

  it('does not depend on data beyond the points passed in (no look-ahead)', () => {
    const all = trendPrices(9, 900)
    const base = all.slice(0, 700)
    const expected = backtest(base, 20, 'auto')
    // Future points beyond the 700 passed in, wildly altered, must not matter.
    const polluted = [...base, ...all.slice(700).map(p => p * 50)]
    assert.deepEqual(backtest(polluted.slice(0, 700), 20, 'auto'), expected)
    assert.equal(polluted.length, 900)
  })
})

describe('forecastWithBacktest', () => {
  it('returns the same path as forecast() and the same backtest as backtest()', () => {
    const prices = trendPrices(11, 900)
    for (const model of ['auto', 'drift'] as const) {
      const both = forecastWithBacktest(prices, 30, model, 16)
      assert.deepEqual(both.path, forecast(prices, 30, model), `path for ${model}`)
      assert.deepEqual(both.backtest, backtest(prices, 30, model, 16), `backtest for ${model}`)
    }
  })

  it('runs in under 1.5 seconds on 1260 prices with 30 steps and 16 origins', () => {
    const prices = randomWalkPrices(21, 1260)
    const t0 = performance.now()
    forecastWithBacktest(prices, 30, 'auto', 16)
    const ms = performance.now() - t0
    assert.ok(ms < 1500, `took ${ms.toFixed(0)} ms`)
  })
})
