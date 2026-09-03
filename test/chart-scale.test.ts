import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { pointX, toTimeDomain } from '../utils/chart-scale.ts'

const SVG_W = 260
const PAD = 5

const DAY = 86_400_000
const BASE = new Date('2026-08-19T00:00:00Z').getTime()

function mainTs(n: number): number[] {
  return Array.from({ length: n }, (_, i) => BASE + i * DAY)
}

describe('chart-scale', () => {
  it('main occupies the left and forecast the right on a shared time domain', () => {
    const main = mainTs(15)
    const fc = mainTs(15).map(t => t + 15 * DAY).slice(0, 10)
    const domain = toTimeDomain([{ timestamps: main }, { timestamps: fc }])
    assert.ok(domain)
    const mainLastX = pointX(main[main.length - 1], main.length - 1, main.length, domain, SVG_W, PAD)
    const fcFirstX = pointX(fc[0], 0, fc.length, domain, SVG_W, PAD)
    assert.ok(fcFirstX > mainLastX, 'forecast must start to the right of the main series')
    assert.ok(main[0] === domain.min, 'domain starts at the main series start')
    assert.ok(fc[fc.length - 1] === domain.max, 'domain ends at the forecast end')
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
})
