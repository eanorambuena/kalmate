# Groq rate limits and our local budget

The AI pipeline generator (`/api/generate-pipeline`) calls Groq. Groq limits how
much each organization can use per model, and a request it rejects with a 429
still counts toward the request limit. So we count first and only call Groq when
there is room (`utils/pipeline/groqBudget.ts`), instead of finding the limit
through errors.

## The limits

Four limits apply to each model: requests per minute (RPM), tokens per minute
(TPM), requests per day (RPD) and tokens per day (TPD). Tokens are prompt plus
completion.

Published for the default model, `openai/gpt-oss-120b`
([Groq rate limits](https://console.groq.com/docs/rate-limits), checked 2026-11-25):

| Model | RPM | TPM | RPD | TPD |
|---|---|---|---|---|
| `openai/gpt-oss-120b` | 30 | 8,000 | 1,000 | 200,000 |

Caveats, so nobody treats this table as exact:

- That page is old, and Groq's [models page](https://console.groq.com/docs/models)
  lists higher numbers for paid plans (250K TPM, 1K RPM for this model).
- The real values for our organization are in the Groq console, under
  Settings > Limits. Use `GROQ_RPM`, `GROQ_TPM`, `GROQ_RPD` and `GROQ_TPD` to
  override the table if the account is on a higher tier.
- The fallback model (`qwen/qwen3.6-27b`, a preview) has no published entry. It
  uses an assumed conservative set in `FALLBACK_LIMITS`.

## What the prompt costs

The prompt lists every node, so it is large: about 2,300 tokens (roughly four
characters per token). With 8,000 TPM and a completion of around a thousand
tokens, one server instance can generate roughly **two pipelines per minute**
on the free tier. Tokens, not requests, are the limit that binds. A shorter
prompt is the cheapest way to raise that.

## How the budget works

- Before each call, `reserve()` checks the minute and day windows for that model
  against 85% of each limit (`SAFETY_MARGIN`), because our token counts are
  estimates. If there is no room, Groq is not called: the next model is tried,
  and if none has room the response is `Rate limited. Try again in about N
  seconds.`, with `retryAfterSec` in the body and a `Retry-After` header.
- After the response, the estimate is replaced by the real `usage.total_tokens`.
  A rejected request keeps its request count but no tokens.
- Groq's `x-ratelimit-remaining-tokens` and `x-ratelimit-reset-tokens` headers
  correct the picture, so the budget tracks the real account even if the table
  is wrong.
- A 429 from Groq blocks that model for its `Retry-After` time (at most 15
  minutes).
- A single request larger than the token limit is still allowed when the window
  is empty, so a misconfigured limit cannot lock the feature out.

## Limitation

The budget lives in memory in each Cloudflare isolate. Several isolates each
keep their own count, so under heavy traffic they can together exceed Groq's
limit; the 429 handling and the headers then catch the difference. A shared
counter (KV or a Durable Object) would make it exact.

Sources: [Groq rate limits](https://console.groq.com/docs/rate-limits),
[Groq models](https://console.groq.com/docs/models),
[Groq deprecations](https://console.groq.com/docs/deprecations).
