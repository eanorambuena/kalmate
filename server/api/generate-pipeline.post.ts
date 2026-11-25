import { generateWithLLM } from '../../utils/pipeline/llm'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ query?: string }>(event)
  // On Cloudflare, process.env is backed by the request's env bindings.
  const model = process.env.GROQ_MODEL?.trim()
  return generateWithLLM(String(body?.query ?? ''), {
    apiKey: process.env.GROQ_API_KEY,
    models: model ? [model] : undefined,
  })
})
