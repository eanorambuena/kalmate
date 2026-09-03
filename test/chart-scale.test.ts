import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { pointX, toTimeDomain, splitTimeDomain, xLimit } from '../utils/chart-scale.ts'

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
