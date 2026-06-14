export interface KalmanParams {
  phi: number
  mu: number
  sigmaChi: number
  sigmaXi: number
  sigmaObs: number
  rho: number
}

export interface KalmanResult {
  smoothed: number[]
  trend: number[]
  cycle: number[]
  predicted: number[]
  confidence: number[]
  logLikelihood: number
}

function matMul2x2(A: number[][], B: number[][]): number[][] {
  return [
    [A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]],
    [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]],
  ]
}

function matMulVec2x2(A: number[][], v: number[]): number[] {
  return [
    A[0][0] * v[0] + A[0][1] * v[1],
    A[1][0] * v[0] + A[1][1] * v[1],
  ]
}

function matTranspose2x2(A: number[][]): number[][] {
  return [[A[0][0], A[1][0]], [A[0][1], A[1][1]]]
}

function matAdd2x2(A: number[][], B: number[][]): number[][] {
  return [
    [A[0][0] + B[0][0], A[0][1] + B[0][1]],
    [A[1][0] + B[1][0], A[1][1] + B[1][1]],
  ]
}

export function createDefaultParams(): KalmanParams {
  return {
    phi: 0.9,
    mu: 0.0001,
    sigmaChi: 0.02,
    sigmaXi: 0.005,
    sigmaObs: 0.01,
    rho: -0.3,
  }
}

export function runKalmanFilter(
  prices: number[],
  params: KalmanParams,
  predictSteps: number = 10,
): KalmanResult {
  const n = prices.length
  const logPrices = prices.map(p => Math.log(p))
  const dt = 1

  const phi = params.phi
  const mu = params.mu * dt
  const sChi = params.sigmaChi * Math.sqrt(dt)
  const sXi = params.sigmaXi * Math.sqrt(dt)
  const sObs = params.sigmaObs
  const rho = params.rho

  const A: number[][] = [[phi, 0], [0, 1]]
  const c: number[] = [0, mu]
  const Q: number[][] = [
    [sChi * sChi, rho * sChi * sXi],
    [rho * sChi * sXi, sXi * sXi],
  ]
  const H: number[] = [1, 1]
  const R = sObs * sObs

  let x: number[] = [0, logPrices[0]]
  let P: number[][] = [[1, 0], [0, 1]]

  const smoothed: number[] = []
  const trend: number[] = []
  const cycle: number[] = []
  let logLik = 0

  for (let i = 0; i < n; i++) {
    const xPred = matMulVec2x2(A, x)
    xPred[0] += c[0]
    xPred[1] += c[1]

    const AT = matTranspose2x2(A)
    const APA = matMul2x2(matMul2x2(A, P), AT)
    const PPred = matAdd2x2(APA, Q)

    const zPred = H[0] * xPred[0] + H[1] * xPred[1]
    const innovation = logPrices[i] - zPred
    const F = H[0] * (PPred[0][0] * H[0] + PPred[0][1] * H[1]) +
              H[1] * (PPred[1][0] * H[0] + PPred[1][1] * H[1]) + R

    const K0 = (PPred[0][0] * H[0] + PPred[0][1] * H[1]) / F
    const K1 = (PPred[1][0] * H[0] + PPred[1][1] * H[1]) / F

    x[0] = xPred[0] + K0 * innovation
    x[1] = xPred[1] + K1 * innovation

    P[0][0] = PPred[0][0] - K0 * (PPred[0][0] * H[0] + PPred[0][1] * H[1])
    P[0][1] = PPred[0][1] - K0 * (PPred[1][0] * H[0] + PPred[1][1] * H[1])
    P[1][0] = PPred[1][0] - K1 * (PPred[0][0] * H[0] + PPred[0][1] * H[1])
    P[1][1] = PPred[1][1] - K1 * (PPred[1][0] * H[0] + PPred[1][1] * H[1])

    smoothed.push(Math.exp(x[0] + x[1]))
    trend.push(Math.exp(x[1]))
    cycle.push(x[0])

    logLik += -0.5 * (Math.log(2 * Math.PI) + Math.log(F) + (innovation * innovation) / F)
  }

  const predicted: number[] = []
  const confidence: number[] = []
  let px = [...x]
  let pP = [[P[0][0], P[0][1]], [P[1][0], P[1][1]]]

  for (let i = 0; i < predictSteps; i++) {
    const xp = matMulVec2x2(A, px)
    xp[0] += c[0]
    xp[1] += c[1]
    px = xp

    const AT = matTranspose2x2(A)
    pP = matAdd2x2(matMul2x2(matMul2x2(A, pP), AT), Q)

    const predPrice = Math.exp(px[0] + px[1])
    const predVar = pP[0][0] + pP[1][1] + 2 * pP[0][1] + R
    const ci = 1.96 * Math.sqrt(predVar)

    predicted.push(predPrice)
    confidence.push(predPrice * (Math.exp(ci) - 1))
  }

  return { smoothed, trend, cycle, predicted, confidence, logLikelihood: logLik }
}

export function calibrateMLE(prices: number[]): KalmanParams {
  const n = prices.length
  const logPrices = prices.map(p => Math.log(p))
  const returns = logPrices.slice(1).map((v, i) => v - logPrices[i])
  const meanRet = returns.reduce((a, b) => a + b, 0) / returns.length
  const variance = returns.reduce((a, b) => a + (b - meanRet) ** 2, 0) / returns.length
  const sigma = Math.sqrt(variance)
  const autoCorr = returns.slice(0, -1).reduce((a, r, i) => a + r * returns[i + 1], 0) /
    returns.slice(0, -1).reduce((a, r) => a + r * r, 0)

  return {
    phi: Math.min(0.99, Math.max(0.01, autoCorr)),
    mu: meanRet,
    sigmaChi: sigma * 0.8,
    sigmaXi: sigma * 0.3,
    sigmaObs: sigma * 0.15,
    rho: -0.3,
  }
}
