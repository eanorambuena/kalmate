import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { isRateLimited } from '../utils/rateLimit.ts'

describe('isRateLimited', () => {
  it('allows requests under the limit', () => {
    const key = `test-${Math.random()}`
    for (let i = 0; i < 5; i++) {
      assert.equal(isRateLimited(key, 5, 60_000), false)
    }
  })

  it('blocks once the limit is reached within the window', () => {
    const key = `test-${Math.random()}`
    for (let i = 0; i < 3; i++) {
      assert.equal(isRateLimited(key, 3, 60_000), false)
    }
    assert.equal(isRateLimited(key, 3, 60_000), true)
  })

  it('tracks each key independently', () => {
    const keyA = `test-a-${Math.random()}`
    const keyB = `test-b-${Math.random()}`
    for (let i = 0; i < 3; i++) isRateLimited(keyA, 3, 60_000)
    assert.equal(isRateLimited(keyA, 3, 60_000), true, 'keyA should be blocked')
    assert.equal(isRateLimited(keyB, 3, 60_000), false, 'keyB should be unaffected')
  })

  it('allows requests again once the window has fully elapsed', () => {
    const key = `test-${Math.random()}`
    const windowMs = 10
    assert.equal(isRateLimited(key, 1, windowMs), false)
    assert.equal(isRateLimited(key, 1, windowMs), true)
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        assert.equal(isRateLimited(key, 1, windowMs), false)
        resolve()
      }, windowMs + 20)
    })
  })
})
