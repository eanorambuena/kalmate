import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { pointX, toTimeDomain, splitTimeDomain, xLimit, splitPanels, groupByUnit, yRange, valueToY, plotX, bandPath, nearestIndex, medianGap } from '../utils/chart-scale.ts'

const SVG_W = 260
const PAD = 5

const DAY = 86_400_000
const BASE = new Date('2026-08-19T00:00:00Z').getTime()

function mainTs(n: number): number[] {
  return Array.from({ length: n }, (_, i) => BASE + i * DAY)
}

describe('chart-scale', () => {
  it('main occupies the left and forecast the right on a shared time domain', () => {
    const mainTimes = mainTs(15)
    const forecast = mainTs(15).map(t => t + 15 * DAY).slice(0, 10)
    const domain = toTimeDomain([{ timestamps: mainTimes }, { timestamps: forecast }])
    assert.ok(domain)
    const mainLastX = pointX(mainTimes[mainTimes.length - 1], mainTimes.length - 1, mainTimes.length, domain, SVG_W, PAD)
    const forecastFirstX = pointX(forecast[0], 0, forecast.length, domain, SVG_W, PAD)
    assert.ok(forecastFirstX > mainLastX, 'forecast must start to the right of the main series')
    assert.ok(mainTimes[0] === domain.min, 'domain starts at the main series start')
    assert.ok(forecast[forecast.length - 1] === domain.max, 'domain ends at the forecast end')
  })

  it('a single series spans the full width', () => {
    const ts = mainTs(15)
    const domain = toTimeDomain([{ timestamps: ts }])
    const first = pointX(ts[0], 0, 15, domain, SVG_W, PAD)
    const last = pointX(ts[14], 14, 15, domain, SVG_W, PAD)
    assert.equal(first, PAD)
    assert.ok(Math.abs(last - (SVG_W - PAD)) < 1e-6)
  })

  it('falls back to index-based X when there are no timestamps', () => {
    const first = pointX(undefined, 0, 10, null, SVG_W, PAD)
    const mid = pointX(undefined, 5, 10, null, SVG_W, PAD)
    const last = pointX(undefined, 9, 10, null, SVG_W, PAD)
    assert.equal(first, PAD)
    assert.ok(Math.abs(mid - (PAD + (5 / 9) * (SVG_W - PAD * 2))) < 1e-6)
    assert.ok(Math.abs(last - (SVG_W - PAD)) < 1e-6)
  })

  it('toTimeDomain returns null for empty or flat time ranges', () => {
    assert.equal(toTimeDomain([]), null)
    assert.equal(toTimeDomain([{ timestamps: [] }]), null)
    assert.equal(toTimeDomain([{ timestamps: [BASE, BASE] }]), null)
    assert.ok(toTimeDomain([{ timestamps: [BASE] }, { timestamps: [BASE + DAY] }]))
  })

  it('splitTimeDomain forces the main series to occupy at least the left half', () => {
    // few historical points + many future forecast steps => natural fraction is small
    const mainTimes = mainTs(5)
    const forecast = mainTs(5).map(t => t + 5 * DAY).slice(0, 20)
    const global = toTimeDomain([{ timestamps: mainTimes }, { timestamps: forecast }])!
    const domain = splitTimeDomain({ global, mainTimes, fraction: 0.5 })!
    const mainLastX = pointX(mainTimes[mainTimes.length - 1], mainTimes.length - 1, mainTimes.length, domain, SVG_W, PAD)
    const splitX = PAD + 0.5 * (SVG_W - PAD * 2)
    assert.ok(Math.abs(mainLastX - splitX) < 1e-6, 'last main point sits at the 50% mark')
  })

  it('splitTimeDomain keeps the natural domain when main already spans >= half', () => {
    // many main points + short forecast => main naturally > 50%
    const mainTimes = mainTs(30)
    const forecast = mainTs(30).map(t => t + 30 * DAY).slice(0, 3)
    const global = toTimeDomain([{ timestamps: mainTimes }, { timestamps: forecast }])!
    const domain = splitTimeDomain({ global, mainTimes, fraction: 0.5 })!
    assert.deepEqual(domain, global)
  })

  it('forecast points beyond the right limit are truncated (x > limit)', () => {
    const mainTimes = mainTs(5)
    const forecast = mainTs(5).map(t => t + 5 * DAY).slice(0, 20)
    const global = toTimeDomain([{ timestamps: mainTimes }, { timestamps: forecast }])!
    const domain = splitTimeDomain({ global, mainTimes, fraction: 0.5 })!
    const limit = xLimit(SVG_W, PAD)
    let visible = 0
    let truncated = 0
    for (let i = 0; i < forecast.length; i++) {
      const x = pointX(forecast[i], i, forecast.length, domain, SVG_W, PAD)
      if (x <= limit) visible++
      else truncated++
    }
    assert.ok(visible >= 2, 'a contiguous leading portion of the forecast is drawn')
    assert.ok(truncated > 0, 'the overflow tail of the forecast is cut off')
    assert.equal(visible + truncated, forecast.length)
  })
})

type P = { timestamp: number; value: number; lower?: number; upper?: number }
const pts = (values: number[]): P[] => values.map((v, i) => ({ timestamp: BASE + i * DAY, value: v }))

