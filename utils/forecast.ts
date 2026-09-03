import { runKalmanFilter, calibrateMLE } from './kalman.ts'

export interface ForecastResult {
  forecast: number[]
  confidence: number[]
}

function relativeConfidence(predicted: number[], values: number[]): number[] {
  const vol = returnVolatility(values)
  return predicted.map((p, i) => Math.min(Math.abs(p) * 0.99, Math.abs(p) * (Math.exp(1.96 * vol * Math.sqrt(i + 1)) - 1)))
}

function returnVolatility(values: number[]): number {
  if (values.length < 2) return 0.02
  const logReturns = []
  for (let i = 1; i < values.length; i++) {
    const r = Math.log(values[i] / values[i - 1])
    if (Number.isFinite(r)) logReturns.push(r)
    else if (values[i] !== values[i - 1]) logReturns.push(Math.sign(values[i] - values[i - 1]) * 1e-6)
  }
  if (logReturns.length === 0) return 0.02
  const mean = logReturns.reduce((a, b) => a + b, 0) / logReturns.length
  const variance = logReturns.reduce((a, r) => a + (r - mean) ** 2, 0) / logReturns.length
  return Math.max(1e-4, Math.sqrt(variance))
}

export function forecastKalman(values: number[], steps: number): ForecastResult {
  const result = runKalmanFilter(values, calibrateMLE(values), steps)
  return { forecast: result.predicted, confidence: result.confidence }
}

export function forecastLinear(values: number[], steps: number): ForecastResult {
  const n = values.length
  const meanX = (n - 1) / 2
  const meanY = values.reduce((a, b) => a + b, 0) / n
  let num = 0
  let den = 0
  for (let i = 0; i < n; i++) {
    num += (i - meanX) * (values[i] - meanY)
    den += (i - meanX) * (i - meanX)
  }
  const slope = den > 0 ? num / den : 0
  const intercept = meanY - slope * meanX
  const predicted: number[] = []
  for (let h = 1; h <= steps; h++) predicted.push(intercept + slope * (n - 1 + h))
  const confidence = relativeConfidence(predicted, values)
  return { forecast: predicted, confidence }
}

export function forecastHolt(values: number[], steps: number): ForecastResult {
  const alpha = 0.6
  const beta = 0.3
  let level = values[0]
  let trend = values.length > 1 ? values[1] - values[0] : 0
  for (let i = 1; i < values.length; i++) {
    const prevLevel = level
    level = alpha * values[i] + (1 - alpha) * (prevLevel + trend)
    trend = beta * (level - prevLevel) + (1 - beta) * trend
  }
  const predicted = []
  for (let h = 1; h <= steps; h++) predicted.push(Math.max(0.01, level + h * trend))
  const confidence = relativeConfidence(predicted, values)
  return { forecast: predicted, confidence }
}

export function forecastARIMA(values: number[], steps: number): ForecastResult {
  const diff = []
  for (let i = 1; i < values.length; i++) diff.push(values[i] - values[i - 1])
  const m = diff.length
  const meanDiff = diff.reduce((a, b) => a + b, 0) / m
  const centered = diff.map(d => d - meanDiff)
  let num = 0
  let den = 0
  for (let i = 1; i < m; i++) {
    num += centered[i] * centered[i - 1]
    den += centered[i - 1] * centered[i - 1]
  }
  const phi = den > 1e-12 ? num / den : 0
  const predicted = []
  let lastDiff = centered[m - 1] ?? 0
  let lastVal = values[values.length - 1]
  for (let h = 0; h < steps; h++) {
    lastDiff = phi * lastDiff
    lastVal += lastDiff + meanDiff
    predicted.push(lastVal)
  }
  const confidence = relativeConfidence(predicted, values)
  return { forecast: predicted, confidence }
}

export function runForecast(values: number[], steps: number, algorithm: string): ForecastResult {
  switch (algorithm) {
    case 'linear': return forecastLinear(values, steps)
    case 'holt': return forecastHolt(values, steps)
    case 'arima': return forecastARIMA(values, steps)
    case 'kalman':
    default: return forecastKalman(values, steps)
  }
}
