// Kalman analysis for the stock page: the same causal local-trend filter as
// the pipeline Kalman node, plus the validated automatic forecast. Replaces
// the old two-factor model whose parameters came from a moment heuristic.

import { localTrendFilter } from './kalman.ts'
import { forecastWithBacktest, type BacktestResult } from './forecasting.ts'

const MIN_FORECAST_HISTORY = 60
const MAX_STEPS = 60
const DEFAULT_STEPS = 10
const NO_BACKTEST: BacktestResult = { skill: 0, hitRate: 0, coverage: 0, n: 0 }

export interface KalmanAnalysis {
  smoothed: number[]
  /** price / trend - 1 for each point. */
  deviation: number[]
  deviationPct: number | null
  /** Where the latest price sits relative to its filtered trend. Descriptive only. */
  position: 'above' | 'below' | null
  predicted: number[]
  lower: number[]
  upper: number[]
  lastPrice: number | null
  predictedPrice: number | null
  backtest: BacktestResult
}

/** Drop non-positive or missing closes while keeping timestamps aligned. */
export function cleanHistory(history: { timestamp: number; close: number }[]): { timestamps: number[]; prices: number[] } {
  const timestamps: number[] = []
  const prices: number[] = []
  for (const h of history) {
    if (Number.isFinite(h.close) && h.close > 0 && Number.isFinite(h.timestamp)) {
      timestamps.push(h.timestamp)
      prices.push(h.close)
    }
  }
  return { timestamps, prices }
}

function clampSteps(steps: number): number {
  if (!Number.isFinite(steps)) return DEFAULT_STEPS
  return Math.min(MAX_STEPS, Math.max(1, Math.floor(steps)))
}

export function analyzeKalman(prices: number[], steps: number): KalmanAnalysis {
  const { smoothed, deviation } = localTrendFilter(prices, 'balanced')
  const deviationPct = deviation.length ? deviation[deviation.length - 1]! : null
  const position = deviationPct == null ? null : deviationPct > 0 ? 'above' : 'below'
  const lastPrice = prices.length ? prices[prices.length - 1]! : null

  let predicted: number[] = []
  let lower: number[] = []
  let upper: number[] = []
  let backtest = NO_BACKTEST
  if (prices.length >= MIN_FORECAST_HISTORY) {
    const fit = forecastWithBacktest(prices, clampSteps(steps), 'auto')
    predicted = fit.path.values
    lower = fit.path.lower
    upper = fit.path.upper
    backtest = fit.backtest
  }

  return {
    smoothed, deviation, deviationPct, position,
    predicted, lower, upper,
    lastPrice,
    predictedPrice: predicted.length ? predicted[predicted.length - 1]! : null,
    backtest,
  }
}
