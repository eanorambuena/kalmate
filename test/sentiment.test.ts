import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { headlineSentiment, averageSentiment } from '../utils/sentiment.ts'

describe('headlineSentiment', () => {
  it('scores a clearly positive headline above zero', () => {
    assert.ok(headlineSentiment('Shares surge after record profit and strong growth') > 0)
  })

  it('scores a clearly negative headline below zero', () => {
    assert.ok(headlineSentiment('Stock plunges as company faces lawsuit and fraud probe') < 0)
  })

  it('scores a neutral headline exactly zero', () => {
    assert.equal(headlineSentiment('Company to hold annual meeting in Denver on Tuesday'), 0)
  })

  it('matches case-insensitively', () => {
    assert.equal(headlineSentiment('SURGE'), headlineSentiment('surge'))
    assert.ok(headlineSentiment('RALLY') > 0)
    assert.ok(headlineSentiment('Plunge') < 0)
  })

  it('matches whole words only', () => {
    assert.equal(headlineSentiment('Stocks trade against the trend'), 0)
    assert.equal(headlineSentiment('Army launches missile test'), 0)
    assert.equal(headlineSentiment('Index holds steady against rivals'), 0)
  })

  it('stays within [-1, 1]', () => {
    for (const t of ['surge gain beat profit', 'plunge loss miss fraud', 'surge plunge', '']) {
      const s = headlineSentiment(t)
      assert.ok(s >= -1 && s <= 1, `${t} -> ${s}`)
    }
  })
})

describe('averageSentiment', () => {
  it('is the mean of per-headline scores', () => {
    const headlines = ['record profit', 'lawsuit filed', 'annual meeting']
    const expected = (headlineSentiment(headlines[0]) + headlineSentiment(headlines[1]) + headlineSentiment(headlines[2])) / 3
    assert.equal(averageSentiment(headlines), expected)
  })

  it('returns 0 for an empty list', () => {
    assert.equal(averageSentiment([]), 0)
  })
})
