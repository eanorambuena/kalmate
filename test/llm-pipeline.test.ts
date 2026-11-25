import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { generateWithLLM, DEFAULT_MODELS } from '../utils/pipeline/llm.ts'
import { createBudget } from '../utils/pipeline/groqBudget.ts'

const PLAN = {
  nodes: [
    { type: 'symbolInput', data: { symbol: 'AAPL' } },
    { type: 'priceFeed', data: {} },
    { type: 'chartOutput', data: {} },
  ],
  edges: [
    { source: 0, target: 1, sourceHandle: 'symbol', targetHandle: 'symbol' },
    { source: 1, target: 2, sourceHandle: 'priceSeries', targetHandle: 'mainSeries' },
  ],
}

type Call = { url: string; body: any; headers: Record<string, string> }

/** Fake fetch: each call consumes the next scripted response. */
function fakeFetch(responses: Array<{ status: number; body: any; headers?: Record<string, string> }>) {
  const calls: Call[] = []
  const fn = async (url: string, init: any) => {
    calls.push({ url, body: JSON.parse(init.body), headers: init.headers })
    const r = responses[Math.min(calls.length - 1, responses.length - 1)]!
    const text = typeof r.body === 'string' ? r.body : JSON.stringify(r.body)
    return { ok: r.status < 300, status: r.status, headers: new Headers(r.headers ?? {}), text: async () => text, json: async () => JSON.parse(text) } as any
  }
  return { fn, calls }
}

const reply = (content: string) => ({ status: 200, body: { choices: [{ message: { content } }] } })
const modelGone = { status: 404, body: { error: { code: 'model_not_found', message: 'The model does not exist' } } }

describe('generateWithLLM', () => {
  it('defaults to a model Groq still serves, not the retired llama-3.3-70b-versatile', () => {
    assert.ok(!DEFAULT_MODELS.includes('llama-3.3-70b-versatile'))
    assert.equal(DEFAULT_MODELS[0], 'openai/gpt-oss-120b')
  })

  it('asks for JSON output with room for reasoning tokens', async () => {
    const f = fakeFetch([reply(JSON.stringify(PLAN))])
    const out = await generateWithLLM('AAPL chart', { apiKey: 'k', fetch: f.fn })
    assert.deepEqual(out, PLAN)
    const body = f.calls[0]!.body
    assert.equal(body.model, 'openai/gpt-oss-120b')
    assert.deepEqual(body.response_format, { type: 'json_object' })
    assert.ok(body.max_completion_tokens >= 2048)
    assert.equal(f.calls[0]!.headers.Authorization, 'Bearer k')
  })

  it('falls back to the next model when one has been retired', async () => {
    const f = fakeFetch([modelGone, reply(JSON.stringify(PLAN))])
    const out = await generateWithLLM('AAPL chart', { apiKey: 'k', fetch: f.fn })
    assert.deepEqual(out, PLAN)
    assert.equal(f.calls.length, 2)
    assert.equal(f.calls[1]!.body.model, DEFAULT_MODELS[1])
  })

  it('honours an explicit model list (GROQ_MODEL)', async () => {
    const f = fakeFetch([reply(JSON.stringify(PLAN))])
    await generateWithLLM('AAPL chart', { apiKey: 'k', fetch: f.fn, models: ['custom/model'] })
    assert.equal(f.calls[0]!.body.model, 'custom/model')
  })

  it('extracts the plan from fenced or chatty replies', async () => {
    const f = fakeFetch([reply('Here you go:\n```json\n' + JSON.stringify(PLAN) + '\n```')])
    assert.deepEqual(await generateWithLLM('AAPL chart', { apiKey: 'k', fetch: f.fn }), PLAN)
  })

  it('rejects a plan that does not match the node definitions', async () => {
    const bad = { nodes: [{ type: 'madeUpNode', data: {} }], edges: [] }
    const f = fakeFetch([reply(JSON.stringify(bad))])
    const out: any = await generateWithLLM('AAPL chart', { apiKey: 'k', fetch: f.fn })
    assert.match(out.error, /Invalid pipeline/)
  })

  it('reports an empty or non-JSON reply instead of throwing', async () => {
    const f = fakeFetch([reply('')])
    const out: any = await generateWithLLM('AAPL chart', { apiKey: 'k', fetch: f.fn })
    assert.match(out.error, /no JSON/)
    const g = fakeFetch([reply('{ "nodes": [ broken')])
    const out2: any = await generateWithLLM('AAPL chart', { apiKey: 'k', fetch: g.fn })
    assert.ok(typeof out2.error === 'string')
  })

  it('does not leak the upstream error body to the client', async () => {
    const f = fakeFetch([{ status: 401, body: { error: { message: 'Invalid API Key gsk_secret' } } }])
    const out: any = await generateWithLLM('AAPL chart', { apiKey: 'k', fetch: f.fn })
    assert.match(out.error, /401/)
    assert.doesNotMatch(out.error, /gsk_secret/)
  })

  it('reports rate limiting in English', async () => {
    const f = fakeFetch([{ status: 429, body: {} }])
    const out: any = await generateWithLLM('AAPL chart', { apiKey: 'k', fetch: f.fn })
    assert.match(out.error, /Rate limited/)
  })

  it('validates the key and query before calling the API', async () => {
    const f = fakeFetch([reply(JSON.stringify(PLAN))])
    assert.match((await generateWithLLM('AAPL', { apiKey: '', fetch: f.fn }) as any).error, /not configured/)
    assert.match((await generateWithLLM(' ', { apiKey: 'k', fetch: f.fn }) as any).error, /Describe/)
    assert.match((await generateWithLLM('x'.repeat(501), { apiKey: 'k', fetch: f.fn }) as any).error, /too long/)
    assert.equal(f.calls.length, 0)
  })

  it('returns English messages only', async () => {
    const f = fakeFetch([reply('')])
    for (const q of ['', 'AAPL']) {
      const out: any = await generateWithLLM(q, { apiKey: 'k', fetch: f.fn })
      assert.doesNotMatch(out.error ?? '', /[áéíóúñ¿]|quieres|grafico/i)
    }
  })
})

