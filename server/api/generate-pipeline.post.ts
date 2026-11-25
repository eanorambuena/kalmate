import { generateWithLLM } from '../../utils/pipeline/llm'
import { createBudget, limitsFromEnv, type Budget } from '../../utils/pipeline/groqBudget'
import { isRateLimited } from '../../utils/rateLimit'

// Two guards, checked in this order:
// 1. A per-client cap, so one caller cannot use up the shared Groq budget.
// 2. The shared Groq budget (docs/groq-rate-limits.md), so Groq's own limits are not reached.
// Both live in memory per server instance, so they blunt bursts but are not global ceilings.
const CLIENT_LIMIT = 10
const CLIENT_WINDOW_MS = 60_000

// Created on the first request because on Cloudflare process.env is only backed
// by the env bindings during a request.
let budget: Budget | undefined

export default defineEventHandler(async (event) => {
  const ip = getRequestHeader(event, 'cf-connecting-ip') || getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  if (isRateLimited(`generate-pipeline:${ip}`, CLIENT_LIMIT, CLIENT_WINDOW_MS)) {
    setResponseHeader(event, 'Retry-After', CLIENT_WINDOW_MS / 1000)
    return { error: 'Too many pipeline generations. Wait a minute and try again.', retryAfterSec: CLIENT_WINDOW_MS / 1000 }
  }

  budget ??= createBudget({ override: limitsFromEnv(process.env) })

  const body = await readBody<{ query?: string }>(event)
  const model = process.env.GROQ_MODEL?.trim()
  const result = await generateWithLLM(String(body?.query ?? ''), {
    apiKey: process.env.GROQ_API_KEY,
    models: model ? [model] : undefined,
    budget,
  })
  if ('error' in result && result.retryAfterSec) setResponseHeader(event, 'Retry-After', result.retryAfterSec)
  return result
})
