import { getCached, setCache } from '../../utils/cache'
import { snapshotAt, reduceCompanyFacts, type CompanyFacts } from '../../utils/fundamentals'
import { SEC_CIKS } from '../../utils/secCiks'
import { tickerDb, getStoredTicker, saveTicker } from '../../utils/tickerStore'
import { cachedFetch } from '../../utils/apiCache'

// SEC asks for a descriptive User-Agent. Generic client name, no personal contact.
const SEC_HEADERS = { 'User-Agent': 'Kalmate/1.0 research-client', Accept: 'application/json' }
const WEEK_MS = 7 * 86_400_000

async function cikFor(event: any, ticker: string): Promise<string | null> {
  const known = SEC_CIKS[ticker.toUpperCase()]
  if (known) return known
  const map = await cachedFetch(tickerDb(event), 'sec:tickers', { source: 'sec', ttlMs: WEEK_MS }, async () => {
    const res = await fetch('https://www.sec.gov/files/company_tickers.json', { headers: SEC_HEADERS })
    if (!res.ok) throw createError({ statusCode: 502, statusMessage: `SEC tickers HTTP ${res.status}` })
    const raw = await res.json() as Record<string, { cik_str: number, ticker: string }>
    const out: Record<string, string> = {}
    for (const v of Object.values(raw)) out[v.ticker.toUpperCase()] = String(v.cik_str).padStart(10, '0')
    return out
  })
  return map[ticker.toUpperCase()] ?? null
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const symbol = String(query.symbol || '').trim()
  const asOf = String(query.asOf || new Date().toISOString().slice(0, 10))
  if (!symbol) throw createError({ statusCode: 400, statusMessage: 'symbol parameter required' })
  if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf)) throw createError({ statusCode: 400, statusMessage: 'asOf must be YYYY-MM-DD' })

  try {
    const db = tickerDb(event)
    const memKey = `fundamentals:${symbol.toUpperCase()}`
    let facts = getCached<CompanyFacts>(memKey)
    if (!facts) {
      const stored = await getStoredTicker(db, symbol)
      const cik = stored?.cik ?? await cikFor(event, symbol)
      if (!cik) throw createError({ statusCode: 404, statusMessage: `No SEC filer for ${symbol} (US-listed companies only)` })
      if (!stored) await saveTicker(db, { symbol, cik, source: SEC_CIKS[symbol.toUpperCase()] ? 'sec-map' : 'sec-tickers' })
      facts = await cachedFetch(db, `sec:facts:${cik}`, { source: 'sec', ttlMs: WEEK_MS }, async () => {
        const res = await fetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`, { headers: SEC_HEADERS })
        if (!res.ok) throw createError({ statusCode: 502, statusMessage: `SEC facts HTTP ${res.status}` })
        return reduceCompanyFacts(await res.json() as CompanyFacts)
      })
      setCache(memKey, facts, WEEK_MS)
    }
    return { symbol: symbol.toUpperCase(), ...snapshotAt(facts, asOf) }
  } catch (err: any) {
    if (err?.statusCode) throw err
    throw createError({ statusCode: 500, statusMessage: `fundamentals failed: ${err?.message || 'unknown error'}` })
  }
})
