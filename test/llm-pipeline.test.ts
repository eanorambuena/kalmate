import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { generateWithLLM, DEFAULT_MODELS, PROMPT_EXAMPLES, buildPrompt } from '../utils/pipeline/llm.ts'
import { validatePlan } from '../utils/pipeline/plan.ts'

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
function fakeFetch(responses: Array<{ status: number; body: any }>) {
  const calls: Call[] = []
  const fn = async (url: string, init: any) => {
    calls.push({ url, body: JSON.parse(init.body), headers: init.headers })
    const r = responses[Math.min(calls.length - 1, responses.length - 1)]!
    const text = typeof r.body === 'string' ? r.body : JSON.stringify(r.body)
    return { ok: r.status < 300, status: r.status, text: async () => text, json: async () => JSON.parse(text) } as any
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

describe('prompt examples', () => {
  it('ship at least a chart, an overlay and a forecast example', () => {
    assert.ok(PROMPT_EXAMPLES.length >= 3)
    const types = PROMPT_EXAMPLES.flatMap(e => e.plan.nodes.map(n => n.type))
    for (const t of ['chartOutput', 'smaIndicator', 'forecastNode']) assert.ok(types.includes(t), t)
  })

  it('every example is a plan the validator accepts, so the model never learns a broken pattern', () => {
    for (const e of PROMPT_EXAMPLES) {
      const check = validatePlan(e.plan)
      assert.ok(check.ok, `${e.query}: ${(check as any).reason}`)
    }
  })

  it('are embedded in the prompt with their query', () => {
    const prompt = buildPrompt('AAPL chart')
    for (const e of PROMPT_EXAMPLES) {
      assert.ok(prompt.includes(JSON.stringify(e.query)))
      assert.ok(prompt.includes(JSON.stringify(e.plan)))
    }
  })

  it('give no buy/sell advice', () => {
    assert.doesNotMatch(JSON.stringify(PROMPT_EXAMPLES), /\b(buy|sell|recommend)/i)
  })
})
