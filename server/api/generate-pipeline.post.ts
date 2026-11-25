import { generateWithLLM } from '../../utils/pipeline/llm'
import { createBudget, limitsFromEnv, type Budget } from '../../utils/pipeline/groqBudget'

// One budget per server instance, created on the first request because on
// Cloudflare process.env is only backed by the env bindings during a request.
// It is per instance, not global: see docs/groq-rate-limits.md.
let budget: Budget | undefined

export default defineEventHandler(async (event) => {
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
