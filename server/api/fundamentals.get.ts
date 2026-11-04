import { getCached, setCache } from '../../utils/cache'
import { snapshotAt, type CompanyFacts } from '../../utils/fundamentals'

// SEC asks for a descriptive User-Agent. Generic client name, no personal contact.
const SEC_HEADERS = { 'User-Agent': 'Kalmate/1.0 research-client', Accept: 'application/json' }
const DAY_MS = 86_400_000

async function cikFor(ticker: string): Promise<string | null> {
  const cacheKey = 'sec:tickers'
  let map = getCached<Record<string, string>>(cacheKey)
  if (!map) {
    const res = await fetch('https://www.sec.gov/files/company_tickers.json', { headers: SEC_HEADERS })
    if (!res.ok) throw new Error(`SEC tickers HTTP ${res.status}`)
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

  const cacheKey = `fundamentals:${symbol}`
  let facts = getCached<CompanyFacts>(cacheKey)
  if (!facts) {
    const cik = await cikFor(symbol)
    if (!cik) throw createError({ statusCode: 404, statusMessage: `No SEC filer for ${symbol} (US-listed companies only)` })
    const res = await fetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`, { headers: SEC_HEADERS })
    if (!res.ok) throw createError({ statusCode: 502, statusMessage: `SEC facts HTTP ${res.status}` })
    facts = await res.json() as CompanyFacts
    setCache(cacheKey, facts, DAY_MS)
  }
  return { symbol: symbol.toUpperCase(), ...snapshotAt(facts, asOf) }
})
