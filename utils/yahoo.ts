import type { QuoteData, HistoryData } from './types'

const BASE = 'https://query2.finance.yahoo.com'

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
  Origin: 'https://finance.yahoo.com',
  Referer: 'https://finance.yahoo.com/',
}

const TIMEOUT_MS = 10_000

async function apiFetch(url: string) {
  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(TIMEOUT_MS) })
  if (!res.ok) throw new Error(`Yahoo API ${res.status}: ${res.statusText}`)
  return res.json()
}

export async function getQuote(symbol: string): Promise<QuoteData> {
  const data = await apiFetch(`${BASE}/v8/finance/chart/${symbol}?range=1d&interval=1d`)
  const result = data.chart?.result?.[0]
  const meta = result?.meta
  if (!meta) throw new Error(`No quote data for ${symbol}`)

  const quote = result.indicators?.quote?.[0]
  return {
    symbol: meta.symbol,
    shortName: meta.symbol,
    longName: meta.longName ?? meta.symbol,
    regularMarketPrice: meta.regularMarketPrice ?? meta.previousClose ?? 0,
    regularMarketChange: meta.chartPreviousClose ? (meta.regularMarketPrice ?? 0) - meta.chartPreviousClose : 0,
    regularMarketChangePercent: meta.chartPreviousClose ? (((meta.regularMarketPrice ?? 0) - meta.chartPreviousClose) / meta.chartPreviousClose) * 100 : 0,
    regularMarketPreviousClose: meta.chartPreviousClose ?? 0,
    regularMarketOpen: quote?.open?.[quote.open.length - 1] ?? 0,
    regularMarketDayHigh: quote?.high?.[quote.high.length - 1] ?? 0,
    regularMarketDayLow: quote?.low?.[quote.low.length - 1] ?? 0,
    regularMarketVolume: quote?.volume?.[quote.volume.length - 1] ?? 0,
    marketCap: meta.marketCap ?? 0,
    fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh ?? 0,
    fiftyTwoWeekLow: meta.fiftyTwoWeekLow ?? 0,
    currency: meta.currency ?? 'USD',
    exchangeName: meta.exchangeName ?? '',
    quoteType: meta.instrumentType ?? 'EQUITY',
  }
}

export async function getQuotes(symbols: string[]): Promise<QuoteData[]> {
  return Promise.all(symbols.map(s => getQuote(s).catch(() => null))).then(r => r.filter(Boolean))
}

function getPeriod1(range: string): Date {
  const now = new Date()
  const ms = (n: number) => n * 24 * 60 * 60 * 1000
  switch (range) {
    case '1d': return new Date(now.getTime() - ms(1))
    case '5d': return new Date(now.getTime() - ms(5))
    case '1mo': return new Date(now.getTime() - ms(30))
    case '3mo': return new Date(now.getTime() - ms(90))
    case '6mo': return new Date(now.getTime() - ms(180))
    case '1y': return new Date(now.getTime() - ms(365))
    case '5y': return new Date(now.getTime() - ms(1825))
    default: return new Date(now.getTime() - ms(30))
  }
}

export async function getHistory(
  symbol: string,
  range: '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '5y' = '1mo',
  interval: '1m' | '5m' | '15m' | '1h' | '1d' = '1d',
): Promise<HistoryData[]> {
  const period1 = getPeriod1(range)
  const url = `${BASE}/v8/finance/chart/${symbol}?period1=${Math.floor(period1.getTime() / 1000)}&period2=${Math.floor(Date.now() / 1000)}&interval=${interval}`
  const data = await apiFetch(url)
  const result = data.chart?.result?.[0]
  if (!result) return []
  const timestamps: number[] = result.timestamp ?? []
  const quote = result.indicators?.quote?.[0]
  if (!quote) return []
  return timestamps.map((t, i) => ({
    timestamp: t,
    open: quote.open?.[i] ?? 0,
    high: quote.high?.[i] ?? 0,
    low: quote.low?.[i] ?? 0,
    close: quote.close?.[i] ?? 0,
    volume: quote.volume?.[i] ?? 0,
  })).filter(h => h.close > 0)
}

export async function searchTickers(query: string) {
  const data = await apiFetch(`${BASE}/v1/finance/search?q=${encodeURIComponent(query)}`)
  return data.quotes?.slice(0, 10) ?? []
}

export async function getNews(symbol?: string) {
  const query = symbol || 'stock market'
  const data = await apiFetch(`${BASE}/v1/finance/search?q=${encodeURIComponent(query)}`)
  return data.news?.slice(0, 10) ?? []
}
