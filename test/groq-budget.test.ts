import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  GROQ_LIMITS, FALLBACK_LIMITS, SAFETY_MARGIN, createBudget, estimateTokens, parseResetSeconds, limitsFromEnv,
} from '../utils/pipeline/groqBudget.ts'

const MODEL = 'openai/gpt-oss-120b'
const clock = (start = 1_000_000) => {
  let t = start
  return { now: () => t, advance: (ms: number) => { t += ms } }
}
const tiny = { rpm: 3, tpm: 1000, rpd: 5, tpd: 3000 }

describe('documented limits', () => {
  it('lists the Groq limits for the default model and a conservative fallback', () => {
    assert.deepEqual(GROQ_LIMITS[MODEL], { rpm: 30, tpm: 8000, rpd: 1000, tpd: 200000 })
    assert.ok(FALLBACK_LIMITS.tpm > 0 && FALLBACK_LIMITS.rpm > 0)
    assert.ok(SAFETY_MARGIN > 0 && SAFETY_MARGIN < 1, 'stay below the limit, never at it')
  })
})

describe('estimateTokens and parseResetSeconds', () => {
  it('estimates roughly four characters per token, rounding up', () => {
    assert.equal(estimateTokens(''), 0)
    assert.equal(estimateTokens('abcd'), 1)
    assert.equal(estimateTokens('abcde'), 2)
  })

  it('parses the duration formats Groq sends in reset headers', () => {
    assert.equal(parseResetSeconds('7.66s'), 7.66)
    assert.equal(parseResetSeconds('1m26.4s'), 86.4)
    assert.equal(parseResetSeconds('2m'), 120)
    assert.equal(parseResetSeconds('250ms'), 0.25)
    assert.equal(parseResetSeconds('12'), 12)
    assert.equal(parseResetSeconds(null), undefined)
    assert.equal(parseResetSeconds('soon'), undefined)
    assert.equal(parseResetSeconds('9'.repeat(400)), undefined, 'not a finite number of seconds')
  })
})

describe('limitsFromEnv', () => {
  it('reads numeric overrides and ignores junk', () => {
    assert.deepEqual(limitsFromEnv({ GROQ_RPM: '60', GROQ_TPM: '250000', GROQ_RPD: 'x', GROQ_TPD: '-1' }), { rpm: 60, tpm: 250000 })
    assert.deepEqual(limitsFromEnv({}), {})
  })
})

