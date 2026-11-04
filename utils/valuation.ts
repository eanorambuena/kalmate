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

export interface ValueInputs {
  price: number
  bookValuePerShare?: number | null
  freeCashFlowPerShare?: number | null
  /** price / fairValue - 1 from estimateFairValue. */
  gapPct?: number | null
  /** Rolling z-score of log-price. */
  zScore?: number | null
}

export interface ValueScore {
  /** -1 (expensive) .. +1 (cheap). Average of the components that are available. */
  score: number
  verdict: 'Undervalued' | 'Fair value' | 'Overvalued'
  components: { bookYield: number | null; fcfYield: number | null; gap: number | null; z: number | null }
  components_used: number
}

const clamp = (x: number, lo = -1, hi = 1) => Math.max(lo, Math.min(hi, x))

/**
 * Transparent value tilt. Each component is mapped to [-1, 1] with a fixed,
 * documented rule (no fitting to returns). Missing inputs are skipped.
 *  - book yield (BVPS / price): log scale, P/B = 1 is neutral, P/B ≈ 0.4 is +1, P/B ≈ 5 is -1
 *  - FCF yield: 5% yield = +1
 *  - Kalman gap: -20% below fair value = +1
 *  - z-score: -2 = +1
 * This is a research indicator, not a trading signal. See the backtest notes.
 */
export function scoreValue(v: ValueInputs): ValueScore {
  const bookYield = v.bookValuePerShare != null && v.price > 0 ? v.bookValuePerShare / v.price : null
  const fcfYield = v.freeCashFlowPerShare != null && v.price > 0 ? v.freeCashFlowPerShare / v.price : null
  const comp = {
    bookYield: bookYield != null && bookYield > 0 ? clamp(Math.log(bookYield)) : null,
    fcfYield: fcfYield != null ? clamp(fcfYield / 0.05) : null,
    gap: v.gapPct != null ? clamp(-v.gapPct / 0.2) : null,
    z: v.zScore != null ? clamp(-v.zScore / 2) : null,
  }
  const used = Object.values(comp).filter((x): x is number => x !== null)
  const score = used.length ? used.reduce((a, b) => a + b, 0) / used.length : 0
  const verdict = score > 0.25 ? 'Undervalued' : score < -0.25 ? 'Overvalued' : 'Fair value'
  return { score, verdict, components: { bookYield: comp.bookYield, fcfYield: comp.fcfYield, gap: comp.gap, z: comp.z }, components_used: used.length }
}

export interface ReferenceComparison {
  /** price / reference - 1 */
  diffPct: number | null
  label: 'Above reference' | 'At reference' | 'Below reference' | 'No reference'
}

/**
 * Descriptive comparison of the current price with a reference value (fair
 * value, book-based target, etc.). It states where the price sits relative
 * to the reference and does not say whether to buy or sell.
 */
export function compareToReference(price: number, reference: number | null | undefined, band = 0.02): ReferenceComparison {
  if (!(price > 0) || reference == null || !(reference > 0)) return { diffPct: null, label: 'No reference' }
  const diffPct = price / reference - 1
  const label = diffPct > band ? 'Above reference' : diffPct < -band ? 'Below reference' : 'At reference'
  return { diffPct, label }
}
