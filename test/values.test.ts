import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { toMs, combine, lastValue, formatValue, canConnect, normalizeSeries } from '../utils/pipeline/values.ts'
import { calcRSI } from '../utils/indicators.ts'

const S = (pairs: [number, number][]) => pairs.map(([timestamp, value]) => ({ timestamp, value }))

describe('timestamps', () => {
  it('converts second timestamps to milliseconds and leaves milliseconds alone', () => {
    assert.equal(toMs(1_636_727_400), 1_636_727_400_000)
    assert.equal(toMs(1_636_727_400_000), 1_636_727_400_000)
  })
})

describe('combine (Math node)', () => {
  it('combines two numbers', () => {
    assert.equal(combine(10, 4, '-'), 6)
    assert.equal(combine(10, 4, '/'), 2.5)
  })

  it('reports division by zero instead of inventing a zero', () => {
    assert.equal(combine(10, 0, '/'), null)
  })

  it('aligns two series by timestamp, not by position', () => {
    const price = S([[1, 100], [2, 110], [3, 120]])
    const sma = S([[2, 100], [3, 110]])
    assert.deepEqual(combine(price, sma, '/'), S([[2, 1.1], [3, 120 / 110]]))
  })

  it('broadcasts a number over a series on either side', () => {
    const price = S([[1, 100], [2, 110]])
    assert.deepEqual(combine(price, 2, '*'), S([[1, 200], [2, 220]]))
    assert.deepEqual(combine(1, price, '-'), S([[1, -99], [2, -109]]))
  })

  it('drops points where the result is undefined', () => {
    assert.deepEqual(combine(S([[1, 5], [2, 6]]), S([[1, 0], [2, 3]]), '/'), S([[2, 2]]))
  })

  it('still supports plain number arrays position by position', () => {
    assert.deepEqual(combine([1, 2, 3], [4, 5, 6], '+'), [5, 7, 9])
  })
})

describe('lastValue', () => {
  it('reads numbers, series and number arrays', () => {
    assert.equal(lastValue(7), 7)
    assert.equal(lastValue(S([[1, 5], [2, 9]])), 9)
    assert.equal(lastValue([1, 2, 3]), 3)
    assert.equal(lastValue('text'), null)
    assert.equal(lastValue([]), null)
  })
})

describe('normalizeSeries', () => {
  it('turns candles and second timestamps into a millisecond series', () => {
    const out = normalizeSeries([{ timestamp: 1_700_000_000, close: 10 }, { timestamp: 1_700_086_400, close: 11 }])
    assert.deepEqual(out, S([[1_700_000_000_000, 10], [1_700_086_400_000, 11]]))
  })
})

describe('formatValue', () => {
  it('formats by unit', () => {
    assert.equal(formatValue(350.6912, 'price'), '350.69')
    assert.equal(formatValue(0.0234, 'percent'), '+2.34%')
    assert.equal(formatValue(-0.5, 'percent'), '-50.00%')
    assert.equal(formatValue(57.49, 'index'), '57.5')
    assert.equal(formatValue(18.42, 'ratio'), '18.4x')
    assert.equal(formatValue(1234567.891, 'number'), '1,234,567.89')
    assert.equal(formatValue(0.000123, 'number'), '0.000123')
    assert.equal(formatValue(2_500_000_000, 'money'), '2.50B')
    assert.equal(formatValue(null, 'price'), '—')
    assert.equal(formatValue('Undervalued', 'text'), 'Undervalued')
  })
})

describe('canConnect', () => {
  it('lets numbers flow between price, scalar and signal ports', () => {
    assert.equal(canConnect('price', 'scalar'), true)
    assert.equal(canConnect('signal', 'scalar'), true)
  })
  it('keeps series, symbols and numbers apart', () => {
    assert.equal(canConnect('series', 'scalar'), false)
    assert.equal(canConnect('symbol', 'series'), false)
    assert.equal(canConnect('scalar', 'series'), false)
    assert.equal(canConnect('series', 'series'), true)
  })
  it('accepts anything on an any port', () => {
    assert.equal(canConnect('series', 'any'), true)
    assert.equal(canConnect('any', 'scalar'), true)
  })
})

describe('RSI (Wilder)', () => {
  it('matches the reference values from Wilder\'s worked example', () => {
    // Closing prices from the standard 14-period worked example.
    const closes = [44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.10, 45.42, 45.84, 46.08, 45.89, 46.03, 45.61, 46.28, 46.28, 46.00, 46.03, 46.41, 46.22, 45.64]
    const rsi = calcRSI(closes, 14)
    assert.ok(Math.abs(rsi[14]! - 70.46) < 0.1, `first RSI ${rsi[14]}`)
    assert.ok(Math.abs(rsi[15]! - 66.25) < 0.1, `second RSI ${rsi[15]}`)
    assert.ok(Math.abs(rsi[19]! - 57.92) < 0.15, `sixth RSI ${rsi[19]}`)
  })
})
