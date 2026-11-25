// Local rate-limit budget for Groq. We check our own counters before calling
// the API so we stay under Groq's limits instead of discovering them through
// 429s (a rejected request still counts toward the request limit).
//
// See docs/groq-rate-limits.md for the sources behind these numbers.

export interface ModelLimits {
  /** Requests per minute. */
  rpm: number
  /** Tokens per minute (prompt + completion). */
  tpm: number
  /** Requests per day. */
  rpd: number
  /** Tokens per day. */
  tpd: number
}

/**
 * Limits published on https://console.groq.com/docs/rate-limits (checked
 * 2026-11-25). That page is old and Groq's models page lists different numbers
 * for paid plans, so treat these as the free-tier floor: the real figures for
 * an organization are in the Groq console under Settings > Limits, and the
 * budget corrects itself from the rate-limit headers Groq sends.
 */
export const GROQ_LIMITS: Record<string, ModelLimits> = {
  'openai/gpt-oss-120b': { rpm: 30, tpm: 8000, rpd: 1000, tpd: 200_000 },
}

/**
 * Used for models without a documented entry (for example the qwen preview
 * model). An assumption, not a published figure: kept low on purpose.
 */
export const FALLBACK_LIMITS: ModelLimits = { rpm: 30, tpm: 6000, rpd: 1000, tpd: 100_000 }

/** Fraction of each limit we allow ourselves, since our token counts are estimates. */
export const SAFETY_MARGIN = 0.85

/** Longest we will block a model on the strength of a single Retry-After value. */
export const MAX_BLOCK_SEC = 900

/** Groq's token window is one minute, so a longer reset from a header is not credible. */
const MAX_RESET_SEC = 120

const MINUTE_MS = 60_000
const DAY_MS = 86_400_000

/** About four characters per token. Groq has no tokenizer endpoint, so this is deliberately rough. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

/** Parses Groq reset durations such as "7.66s", "1m26.4s", "250ms" or a plain number of seconds. */
export function parseResetSeconds(value: string | null | undefined): number | undefined {
  if (value == null) return undefined
  const v = value.trim()
  const ms = v.match(/^(\d+(?:\.\d+)?)ms$/)
  const finite = (n: number) => (Number.isFinite(n) ? n : undefined)
  if (ms) return finite(Number(ms[1]) / 1000)
  if (/^\d+(?:\.\d+)?$/.test(v)) return finite(Number(v))
  const parts = v.match(/^(?:(\d+(?:\.\d+)?)m)?(?:(\d+(?:\.\d+)?)s)?$/)
  if (!parts || (parts[1] === undefined && parts[2] === undefined)) return undefined
  return finite(Number(parts[1] ?? 0) * 60 + Number(parts[2] ?? 0))
}

/** GROQ_RPM, GROQ_TPM, GROQ_RPD and GROQ_TPD override the limits, for accounts on a higher tier. */
export function limitsFromEnv(env: Record<string, string | undefined>): Partial<ModelLimits> {
  const out: Partial<ModelLimits> = {}
  const read = (name: string, key: keyof ModelLimits) => {
    const n = Number(env[name])
    if (env[name] !== undefined && Number.isFinite(n) && n > 0) out[key] = n
  }
  read('GROQ_RPM', 'rpm')
  read('GROQ_TPM', 'tpm')
  read('GROQ_RPD', 'rpd')
  read('GROQ_TPD', 'tpd')
  return out
}

/** `epoch` identifies which Groq-reported count (if any) was in force when this was reserved. */
interface Ticket { ok: true; model: string; t: number; tokens: number; epoch: number; counted?: boolean }
export type Reservation = Ticket | { ok: false; reason: 'rpm' | 'tpm' | 'rpd' | 'tpd' | 'blocked'; retryAfterSec: number }

interface ModelState {
  events: Array<{ t: number; tokens: number }>
  blockedUntil: number
  known?: { remaining: number; until: number; epoch: number }
  knownEpochs: number
  /** Reserved, not yet settled: Groq's headers may not include these tokens yet. */
  inflight: Set<Ticket>
}

export interface BudgetOptions {
  limits?: Record<string, ModelLimits>
  fallback?: ModelLimits
  override?: Partial<ModelLimits>
  margin?: number
  now?: () => number
}

