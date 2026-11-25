import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { toLineData, toBandData, toCandleData, assignPanes, visibleFrom, legendAt } from '../utils/lw-chart.ts'

const DAY = 86_400_000

describe('toLineData', () => {
  it('converts ms to whole seconds, sorts and drops non-finite values', () => {
    const out = toLineData([
      { timestamp: 2 * DAY, value: 2 },
      { timestamp: DAY, value: 1 },
      { timestamp: 3 * DAY, value: NaN },
    ])
    assert.deepEqual(out, [{ time: 86_400, value: 1 }, { time: 172_800, value: 2 }])
  })

  it('keeps the last value when two points share a second (times must be strictly ascending)', () => {
    const out = toLineData([{ timestamp: 1000, value: 1 }, { timestamp: 1500, value: 2 }])
    assert.deepEqual(out, [{ time: 1, value: 2 }])
  })
})

describe('toBandData', () => {
  it('returns upper and lower lines only where both bounds are finite', () => {
    const { upper, lower } = toBandData([
      { timestamp: DAY, value: 1 },
      { timestamp: 2 * DAY, value: 2, lower: 1.5, upper: 2.5 },
      { timestamp: 3 * DAY, value: 3, lower: 2, upper: NaN },
    ])
    assert.deepEqual(upper, [{ time: 172_800, value: 2.5 }])
    assert.deepEqual(lower, [{ time: 172_800, value: 1.5 }])
  })
})

describe('toCandleData', () => {
  it('converts, sorts and drops candles with missing or non-positive prices', () => {
    const out = toCandleData([
      { timestamp: 2 * DAY, open: 2, high: 3, low: 1, close: 2.5 },
      { timestamp: DAY, open: 1, high: 1.2, low: 0.9, close: 1.1 },
      { timestamp: 3 * DAY, open: 0, high: 1, low: 1, close: 1 },
    ])
    assert.deepEqual(out.map(c => c.time), [86_400, 172_800])
    assert.equal(out[1]!.close, 2.5)
  })
})

describe('assignPanes', () => {
  it('puts price series on pane 0 and each other unit on its own pane, in first-seen order', () => {
    const panes = assignPanes([
      { unit: 'price' }, { unit: 'index' }, { unit: 'price' }, { unit: 'number' }, { unit: 'index' },
    ])
    assert.deepEqual(panes, [0, 1, 0, 2, 1])
  })

  it('uses the first series unit for pane 0 when there is no price series', () => {
    assert.deepEqual(assignPanes([{ unit: 'index' }, { unit: 'percent' }]), [0, 1])
  })

  it('treats a missing unit as price', () => {
    assert.deepEqual(assignPanes([{}, { unit: 'ratio' }]), [0, 1])
  })
})

describe('visibleFrom', () => {
  const last = 1_800_000_000
  it('returns the start time in seconds for a horizon', () => {
    assert.equal(visibleFrom('1M', last), last - 30 * 86_400)
    assert.equal(visibleFrom('1Y', last), last - 365 * 86_400)
  })
  it('returns null for All or an unknown horizon', () => {
    assert.equal(visibleFrom('ALL', last), null)
    assert.equal(visibleFrom('x', last), null)
  })
})

describe('legendAt', () => {
  const data = [{ time: 10, value: 1 }, { time: 20, value: 2 }, { time: 30, value: 3 }]
  it('returns the value at or before the hovered time', () => {
    assert.equal(legendAt(data, 25), 2)
    assert.equal(legendAt(data, 30), 3)
  })
  it('returns the last value without a time and null before the first point', () => {
    assert.equal(legendAt(data, null), 3)
    assert.equal(legendAt(data, 5), null)
    assert.equal(legendAt([], null), null)
  })
})
