export function calcSMA(data: number[], period: number): number[] {
  const result: number[] = new Array(data.length).fill(0)
  if (data.length === 0 || period < 1) return result
  let sum = 0
  for (let i = 0; i < data.length; i++) {
    sum += data[i]
    if (i >= period - 1) {
      result[i] = sum / period
      sum -= data[i - period + 1]
    }
  }
  return result
}

/** Wilder's RSI. Indices before `period` are 50 (not enough data). */
export function calcRSI(data: number[], period: number): number[] {
  const n = data.length
  const result: number[] = new Array(n).fill(50)
  if (period < 1 || n <= period) return result

  const rsiOf = (avgGain: number, avgLoss: number): number => {
    if (avgGain === 0 && avgLoss === 0) return 50
    if (avgLoss === 0) return 100
    return 100 - 100 / (1 + avgGain / avgLoss)
  }

  let sumGain = 0
  let sumLoss = 0
  for (let k = 1; k <= period; k++) {
    const diff = data[k] - data[k - 1]
    if (diff > 0) sumGain += diff
    else sumLoss -= diff
  }
  let avgGain = sumGain / period
  let avgLoss = sumLoss / period
  result[period] = rsiOf(avgGain, avgLoss)

  for (let i = period + 1; i < n; i++) {
    const diff = data[i] - data[i - 1]
    const gain = diff > 0 ? diff : 0
    const loss = diff < 0 ? -diff : 0
    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period
    result[i] = rsiOf(avgGain, avgLoss)
  }
  return result
}

export function calcEMA(data: number[], period: number): number[] {
  const result: number[] = []
  const multiplier = 2 / (period + 1)
  let ema = data[0]
  for (let i = 0; i < data.length; i++) {
    if (i === 0) { result.push(ema); continue }
    ema = data[i] * multiplier + ema * (1 - multiplier)
    result.push(ema)
  }
  return result
}