describe('rate limits', () => {
  const limited = { status: 429, body: { error: { message: 'Rate limit reached' } } }

  it('tries the next model when one is rate limited, since limits are per model', async () => {
    const f = fakeFetch([limited, reply(JSON.stringify(PLAN))])
    const out = await generateWithLLM('AAPL chart', { apiKey: 'k', fetch: f.fn })
    assert.deepEqual(out, PLAN)
    assert.equal(f.calls.length, 2)
    assert.equal(f.calls[0]!.body.model, DEFAULT_MODELS[0])
    assert.equal(f.calls[1]!.body.model, DEFAULT_MODELS[1])
  })

  it('reports rate limiting when every model is limited', async () => {
    const f = fakeFetch([limited, limited])
    const out: any = await generateWithLLM('AAPL chart', { apiKey: 'k', fetch: f.fn })
    assert.match(out.error, /Rate limited/)
    assert.equal(f.calls.length, DEFAULT_MODELS.length)
  })

  it('reports rate limiting rather than "no model" when a retired model is followed by a limited one', async () => {
    const f = fakeFetch([modelGone, limited])
    const out: any = await generateWithLLM('AAPL chart', { apiKey: 'k', fetch: f.fn })
    assert.match(out.error, /Rate limited/)
  })

  it('does not try another model for errors that would repeat (bad key)', async () => {
    const f = fakeFetch([{ status: 401, body: {} }, reply(JSON.stringify(PLAN))])
    const out: any = await generateWithLLM('AAPL chart', { apiKey: 'k', fetch: f.fn })
    assert.match(out.error, /401/)
    assert.equal(f.calls.length, 1)
  })
})