describe('createBudget', () => {
  it('allows requests under the margin-adjusted limit and denies the next one', () => {
    const c = clock()
    const b = createBudget({ limits: { [MODEL]: tiny }, margin: 0.5, now: c.now }) // effective rpm = 1
    assert.equal(b.reserve(MODEL, 10).ok, true)
    const second = b.reserve(MODEL, 10)
    assert.equal(second.ok, false)
    assert.equal((second as any).reason, 'rpm')
  })

  it('tells the caller how long to wait, then allows again once the window slides', () => {
    const c = clock()
    const b = createBudget({ limits: { [MODEL]: tiny }, margin: 1, now: c.now })
    for (let i = 0; i < 3; i++) { assert.equal(b.reserve(MODEL, 1).ok, true); c.advance(10_000) }
    const denied: any = b.reserve(MODEL, 1)
    assert.equal(denied.ok, false)
    // the oldest request is 30s old, so it leaves the 60s window in 30s
    assert.equal(denied.retryAfterSec, 30)
    c.advance(30_000)
    assert.equal(b.reserve(MODEL, 1).ok, true)
  })

  it('limits tokens per minute using the estimate', () => {
    const c = clock()
    const b = createBudget({ limits: { [MODEL]: tiny }, margin: 1, now: c.now })
    assert.equal(b.reserve(MODEL, 600).ok, true)
    const denied: any = b.reserve(MODEL, 600)
    assert.equal(denied.ok, false)
    assert.equal(denied.reason, 'tpm')
    assert.equal(denied.retryAfterSec, 60)
  })

  it('never locks out a single request that is larger than the token limit', () => {
    const b = createBudget({ limits: { [MODEL]: tiny }, margin: 1, now: clock().now })
    assert.equal(b.reserve(MODEL, 50_000).ok, true)
  })

  it('applies the daily limits too', () => {
    const c = clock()
    const b = createBudget({ limits: { [MODEL]: { ...tiny, rpm: 100 } }, margin: 1, now: c.now })
    for (let i = 0; i < 5; i++) { assert.equal(b.reserve(MODEL, 1).ok, true); c.advance(120_000) }
    const denied: any = b.reserve(MODEL, 1)
    assert.equal(denied.ok, false)
    assert.equal(denied.reason, 'rpd')
    assert.ok(denied.retryAfterSec > 3600)
  })

  it('replaces the estimate with the real usage once the response is known', () => {
    const c = clock()
    const b = createBudget({ limits: { [MODEL]: tiny }, margin: 1, now: c.now })
    const t: any = b.reserve(MODEL, 900)
    b.settle(t, 100)
    assert.equal(b.reserve(MODEL, 800).ok, true)
  })

  it('tracks each model separately and uses the fallback for unknown models', () => {
    const b = createBudget({ limits: { [MODEL]: tiny }, margin: 1, now: clock().now })
    for (let i = 0; i < 3; i++) b.reserve(MODEL, 1)
    assert.equal(b.reserve(MODEL, 1).ok, false)
    assert.equal(b.reserve('other/model', 1).ok, true)
  })

  it('blocks a model after Groq answers 429, for the Retry-After time', () => {
    const c = clock()
    const b = createBudget({ now: c.now })
    b.penalize(MODEL, 20)
    const denied: any = b.reserve(MODEL, 1)
    assert.equal(denied.ok, false)
    assert.equal(denied.reason, 'blocked')
    assert.equal(denied.retryAfterSec, 20)
    c.advance(20_000)
    assert.equal(b.reserve(MODEL, 1).ok, true)
  })

  it('caps an absurd Retry-After so one reply cannot lock a model for hours', () => {
    const c = clock()
    const b = createBudget({ now: c.now })
    b.penalize(MODEL, 86_400)
    assert.ok((b.reserve(MODEL, 1) as any).retryAfterSec <= 900)
  })

  it('learns from the remaining-tokens headers Groq sends', () => {
    const c = clock()
    const b = createBudget({ now: c.now })
    const headers = new Headers({ 'x-ratelimit-remaining-tokens': '500', 'x-ratelimit-reset-tokens': '8s' })
    b.observe(MODEL, headers)
    const denied: any = b.reserve(MODEL, 3000)
    assert.equal(denied.ok, false)
    assert.equal(denied.reason, 'tpm')
    assert.equal(denied.retryAfterSec, 8)
    c.advance(8_000)
    assert.equal(b.reserve(MODEL, 3000).ok, true)
  })

  it('counts what it sends against the remaining tokens Groq reported', () => {
    const c = clock()
    const b = createBudget({ override: { rpm: 100, tpm: 1_000_000, rpd: 1000, tpd: 10_000_000 }, margin: 1, now: c.now })
    b.observe(MODEL, new Headers({ 'x-ratelimit-remaining-tokens': '5000', 'x-ratelimit-reset-tokens': '30s' }))
    assert.equal(b.reserve(MODEL, 2000).ok, true)
    assert.equal(b.reserve(MODEL, 2000).ok, true)
    const third: any = b.reserve(MODEL, 2000)
    assert.equal(third.ok, false, '6000 tokens must not go out against 5000 remaining')
    assert.equal(third.retryAfterSec, 30)
  })

  it('gives the tokens back when a request is rejected or uses less than estimated', () => {
    const b = createBudget({ override: { rpm: 100, tpm: 1_000_000, rpd: 1000, tpd: 10_000_000 }, margin: 1, now: clock().now })
    b.observe(MODEL, new Headers({ 'x-ratelimit-remaining-tokens': '5000', 'x-ratelimit-reset-tokens': '30s' }))
    const a: any = b.reserve(MODEL, 4000)
    b.settle(a, 0)
    assert.equal(b.reserve(MODEL, 4000).ok, true)
  })

  it('ignores or clamps header values that make no sense', () => {
    const b = createBudget({ now: clock().now })
    b.observe(MODEL, new Headers({ 'x-ratelimit-remaining-tokens': '-50', 'x-ratelimit-reset-tokens': '99999999s' }))
    const denied: any = b.reserve(MODEL, 10)
    assert.equal(denied.ok, false, 'negative remaining counts as none')
    assert.ok(denied.retryAfterSec <= 120, 'the token window is a minute, so a huge reset is clamped')
    const c = createBudget({ now: clock().now })
    c.observe(MODEL, new Headers({ 'x-ratelimit-remaining-tokens': 'lots', 'x-ratelimit-reset-tokens': '8s' }))
    assert.equal(c.reserve(MODEL, 3000).ok, true)
  })

  describe('reservations and Groq\'s own count', () => {
    const big = { rpm: 100, tpm: 1_000_000, rpd: 1000, tpd: 10_000_000 }
    const H = (n: number) => new Headers({ 'x-ratelimit-remaining-tokens': String(n), 'x-ratelimit-reset-tokens': '30s' })
    const mk = (c = clock()) => ({ c, b: createBudget({ override: big, margin: 1, now: c.now }) })

    it('does not credit the estimate back twice once Groq has reported its own count', () => {
      const { b } = mk()
      b.observe(MODEL, H(5000))
      const t: any = b.reserve(MODEL, 2000)
      b.observe(MODEL, H(4000), t) // Groq's figure already excludes the 1000 tokens actually used
      b.settle(t, 1000)
      assert.equal(b.reserve(MODEL, 4500).ok, false, 'Groq has 4000 left')
      assert.equal(b.reserve(MODEL, 4000).ok, true)
    })

    it('does not credit a rejected request on top of the count Groq sent with the 429', () => {
      const { b } = mk()
      b.observe(MODEL, H(5000))
      const t: any = b.reserve(MODEL, 2000)
      b.observe(MODEL, H(5000), t)
      b.settle(t, 0)
      assert.equal(b.reserve(MODEL, 6000).ok, false)
    })

    it('keeps requests that are still in flight subtracted when another response arrives', () => {
      const { b } = mk()
      b.observe(MODEL, H(5000))
      const a: any = b.reserve(MODEL, 2000)
      b.reserve(MODEL, 2000) // still in flight
      b.observe(MODEL, H(3500), a)
      b.settle(a, 1500)
      assert.equal(b.reserve(MODEL, 3000).ok, false, '3500 reported minus 2000 still on its way')
      assert.equal(b.reserve(MODEL, 1500).ok, true)
    })

    it('does not let a request that never finished weigh on the budget forever', () => {
      const { b, c } = mk()
      b.reserve(MODEL, 2000) // the connection dropped, settle() never ran
      c.advance(180_000)
      const t: any = b.reserve(MODEL, 100)
      b.observe(MODEL, H(4000), t)
      assert.equal(b.reserve(MODEL, 3800).ok, true)
    })

    it('does not subtract a request twice when its headers already arrived but it is not settled yet', () => {
      const { b } = mk()
      b.observe(MODEL, H(1000))
      const x: any = b.reserve(MODEL, 300)
      const y: any = b.reserve(MODEL, 300)
      b.observe(MODEL, H(700), x) // Groq counted x; y is still in flight, so 400 remain for us
      b.observe(MODEL, H(400), y) // x is still being read, but Groq already counted it
      assert.equal(b.reserve(MODEL, 400).ok, true, '400 really remain')
    })

    it('releases an in-flight request even when the reported usage is unusable', () => {
      const { b } = mk()
      const a: any = b.reserve(MODEL, 2000)
      b.settle(a, NaN)
      const t: any = b.reserve(MODEL, 100)
      b.observe(MODEL, H(4000), t)
      assert.equal(b.reserve(MODEL, 3800).ok, true)
    })
  })

  it('honours overrides, for accounts on a higher tier', () => {
    const b = createBudget({ override: { rpm: 1000, tpm: 250_000, rpd: 14_400, tpd: 5_000_000 }, margin: 1, now: clock().now })
    for (let i = 0; i < 100; i++) assert.equal(b.reserve(MODEL, 2000).ok, true)
  })
})