export function createBudget(options: BudgetOptions = {}) {
  const limits = options.limits ?? GROQ_LIMITS
  const fallback = options.fallback ?? FALLBACK_LIMITS
  const margin = options.margin ?? SAFETY_MARGIN
  const now = options.now ?? Date.now
  const states = new Map<string, ModelState>()

  const stateOf = (model: string): ModelState => {
    let s = states.get(model)
    if (!s) states.set(model, (s = { events: [], blockedUntil: 0, knownEpochs: 0, inflight: new Set() }))
    return s
  }

  const effective = (model: string): ModelLimits => {
    const base = { ...(limits[model] ?? fallback), ...options.override }
    const scale = (n: number) => Math.max(1, Math.floor(n * margin))
    return { rpm: scale(base.rpm), tpm: scale(base.tpm), rpd: scale(base.rpd), tpd: scale(base.tpd) }
  }

  /** Seconds until enough of the window has aged out for `needed` more units to fit. */
  function waitFor(events: Array<{ t: number; tokens: number }>, windowMs: number, t: number, over: number, unit: 'requests' | 'tokens'): number {
    let freed = 0
    for (const e of events) {
      freed += unit === 'requests' ? 1 : e.tokens
      if (freed >= over) return Math.max(1, Math.ceil((e.t + windowMs - t) / 1000))
    }
    return Math.ceil(windowMs / 1000)
  }

  return {
    /** Checks the budget and, if there is room, records the request. */
    reserve(model: string, tokens: number): Reservation {
      const t = now()
      const s = stateOf(model)
      s.events = s.events.filter(e => e.t > t - DAY_MS)
      const lim = effective(model)

      if (t < s.blockedUntil) return { ok: false, reason: 'blocked', retryAfterSec: Math.ceil((s.blockedUntil - t) / 1000) }

      const minute = s.events.filter(e => e.t > t - MINUTE_MS)
      const minuteTokens = minute.reduce((sum, e) => sum + e.tokens, 0)
      const dayTokens = s.events.reduce((sum, e) => sum + e.tokens, 0)

      if (minute.length + 1 > lim.rpm) {
        return { ok: false, reason: 'rpm', retryAfterSec: waitFor(minute, MINUTE_MS, t, minute.length + 1 - lim.rpm, 'requests') }
      }
      // A request bigger than the whole limit would otherwise never be allowed.
      if (minuteTokens > 0 && minuteTokens + tokens > lim.tpm) {
        return { ok: false, reason: 'tpm', retryAfterSec: waitFor(minute, MINUTE_MS, t, minuteTokens + tokens - lim.tpm, 'tokens') }
      }
      if (s.events.length + 1 > lim.rpd) {
        return { ok: false, reason: 'rpd', retryAfterSec: waitFor(s.events, DAY_MS, t, s.events.length + 1 - lim.rpd, 'requests') }
      }
      if (dayTokens > 0 && dayTokens + tokens > lim.tpd) {
        return { ok: false, reason: 'tpd', retryAfterSec: waitFor(s.events, DAY_MS, t, dayTokens + tokens - lim.tpd, 'tokens') }
      }
      if (s.known && t < s.known.until && tokens > s.known.remaining) {
        return { ok: false, reason: 'tpm', retryAfterSec: Math.max(1, Math.ceil((s.known.until - t) / 1000)) }
      }

      const live = s.known && t < s.known.until ? s.known : undefined
      const ticket: Ticket = { ok: true, model, t, tokens, epoch: live?.epoch ?? 0 }
      s.events.push(ticket)
      s.inflight.add(ticket)
      // What we send now is no longer available to the next request in Groq's window.
      if (live) live.remaining -= tokens
      return ticket
    },

    /** Replaces the estimate with the tokens Groq actually reported. */
    settle(ticket: Reservation, actualTokens: number) {
      if (!ticket.ok) return
      const s = states.get(ticket.model)
      s?.inflight.delete(ticket)
      if (!Number.isFinite(actualTokens) || actualTokens < 0) return
      // Only give tokens back to the count they were taken from. A newer count from
      // Groq's headers already reflects what this request really used.
      const known = s?.known
      if (known && ticket.epoch !== 0 && known.epoch === ticket.epoch && now() < known.until) {
        known.remaining += ticket.tokens - actualTokens
      }
      ticket.tokens = actualTokens
    },

    /** Stops using a model for a while, after Groq answered 429 for it. */
    penalize(model: string, retryAfterSec: number) {
      const sec = Math.min(Math.max(retryAfterSec, 1), MAX_BLOCK_SEC)
      stateOf(model).blockedUntil = now() + sec * 1000
    },

    /**
     * Learns how many tokens Groq says are left in the current minute. Pass the
     * ticket of the response the headers came with: other requests still in
     * flight are subtracted, since Groq may not have counted them yet.
     */
    observe(model: string, headers: { get(name: string): string | null }, ticket?: Reservation) {
      const remaining = Number(headers.get('x-ratelimit-remaining-tokens'))
      const resetSec = parseResetSeconds(headers.get('x-ratelimit-reset-tokens'))
      if (headers.get('x-ratelimit-remaining-tokens') === null || !Number.isFinite(remaining) || resetSec === undefined) return
      const s = stateOf(model)
      const t = now()
      let pending = 0
      for (const other of s.inflight) {
        if (t - other.t > MAX_RESET_SEC * 1000) s.inflight.delete(other) // its response never came back
        else if (other !== ticket && !other.counted) pending += other.tokens // counted: Groq's headers already include it
      }
      if (ticket?.ok) ticket.counted = true
      s.known = {
        remaining: Math.max(0, remaining - pending),
        until: t + Math.min(resetSec, MAX_RESET_SEC) * 1000,
        epoch: ++s.knownEpochs,
      }
    },
  }
}

export type Budget = ReturnType<typeof createBudget>
