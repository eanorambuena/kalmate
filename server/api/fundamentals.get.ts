import { getCached, setCache } from '../../utils/cache'
import { snapshotAt, type CompanyFacts } from '../../utils/fundamentals'
import { SEC_CIKS } from '../../utils/secCiks'
import { tickerDb, getStoredTicker, saveTicker } from '../../utils/tickerStore'

// SEC asks for a descriptive User-Agent. Generic client name, no personal contact.
const SEC_HEADERS = { 'User-Agent': 'Kalmate/1.0 research-client', Accept: 'application/json' }
const DAY_MS = 86_400_000

async function cikFor(ticker: string): Promise<string | null> {
  const known = SEC_CIKS[ticker.toUpperCase()]
  if (known) return known
  const cacheKey = 'sec:tickers'
  let map = getCached<Record<string, string>>(cacheKey)
  if (!map) {
    const res = await fetch('https://www.sec.gov/files/company_tickers.json', { headers: SEC_HEADERS })
    if (!res.ok) throw createError({ statusCode: 502, statusMessage: `SEC tickers HTTP ${res.status}` })
    const raw = await res.json() as Record<string, { cik_str: number, ticker: string }>
    map = {}
    for (const v of Object.values(raw)) map[v.ticker.toUpperCase()] = String(v.cik_str).padStart(10, '0')
    setCache(cacheKey, map, DAY_MS)
  }
  return map[ticker.toUpperCase()] ?? null
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const symbol = String(query.symbol || '').trim()
  const asOf = String(query.asOf || new Date().toISOString().slice(0, 10))
  if (!symbol) throw createError({ statusCode: 400, statusMessage: 'symbol parameter required' })
  if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf)) throw createError({ statusCode: 400, statusMessage: 'asOf must be YYYY-MM-DD' })

  try {
    const cacheKey = `fundamentals:${symbol.toUpperCase()}`
    let facts = getCached<CompanyFacts>(cacheKey)
    if (!facts) {
      const db = tickerDb(event)
      const stored = await getStoredTicker(db, symbol)
      const cik = stored?.cik ?? await cikFor(symbol)
      if (!cik) throw createError({ statusCode: 404, statusMessage: `No SEC filer for ${symbol} (US-listed companies only)` })
      if (!stored) await saveTicker(db, { symbol, cik, source: SEC_CIKS[symbol.toUpperCase()] ? 'sec-map' : 'sec-tickers' })
      const res = await fetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`, { headers: SEC_HEADERS })
      if (!res.ok) throw createError({ statusCode: 502, statusMessage: `SEC facts HTTP ${res.status}` })
      facts = await res.json() as CompanyFacts
      setCache(cacheKey, facts, DAY_MS)
    }
    return { symbol: symbol.toUpperCase(), ...snapshotAt(facts, asOf) }
  } catch (err: any) {
    if (err?.statusCode) throw err
    throw createError({ statusCode: 500, statusMessage: `fundamentals failed: ${err?.message || 'unknown error'}` })
  }
})
