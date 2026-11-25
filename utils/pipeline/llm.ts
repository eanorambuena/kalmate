// LLM pipeline generation (Groq, OpenAI-compatible API). Kept free of Nitro
// globals so it can be tested with a fake fetch.

import { buildNodeCatalog, validatePlan, type Plan } from './plan.ts'
import { estimateTokens, parseResetSeconds, MAX_BLOCK_SEC, type Budget } from './groqBudget.ts'

export const GROQ_API = 'https://api.groq.com/openai/v1/chat/completions'

/**
 * Tried in order; a model Groq reports as gone is skipped. llama-3.3-70b-versatile
 * was retired on 2026-08-16 and these are Groq's suggested replacements.
 */
export const DEFAULT_MODELS = ['openai/gpt-oss-120b', 'qwen/qwen3.6-27b']

const MAX_QUERY = 500
const TIMEOUT_MS = 30_000
/** Tokens we expect the model to produce (the plan plus reasoning), for the pre-flight budget check. */
const COMPLETION_ESTIMATE = 1200
const DEFAULT_RETRY_AFTER_SEC = 10

type FetchLike = (url: string, init: any) => Promise<{ ok: boolean; status: number; headers?: { get(name: string): string | null }; text(): Promise<string>; json(): Promise<any> }>

export interface LLMOptions {
  apiKey: string | undefined
  fetch?: FetchLike
  models?: string[]
  /** Local rate-limit budget, checked before every call so Groq's own limits are not reached. */
  budget?: Budget
}

export type LLMResult = Plan | { error: string; retryAfterSec?: number }

export function buildPrompt(query: string): string {
  return `You are an assistant that generates financial pipelines for a visual node editor. These are the only nodes available, with their exact handle ids and params:
${buildNodeCatalog()}

Each node is identified by its "type". Input nodes provide data, process nodes transform it, output nodes display it.
Each input handle accepts at most one edge. Port types must match: "any" accepts everything; "series", "price", "scalar", "signal" and "symbol" connect to the same kind, and numeric kinds (price, scalar, signal) connect to each other.

The user query may be in Spanish or English. Generate a pipeline for: ${JSON.stringify(query)}

Return ONLY valid JSON without markdown and without explanations, with this structure:
{
  "nodes": [
    { "type": "symbolInput", "data": { "symbol": "AAPL" } },
    { "type": "priceFeed", "data": {} },
    { "type": "chartOutput", "data": {} }
  ],
  "edges": [
    { "source": 0, "target": 1, "sourceHandle": "symbol", "targetHandle": "symbol" },
    { "source": 1, "target": 2, "sourceHandle": "priceSeries", "targetHandle": "mainSeries" }
  ]
}

RULES:
- source and target in edges are indices of the nodes array (0, 1, 2...), and source must differ from target
- sourceHandle must be an output id listed for the source node's type
- targetHandle must be an input id listed for the target node's type (Weighted Average accepts in0, in1, ...)
- Every input handle may appear in at most one edge
- Only use the params listed for each node in its data; use the defaults when unsure
- A symbolInput node connects to a priceFeed (symbol -> symbol); a priceFeed feeds indicators, forecasts and charts through its priceSeries output
- Connect the price series to the chart's mainSeries and indicator outputs to overlayA, overlayB or overlayC
- Do not use nodes that are not listed above`
}

/** The outermost {...} in the reply, tolerating code fences and surrounding prose. */
function extractJson(text: string): unknown {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end <= start) return undefined
  try {
    return JSON.parse(text.slice(start, end + 1))
  } catch {
    return undefined
  }
}

function isModelGone(status: number, body: string): boolean {
  return (status === 404 || status === 400) && /model_not_found|model_decommissioned|does not exist|decommissioned/i.test(body)
}

export async function generateWithLLM(query: string, opts: LLMOptions): Promise<LLMResult> {
  if (!opts.apiKey) return { error: 'GROQ_API_KEY not configured' }
  const q = query?.trim() ?? ''
  if (q.length < 2) return { error: 'Describe the pipeline you want to build, e.g. "AAPL chart with SMA 20" or "BTC-USD candles"' }
  if (q.length > MAX_QUERY) return { error: `Query too long (max ${MAX_QUERY} characters)` }

  const doFetch: FetchLike = opts.fetch ?? (globalThis.fetch as any)
  const models = opts.models?.length ? opts.models : DEFAULT_MODELS
  const prompt = buildPrompt(q)
  const estimate = estimateTokens(prompt) + COMPLETION_ESTIMATE
  let waitSec: number | undefined

  for (const model of models) {
    const ticket = opts.budget?.reserve(model, estimate)
    if (ticket && !ticket.ok) {
      waitSec = Math.min(waitSec ?? Infinity, ticket.retryAfterSec)
      continue
    }
    let res
    try {
      res = await doFetch(GROQ_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${opts.apiKey}` },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: 'You are a financial pipeline generator. Always respond with a single valid JSON object only.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.2,
          // Reasoning models spend tokens before the answer; 512 could leave no room for the JSON.
          max_completion_tokens: 4096,
          response_format: { type: 'json_object' },
        }),
        signal: typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal ? AbortSignal.timeout(TIMEOUT_MS) : undefined,
      })
    } catch (e: any) {
      // The request may have reached Groq before it failed, so keep its estimate counted.
      if (ticket) opts.budget?.settle(ticket, ticket.tokens)
      return { error: e?.name === 'TimeoutError' ? 'The AI service timed out' : 'Could not reach the AI service' }
    }

    if (res.headers) opts.budget?.observe(model, res.headers, ticket)

    if (!res.ok) {
      // A rejected request still counts as a request, but it processed no tokens.
      if (ticket) opts.budget?.settle(ticket, 0)
      const body = await res.text().catch(() => '')
      if (isModelGone(res.status, body)) continue
      if (res.status === 429) {
        const retryAfterSec = Math.min(MAX_BLOCK_SEC, Math.max(1, Math.ceil(parseResetSeconds(res.headers?.get('retry-after')) ?? DEFAULT_RETRY_AFTER_SEC)))
        opts.budget?.penalize(model, retryAfterSec)
        return { error: 'Rate limited. Try again in a moment.', retryAfterSec }
      }
      return { error: `AI service error ${res.status}` }
    }

    const data = await res.json().catch(() => null)
    if (ticket) opts.budget?.settle(ticket, Number(data?.usage?.total_tokens))
    const text: string = data?.choices?.[0]?.message?.content ?? ''
    const plan = extractJson(text)
    if (plan === undefined) return { error: 'AI response contained no JSON' }

    const check = validatePlan(plan)
    if (!check.ok) return { error: `Invalid pipeline from AI: ${check.reason}` }
    return plan as Plan
  }

  if (waitSec !== undefined) {
    return { error: `Rate limited. Try again in about ${waitSec} seconds.`, retryAfterSec: waitSec }
  }
  return { error: 'No configured AI model is available' }
}
