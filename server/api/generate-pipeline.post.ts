import { generateWithLLM } from '../../utils/pipeline/llm'
import { isRateLimited } from '../../utils/rateLimit'

// Each call spends LLM quota, so cap how fast one client can trigger it.
// In-memory per isolate: it blunts bursts but is not a global ceiling.
const RATE_LIMIT = 10
const RATE_WINDOW_MS = 60_000

export default defineEventHandler(async (event) => {
  const ip = getRequestHeader(event, 'cf-connecting-ip') || getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  if (isRateLimited(`generate-pipeline:${ip}`, RATE_LIMIT, RATE_WINDOW_MS)) {
    return { error: 'Too many pipeline generations. Wait a minute and try again.' }
  }

  const body = await readBody<{ query?: string }>(event)
  // On Cloudflare, process.env is backed by the request's env bindings.
  const model = process.env.GROQ_MODEL?.trim()
  return generateWithLLM(String(body?.query ?? ''), {
    apiKey: process.env.GROQ_API_KEY,
    models: model ? [model] : undefined,
  })
})
