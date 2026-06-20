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

export function calcRSI(data: number[], period: number): number[] {
  const result: number[] = []
  const gains: number[] = []
  const losses: number[] = []
  for (let i = 1; i < data.length; i++) {
    const diff = data[i] - data[i - 1]
    gains.push(diff > 0 ? diff : 0)
    losses.push(diff < 0 ? -diff : 0)
  }
  for (let i = 0; i < data.length; i++) {
    if (i < period) { result.push(50); continue }
    const avgGain = gains.slice(i - period, i).reduce((a, b) => a + b, 0) / period
    const avgLoss = losses.slice(i - period, i).reduce((a, b) => a + b, 0) / period
    if (avgLoss === 0) { result.push(100); continue }
    const rs = avgGain / avgLoss
    result.push(100 - 100 / (1 + rs))
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
