import { runKalmanFilter, calibrateMLE, createDefaultParams } from './kalman.ts'

export interface FairValueResult {
  /** Equilibrium price level per observation (exp of the long-term component ξ). */
  fairValue: number[]
  /** price / fairValue - 1, per observation. Negative = trading below its equilibrium (undervalued). */
  gap: number[]
}

export interface ZScoreResult {
  /** Standardised log-price against its trailing window. Negative = cheap vs its own history. */
  z: number[]
}

const MIN_FAIR_VALUE_POINTS = 30
const EQUILIBRIUM_NOISE_SCALE = 0.1

/**
 * Statistical fair value from the Schwartz-Smith Kalman model.
 *
 * The model splits log-price into a short-term deviation χ (mean-reverting,
 * AR(1) with φ) and a long-term equilibrium level ξ (random walk with drift).
 * `exp(ξ)` is therefore an estimate of where the price gravitates to, and
 * `price / exp(ξ) - 1` measures how far the market is from that level.
 * Unlike a forecast, this is a statement about the present, not the future path.
 */
export function estimateFairValue(prices: number[]): FairValueResult {
  if (prices.length < MIN_FAIR_VALUE_POINTS) {
    throw new Error(`Need at least ${MIN_FAIR_VALUE_POINTS} price points for fair value`)
  }
  const base = prices.length > 100 ? calibrateMLE(prices) : createDefaultParams()
  // Value must not chase price. The MLE fit lets the equilibrium absorb sharp
  // moves, which hides the very dislocation we want to measure, so the
  // equilibrium noise is damped and short-term shocks land in the deviation χ.
  const params = { ...base, sigmaXi: base.sigmaXi * EQUILIBRIUM_NOISE_SCALE }
  const { trend } = runKalmanFilter(prices, params, 0)
  // `trend` returned by runKalmanFilter is exp(ξ): the equilibrium level.
  const fairValue = trend
  const gap = prices.map((p, i) => {
    const fv = fairValue[i] ?? 0
    return fv > 0 ? p / fv - 1 : 0
  })
  return { fairValue, gap }
}

/**
 * Rolling z-score of log-price over a trailing window. The first `window - 1`
 * points are 0 (not enough history), mirroring the SMA/EMA convention.
 */
export function rollingZScore(prices: number[], window: number): ZScoreResult {
  const w = Math.max(2, Math.floor(window))
  const logP = prices.map(p => Math.log(p))
  const z: number[] = new Array(prices.length).fill(0)
  for (let i = w - 1; i < logP.length; i++) {
    const win = logP.slice(i - w + 1, i + 1)
    const mean = win.reduce((a, b) => a + b, 0) / w
    let sq = 0
    for (const v of win) sq += (v - mean) ** 2
    const std = Math.sqrt(sq / w)
    z[i] = std > 1e-12 ? ((win[w - 1] ?? 0) - mean) / std : 0
  }
  return { z }
}
