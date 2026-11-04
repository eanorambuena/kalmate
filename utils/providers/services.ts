// Data services. Routes ask for market data or fundamentals and get the same
// shape whether it came from the cache or from the upstream API.
import { getHistory } from '../yahoo.ts'
import { snapshotAt, reduceCompanyFacts, type CompanyFacts, type FundamentalsSnapshot } from '../fundamentals.ts'
import { SEC_CIKS } from '../secCiks.ts'
import { getStoredTicker, saveTicker, type D1Like } from '../tickerStore.ts'
import { d1Store, memoryStore, type Store } from './store.ts'
import { cached } from './cache.ts'

export class DataError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const WEEK_MS = 7 * 86_400_000
const SEC_HEADERS = { 'User-Agent': 'Kalmate/1.0 research-client', Accept: 'application/json' }

export interface Upstream {
  history: typeof getHistory
  fetch: typeof fetch
}

export interface Services {
  history(symbol: string, range: any, interval: any): Promise<any>
  fundamentals(symbol: string, asOf: string): Promise<FundamentalsSnapshot & { symbol: string }>
}

export function createServices(opts: { db?: D1Like | null, upstream?: Partial<Upstream> } = {}): Services {
  const db = opts.db ?? null
  // Prefer D1 for persistence; fall back to memory so caching still applies per instance.
  const store: Store = db ? d1Store(db) : memoryStore()
  const up: Upstream = { history: getHistory, fetch: globalThis.fetch.bind(globalThis), ...opts.upstream }

  async function cikFor(ticker: string): Promise<string | null> {
    const known = SEC_CIKS[ticker]
    if (known) return known
    const map = await cached(store, 'sec:tickers', { source: 'sec', ttlMs: WEEK_MS }, async () => {
      const res = await up.fetch('https://www.sec.gov/files/company_tickers.json', { headers: SEC_HEADERS })
      if (!res.ok) throw new DataError(502, `SEC tickers HTTP ${res.status}`)
      const raw = await res.json() as Record<string, { cik_str: number, ticker: string }>
      const out: Record<string, string> = {}
      for (const v of Object.values(raw)) out[v.ticker.toUpperCase()] = String(v.cik_str).padStart(10, '0')
      return out
    })
    return map[ticker] ?? null
  }

  return {
    history(symbol, range, interval) {
      const ttlMs = interval === '1d' ? 6 * 3_600_000 : 5 * 60_000
      return cached(store, `yahoo:history:${symbol}:${range}:${interval}`, { source: 'yahoo', ttlMs, maxBytes: 1_800_000 },
        () => up.history(symbol, range, interval))
    },

    async fundamentals(symbol, asOf) {
      const ticker = symbol.toUpperCase()
      const stored = await getStoredTicker(db, ticker)
      const cik = stored?.cik ?? await cikFor(ticker)
      if (!cik) throw new DataError(404, `No SEC filer for ${ticker} (US-listed companies only)`)
      if (!stored) await saveTicker(db, { symbol: ticker, cik, source: SEC_CIKS[ticker] ? 'sec-map' : 'sec-tickers' })
      const facts = await cached(store, `sec:facts:${cik}`, { source: 'sec', ttlMs: WEEK_MS }, async () => {
        const res = await up.fetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`, { headers: SEC_HEADERS })
        if (!res.ok) throw new DataError(502, `SEC facts HTTP ${res.status}`)
        return reduceCompanyFacts(await res.json() as CompanyFacts)
      })
      return { symbol: ticker, ...snapshotAt(facts, asOf) }
    },
  }
}
