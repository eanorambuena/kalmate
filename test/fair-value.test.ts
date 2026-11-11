import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { fairValueFromMultiples } from '../utils/valuation.ts'

// Prices are stamped at noon UTC on the given date.
const at = (asOf: string) => Date.parse(asOf + 'T12:00:00Z')
const asOfs = (n: number) => Array.from({ length: n }, (_, i) => {
  const d = new Date(Date.UTC(2021, 2, 31))
  d.setUTCMonth(d.getUTCMonth() + 3 * i)
  return d.toISOString().slice(0, 10)
})
const lastPrice = (price: number) => ({ timestamp: at('2026-01-02'), value: price })

describe('fairValueFromMultiples', () => {
  it('values a company at its historical P/E times current EPS', () => {
    const points = asOfs(10).map(asOf => ({ asOf, eps: 4, bookValuePerShare: null }))
    const prices = [...asOfs(10).map(asOf => ({ timestamp: at(asOf), value: 80 })), lastPrice(80)]
    const r = fairValueFromMultiples(prices, points, { eps: 5, bookValuePerShare: null })
    assert.ok(Math.abs((r.fairValue ?? 0) - 100) < 1e-9)
    assert.ok(Math.abs((r.upsidePct ?? 0) - 0.25) < 1e-9)
    assert.equal(r.medianPe, 20)
    assert.equal(r.pe, 16)
    assert.equal(r.pb, null)
    assert.equal(r.observations, 10)
    assert.equal(r.error, undefined)
  })

  it('needs at least 8 observations for a usable multiple', () => {
    const points = asOfs(7).map(asOf => ({ asOf, eps: 4, bookValuePerShare: null }))
    const prices = [...asOfs(7).map(asOf => ({ timestamp: at(asOf), value: 80 })), lastPrice(80)]
    const r = fairValueFromMultiples(prices, points, { eps: 5, bookValuePerShare: null })
    assert.equal(r.fairValue, null)
    assert.equal(r.upsidePct, null)
    assert.equal(r.error, 'Not enough fundamental history to estimate fair value')
  })

  it('skips points with negative or zero EPS', () => {
    const good = asOfs(8).map(asOf => ({ asOf, eps: 4, bookValuePerShare: null }))
    const bad = asOfs(12).slice(8).map(asOf => ({ asOf, eps: -2, bookValuePerShare: null }))
    const points = [...good, ...bad]
    const prices = [...asOfs(12).map(asOf => ({ timestamp: at(asOf), value: 80 })), lastPrice(80)]
    const r = fairValueFromMultiples(prices, points, { eps: 5, bookValuePerShare: null })
    assert.equal(r.observations, 8)
    assert.equal(r.medianPe, 20)
    assert.equal(r.fairValue, 100)
  })

  it('uses P/B alone when EPS is not usable', () => {
    const points = asOfs(10).map(asOf => ({ asOf, eps: null, bookValuePerShare: 5 }))
    const prices = [...asOfs(10).map(asOf => ({ timestamp: at(asOf), value: 10 })), { timestamp: at('2026-01-02'), value: 10 }]
    const r = fairValueFromMultiples(prices, points, { eps: null, bookValuePerShare: 8 })
    assert.equal(r.medianPe, null)
    assert.equal(r.pe, null)
    assert.equal(r.medianPb, 2)
    assert.equal(r.fairValue, 16)
    assert.equal(r.pb, 1.25)
  })

  it('skips points dated before the first price', () => {
    const points = [{ asOf: '2000-01-01', eps: 4, bookValuePerShare: null },
      ...asOfs(8).map(asOf => ({ asOf, eps: 4, bookValuePerShare: null }))]
    const prices = [...asOfs(8).map(asOf => ({ timestamp: at(asOf), value: 80 })), lastPrice(80)]
    const r = fairValueFromMultiples(prices, points, { eps: 5, bookValuePerShare: null })
    assert.equal(r.observations, 8)
  })

  it('emits a fair value series with increasing timestamps', () => {
    const points = asOfs(10).map(asOf => ({ asOf, eps: 4, bookValuePerShare: null }))
    const prices = [...asOfs(10).map(asOf => ({ timestamp: at(asOf), value: 80 })), lastPrice(80)]
    const r = fairValueFromMultiples(prices, points, { eps: 5, bookValuePerShare: null })
    assert.equal(r.fairValueSeries.length, 10)
    const ts = r.fairValueSeries.map(p => p.timestamp)
    assert.ok(ts.every((t, i) => i === 0 || t > ts[i - 1]))
    assert.equal(ts[0], Date.parse(asOfs(10)[0] + 'T00:00:00Z'))
    assert.equal(r.fairValueSeries[0].value, 80)
  })

  it('returns an error for an empty price series', () => {
    const r = fairValueFromMultiples([], [], { eps: 5, bookValuePerShare: null })
    assert.equal(r.fairValue, null)
    assert.equal(r.error, 'Need a price series')
  })
})