describe('chart panels', () => {
  it('puts price series in the main panel and every other unit in the secondary panel', () => {
    const series = [
      { handle: 'mainSeries', label: 'Price', unit: 'price', points: pts([1, 2]) },
      { handle: 'overlayA', label: 'SMA', unit: 'price', points: pts([1, 2]) },
      { handle: 'overlayB', label: 'RSI', unit: 'index', points: pts([40, 60]) },
      { handle: 'overlayC', label: 'Dev', unit: 'percent', points: pts([0.01, -0.02]) },
    ]
    const { main, secondary } = splitPanels(series)
    assert.deepEqual(main.map(s => s.label), ['Price', 'SMA'])
    assert.deepEqual(secondary.map(s => s.label), ['RSI', 'Dev'])
  })

  it('leaves the secondary panel empty when everything is a price', () => {
    const series = [{ handle: 'mainSeries', label: 'Price', unit: 'price', points: pts([1, 2]) }]
    const { main, secondary } = splitPanels(series)
    assert.equal(main.length, 1)
    assert.equal(secondary.length, 0)
  })

  it('treats a series without a unit as a price', () => {
    const { main, secondary } = splitPanels([{ handle: 'mainSeries', label: 'X', points: pts([1]) }])
    assert.equal(main.length, 1)
    assert.equal(secondary.length, 0)
  })

  it('uses the main series unit as the main panel when no price series is connected', () => {
    // Rebased series are unit "index": both belong in the main panel.
    const series = [
      { handle: 'mainSeries', label: 'AAPL', unit: 'index', points: pts([100, 110]) },
      { handle: 'overlayA', label: 'MSFT', unit: 'index', points: pts([100, 95]) },
      { handle: 'overlayB', label: 'Dev', unit: 'percent', points: pts([0, 0.1]) },
    ]
    const { main, secondary } = splitPanels(series)
    assert.deepEqual(main.map(s => s.label), ['AAPL', 'MSFT'])
    assert.deepEqual(secondary.map(s => s.label), ['Dev'])
  })

  it('groups series by unit, keeping the first-seen unit order', () => {
    const series = [
      { handle: 'a', label: 'RSI', unit: 'index', points: pts([1]) },
      { handle: 'b', label: 'Dev', unit: 'percent', points: pts([1]) },
      { handle: 'c', label: 'RSI 2', unit: 'index', points: pts([1]) },
    ]
    const groups = groupByUnit(series)
    assert.deepEqual([...groups.keys()], ['index', 'percent'])
    assert.deepEqual(groups.get('index')!.map(s => s.label), ['RSI', 'RSI 2'])
  })
})

describe('chart y range and scaling', () => {
  it('returns null for no finite values', () => {
    assert.equal(yRange([]), null)
    assert.equal(yRange([{ points: [] }]), null)
  })

  it('spans the values', () => {
    assert.deepEqual(yRange([{ points: pts([3, 1, 7]) }]), { min: 1, max: 7 })
  })

  it('includes the lower and upper bands of a forecast', () => {
    const band: P[] = [
      { timestamp: BASE, value: 10, lower: 10, upper: 10 },
      { timestamp: BASE + DAY, value: 12, lower: 8, upper: 15 },
    ]
    assert.deepEqual(yRange([{ points: band }]), { min: 8, max: 15 })
  })

  it('pads a flat series so the scale is never zero-width', () => {
    const r = yRange([{ points: pts([5, 5, 5]) }])!
    assert.ok(r.max > r.min)
    assert.ok(r.min < 5 && r.max > 5)
  })

  it('maps min to the bottom and max to the top of the panel', () => {
    const r = { min: 2, max: 6 }
    assert.equal(valueToY(2, r, 10, 110), 110)
    assert.equal(valueToY(6, r, 10, 110), 10)
    assert.equal(valueToY(4, r, 10, 110), 60)
  })
})


describe('chart geometry helpers', () => {
  it('plotX maps the time domain linearly onto [x0, x1]', () => {
    const dom = { min: BASE, max: BASE + 10 * DAY }
    assert.equal(plotX(BASE, 0, 11, dom, 30, 230), 30)
    assert.equal(plotX(BASE + 10 * DAY, 10, 11, dom, 30, 230), 230)
    assert.equal(plotX(BASE + 5 * DAY, 5, 11, dom, 30, 230), 130)
  })

  it('plotX falls back to index spacing without timestamps', () => {
    assert.equal(plotX(undefined, 0, 3, null, 30, 230), 30)
    assert.equal(plotX(undefined, 2, 3, null, 30, 230), 230)
  })

  it('bandPath closes a polygon from upper points forward and lower points back', () => {
    const upper = [{ x: 0, y: 1 }, { x: 10, y: 2 }]
    const lower = [{ x: 0, y: 5 }, { x: 10, y: 6 }]
    assert.equal(bandPath(upper, lower), 'M0,1 L10,2 L10,6 L0,5 Z')
  })

  it('bandPath is empty for fewer than two points', () => {
    assert.equal(bandPath([{ x: 0, y: 1 }], [{ x: 0, y: 2 }]), '')
  })

  it('nearestIndex finds the closest timestamp', () => {
    const ts = [BASE, BASE + DAY, BASE + 2 * DAY]
    assert.equal(nearestIndex(ts, BASE - DAY), 0)
    assert.equal(nearestIndex(ts, BASE + 0.4 * DAY), 0)
    assert.equal(nearestIndex(ts, BASE + 0.6 * DAY), 1)
    assert.equal(nearestIndex(ts, BASE + 9 * DAY), 2)
    assert.equal(nearestIndex([], BASE), -1)
  })

  it('medianGap is the median spacing between timestamps, or 0 when there are fewer than two', () => {
    assert.equal(medianGap([BASE, BASE + DAY, BASE + 2 * DAY, BASE + 10 * DAY]), DAY)
    assert.equal(medianGap([BASE]), 0)
  })
})
