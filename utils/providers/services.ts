// Data services. Routes ask for market data and get the same shape whether it
// came from a cache or from the upstream API.
import * as yahoo from '../yahoo.ts'
import { snapshotAt, reduceCompanyFacts, quarterEnds, type CompanyFacts, type FundamentalsSnapshot, type StockSplit } from '../fundamentals.ts'
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

const MIN = 60_000
const WEEK_MS = 7 * 86_400_000
const SEC_HEADERS = { 'User-Agent': 'Kalmate/1.0 research-client', Accept: 'application/json' }
// One memory store per instance, shared by all requests. Used directly for
// short-lived data, and as the fallback when no D1 binding exists.
const sharedMemory = memoryStore()
// Entries shorter than this stay in memory: they change too often to be worth D1 writes.
const SHORT_TTL_MS = 5 * MIN

export interface Upstream {
  history: typeof yahoo.getHistory
  quote: typeof yahoo.getQuote
  quotes: typeof yahoo.getQuotes
  search: typeof yahoo.searchTickers
  news: typeof yahoo.getNews
  splits: typeof yahoo.getSplits
  fetch: typeof fetch
}

export interface Services {
  history(symbol: string, range: string, interval: string): Promise<any>
  quotes(symbols: string[]): Promise<any>
  search(query: string): Promise<any>
  news(symbol?: string): Promise<any>
  screener(params: { q?: string, minPrice?: number, maxPrice?: number, sortBy?: string, sortDir?: string }): Promise<any[]>
  fundamentals(symbol: string, asOf: string): Promise<FundamentalsSnapshot & { symbol: string }>
  fundamentalsHistory(symbol: string): Promise<{
    symbol: string
    current: FundamentalsSnapshot
    points: { asOf: string; eps: number | null; bookValuePerShare: number | null; freeCashFlowPerShare: number | null }[]
  }>
}

const defaultUpstream: Upstream = {
  history: yahoo.getHistory,
  quote: yahoo.getQuote,
  quotes: yahoo.getQuotes,
  search: yahoo.searchTickers,
  news: yahoo.getNews,
  splits: yahoo.getSplits,
  fetch: (...args) => globalThis.fetch(...args),
}

export function createServices(opts: { db?: D1Like | null, upstream?: Partial<Upstream> } = {}): Services {
  const db = opts.db ?? null
  const durable: Store = db ? d1Store(db) : sharedMemory
  const up: Upstream = { ...defaultUpstream, ...opts.upstream }
  const storeFor = (ttlMs: number): Store => (ttlMs < SHORT_TTL_MS ? sharedMemory : durable)

  /** Splits are optional: when they cannot be loaded, values are left unadjusted. */
  async function splitsFor(ticker: string): Promise<StockSplit[]> {
    try {
      return await cached(durable, `yahoo:splits:${ticker}`, { source: 'yahoo', ttlMs: WEEK_MS }, () => up.splits(ticker))
    } catch {
      return []
    }
  }

  async function cikFor(ticker: string): Promise<string | null> {
    const known = SEC_CIKS[ticker]
    if (known) return known
    const map = await cached(durable, 'sec:tickers', { source: 'sec', ttlMs: WEEK_MS }, async () => {
      const res = await up.fetch('https://www.sec.gov/files/company_tickers.json', { headers: SEC_HEADERS })
      if (!res.ok) throw new DataError(502, `SEC tickers HTTP ${res.status}`)
      const raw = await res.json() as Record<string, { cik_str: number, ticker: string }>
      const out: Record<string, string> = {}
      for (const v of Object.values(raw)) out[v.ticker.toUpperCase()] = String(v.cik_str).padStart(10, '0')
      return out
    })
    return map[ticker] ?? null
  }

  /** Resolves the ticker to its SEC CIK and loads its reduced company facts (cached for a week). */
  async function loadFacts(symbol: string): Promise<{ ticker: string, facts: CompanyFacts }> {
    const ticker = symbol.toUpperCase()
    const stored = await getStoredTicker(db, ticker)
    const cik = stored?.cik ?? await cikFor(ticker)
    if (!cik) throw new DataError(404, `No SEC filer for ${ticker} (US-listed companies only)`)
    if (!stored) await saveTicker(db, { symbol: ticker, cik, source: SEC_CIKS[ticker] ? 'sec-map' : 'sec-tickers' })
    const facts = await cached(durable, `sec:facts:${cik}`, { source: 'sec', ttlMs: WEEK_MS }, async () => {
      const res = await up.fetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`, { headers: SEC_HEADERS })
      if (!res.ok) throw new DataError(502, `SEC facts HTTP ${res.status}`)
      return reduceCompanyFacts(await res.json() as CompanyFacts)
    })
    return { ticker, facts }
  }

  const self: Services = {
    history(symbol, range, interval) {
      const ttlMs = interval === '1d' ? 6 * 60 * MIN : 5 * MIN
      return cached(storeFor(ttlMs), `yahoo:history:${symbol}:${range}:${interval}`, { source: 'yahoo', ttlMs, maxBytes: 1_800_000 },
        () => up.history(symbol, range as any, interval as any))
    },

    async quotes(symbols) {
      const list = symbols.map(s => s.trim()).filter(Boolean).sort()
      const key = `yahoo:quotes:${list.join(',')}`
      return cached(storeFor(MIN), key, { source: 'yahoo', ttlMs: MIN },
        () => list.length === 1 ? up.quote(list[0]).then(q => q) : up.quotes(list))
    },

    search(query) {
      return cached(storeFor(10 * MIN), `yahoo:search:${query}`, { source: 'yahoo', ttlMs: 10 * MIN }, () => up.search(query))
    },

    news(symbol) {
      return cached(storeFor(5 * MIN), `yahoo:news:${symbol || 'all'}`, { source: 'yahoo', ttlMs: 5 * MIN }, () => up.news(symbol))
    },

    async screener(params) {
      const { q = 'stock market', minPrice, maxPrice, sortBy = 'change', sortDir = 'desc' } = params
      const results = await self.search(q)
      const symbols = results
        .filter((r: any) => r.quoteType === 'EQUITY')
        .slice(0, 30)
        .map((r: any) => r.symbol)
      if (symbols.length === 0) return []
      const quotes = await self.quotes(symbols)
      const filtered = (quotes as any[]).filter(item => {
        if (minPrice !== undefined && (item.regularMarketPrice ?? 0) < minPrice) return false
        if (maxPrice !== undefined && (item.regularMarketPrice ?? 0) > maxPrice) return false
        return true
      })
      filtered.sort((a: any, b: any) => {
        const aVal = a[sortBy] ?? 0
        const bVal = b[sortBy] ?? 0
        return sortDir === 'desc' ? bVal - aVal : aVal - bVal
      })
      return filtered.slice(0, 30)
    },

    async fundamentals(symbol, asOf) {
      const { ticker, facts } = await loadFacts(symbol)
      const splits = await splitsFor(ticker)
      return { symbol: ticker, ...snapshotAt(facts, asOf, splits) }
    },

    async fundamentalsHistory(symbol) {
      const { ticker, facts } = await loadFacts(symbol)
      const splits = await splitsFor(ticker)
      const today = new Date().toISOString().slice(0, 10)
      const points = quarterEnds(24, today).map(asOf => {
        const s = snapshotAt(facts, asOf, splits)
        return { asOf, eps: s.eps, bookValuePerShare: s.bookValuePerShare, freeCashFlowPerShare: s.freeCashFlowPerShare }
      })
      return { symbol: ticker, current: snapshotAt(facts, today, splits), points }
    },
  }
  return self
}
