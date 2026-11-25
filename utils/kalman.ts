// Causal local-trend Kalman filter shared by the pipeline node and the stock page.

const LTF_PRESET_Q: Record<'responsive' | 'balanced' | 'smooth', number> = {
  responsive: 0.05,
  balanced: 0.005,
  smooth: 0.0005,
}

/**
 * Causal Kalman filter for a local linear trend on ln(price).
 * State [level, slope]; observation y = level + noise (R = 1);
 * process noise Q = diag(q, q * 0.01).
 */
export function localTrendFilter(
  prices: number[],
  smoothing: 'responsive' | 'balanced' | 'smooth' = 'balanced',
): { smoothed: number[]; deviation: number[] } {
  const n = prices.length
  const smoothed: number[] = []
  const deviation: number[] = []
  if (n === 0) return { smoothed, deviation }

  const q = LTF_PRESET_Q[smoothing] ?? LTF_PRESET_Q.balanced
  const qLevel = q
  const qSlope = q * 0.01
  const R = 1

  const y0 = Math.log(prices[0])
  let level = y0
  let slope = 0
  // Covariance P = [[p00, p01], [p01, p11]]
  let p00 = 1
  let p01 = 0
  let p11 = 0.01

  smoothed.push(Math.exp(level))
  deviation.push(prices[0] / smoothed[0] - 1)

  for (let i = 1; i < n; i++) {
    // Predict: x' = F x with F = [[1, 1], [0, 1]]; P' = F P F^T + Q
    const predLevel = level + slope
    const predSlope = slope
    const q00 = p00 + 2 * p01 + p11 + qLevel
    const q01 = p01 + p11
    const q11 = p11 + qSlope

    // Update with scalar observation y = level + v, H = [1, 0]
    const y = Math.log(prices[i])
    const S = q00 + R
    const k0 = q00 / S
    const k1 = q01 / S
    const innovation = y - predLevel

    level = predLevel + k0 * innovation
    slope = predSlope + k1 * innovation

    p00 = (1 - k0) * q00
    p01 = q01 - k0 * q01
    p11 = q11 - k1 * q01

    const s = Math.exp(level)
    smoothed.push(s)
    deviation.push(prices[i] / s - 1)
  }

  return { smoothed, deviation }
}