describe('local budget in front of Groq', () => {
  const M = DEFAULT_MODELS[0]!
  const clock = () => { let t = 1_000_000; return { now: () => t, advance: (ms: number) => { t += ms } } }
  const okWithUsage = (total: number, headers?: Record<string, string>) => ({
    status: 200, body: { choices: [{ message: { content: JSON.stringify(PLAN) } }], usage: { total_tokens: total } }, headers,
  })

  it('does not call Groq when the local budget is spent, and says how long to wait', async () => {
    const budget = createBudget({ override: { rpm: 1, tpm: 100_000, rpd: 1000, tpd: 1_000_000 }, margin: 1, now: clock().now })
    const f = fakeFetch([okWithUsage(500)])
    await generateWithLLM('AAPL chart', { apiKey: 'k', fetch: f.fn, models: [M], budget })
    const out: any = await generateWithLLM('AAPL chart', { apiKey: 'k', fetch: f.fn, models: [M], budget })
    assert.equal(f.calls.length, 1, 'the second request never left the server')
    assert.match(out.error, /Rate limited.*\d+ seconds/)
    assert.ok(out.retryAfterSec >= 1 && out.retryAfterSec <= 60)
  })

  it('moves on to the next model when the first one has no budget left', async () => {
    const budget = createBudget({ limits: { [M]: { rpm: 1, tpm: 100_000, rpd: 1000, tpd: 1_000_000 }, [DEFAULT_MODELS[1]!]: { rpm: 10, tpm: 100_000, rpd: 1000, tpd: 1_000_000 } }, margin: 1, now: clock().now })
    const f = fakeFetch([okWithUsage(500)])
    await generateWithLLM('AAPL chart', { apiKey: 'k', fetch: f.fn, budget })
    const out = await generateWithLLM('AAPL chart', { apiKey: 'k', fetch: f.fn, budget })
    assert.deepEqual(out, PLAN)
    assert.deepEqual(f.calls.map(c => c.body.model), [DEFAULT_MODELS[0], DEFAULT_MODELS[1]])
  })

  it('counts the tokens Groq reports instead of the estimate', async () => {
    const budget = createBudget({ override: { rpm: 100, tpm: 10_000, rpd: 1000, tpd: 1_000_000 }, margin: 1, now: clock().now })
    const f = fakeFetch([okWithUsage(200)])
    for (let i = 0; i < 3; i++) await generateWithLLM('AAPL chart', { apiKey: 'k', fetch: f.fn, models: [M], budget })
    assert.equal(f.calls.length, 3, 'three small requests fit; three estimates would not')
  })

  it('stops sending to a model after Groq answers 429 with Retry-After', async () => {
    const c = clock()
    const budget = createBudget({ now: c.now })
    const f = fakeFetch([{ status: 429, body: {}, headers: { 'retry-after': '20' } }, okWithUsage(500)])
    const first: any = await generateWithLLM('AAPL chart', { apiKey: 'k', fetch: f.fn, models: [M], budget })
    assert.match(first.error, /Rate limited/)
    const second: any = await generateWithLLM('AAPL chart', { apiKey: 'k', fetch: f.fn, models: [M], budget })
    assert.equal(f.calls.length, 1, 'blocked locally, Groq not called again')
    assert.equal(second.retryAfterSec, 20)
    c.advance(20_000)
    assert.deepEqual(await generateWithLLM('AAPL chart', { apiKey: 'k', fetch: f.fn, models: [M], budget }), PLAN)
  })

  it('falls through to the next model on a 429 and remembers the block for the next request', async () => {
    const budget = createBudget({ now: clock().now })
    const f = fakeFetch([{ status: 429, body: {}, headers: { 'retry-after': '20' } }, okWithUsage(500)])
    assert.deepEqual(await generateWithLLM('AAPL chart', { apiKey: 'k', fetch: f.fn, budget }), PLAN)
    assert.deepEqual(f.calls.map(c => c.body.model), [DEFAULT_MODELS[0], DEFAULT_MODELS[1]])
    assert.deepEqual(await generateWithLLM('AAPL chart', { apiKey: 'k', fetch: f.fn, budget }), PLAN)
    assert.deepEqual(f.calls.slice(2).map(c => c.body.model), [DEFAULT_MODELS[1]], 'the limited model is not tried again while blocked')
  })

  it('keeps a hostile or absurd Retry-After finite and bounded', async () => {
    for (const [value, expected] of [['86400', 900], ['9'.repeat(400), 10], ['-5', 10]] as const) {
      const f = fakeFetch([{ status: 429, body: {}, headers: { 'retry-after': value } }])
      const out: any = await generateWithLLM('AAPL chart', { apiKey: 'k', fetch: f.fn, models: [M], budget: createBudget({ now: clock().now }) })
      assert.equal(out.retryAfterSec, expected, value.slice(0, 12))
      assert.ok(Number.isFinite(out.retryAfterSec))
    }
  })

  it('keeps counting a request that timed out, since Groq may still have processed it', async () => {
    const budget = createBudget({ override: { rpm: 1000, tpm: 1_000_000, rpd: 1000, tpd: 10_000 }, margin: 1, now: clock().now })
    let calls = 0
    const timingOut = async () => { calls++; throw Object.assign(new Error('timed out'), { name: 'TimeoutError' }) }
    const results: any[] = []
    for (let i = 0; i < 6; i++) results.push(await generateWithLLM('AAPL chart', { apiKey: 'k', fetch: timingOut as any, models: [M], budget }))
    assert.ok(calls < 6, `the daily token budget should stop the retries, but ${calls} of 6 reached the network`)
    assert.match(results.at(-1).error, /Rate limited/)
  })

  it('uses the remaining-tokens headers to avoid the next 429', async () => {
    const budget = createBudget({ override: { rpm: 100, tpm: 1_000_000, rpd: 1000, tpd: 10_000_000 }, margin: 1, now: clock().now })
    const f = fakeFetch([okWithUsage(500, { 'x-ratelimit-remaining-tokens': '10', 'x-ratelimit-reset-tokens': '30s' })])
    await generateWithLLM('AAPL chart', { apiKey: 'k', fetch: f.fn, models: [M], budget })
    const out: any = await generateWithLLM('AAPL chart', { apiKey: 'k', fetch: f.fn, models: [M], budget })
    assert.equal(f.calls.length, 1)
    assert.equal(out.retryAfterSec, 30)
  })

  it('behaves as before when no budget is given', async () => {
    const f = fakeFetch([okWithUsage(500)])
    for (let i = 0; i < 3; i++) assert.deepEqual(await generateWithLLM('AAPL chart', { apiKey: 'k', fetch: f.fn }), PLAN)
    assert.equal(f.calls.length, 3)
  })
})
