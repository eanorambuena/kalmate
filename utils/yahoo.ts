import YahooFinance from 'yahoo-finance2'
import type { QuoteData, HistoryData } from './types'

const yahoo = new YahooFinance()

export async function getQuote(symbol: string): Promise<QuoteData> {
  const result = await yahoo.quote(symbol)
  return {
    symbol: result.symbol,
    shortName: result.shortName ?? result.symbol,
    longName: result.longName,
    regularMarketPrice: result.regularMarketPrice ?? 0,
    regularMarketChange: result.regularMarketChange ?? 0,
    regularMarketChangePercent: result.regularMarketChangePercent ?? 0,
    regularMarketPreviousClose: result.regularMarketPreviousClose ?? 0,
    regularMarketOpen: result.regularMarketOpen,
    regularMarketDayHigh: result.regularMarketDayHigh,
    regularMarketDayLow: result.regularMarketDayLow,
    regularMarketVolume: result.regularMarketVolume,
    marketCap: result.marketCap,
    fiftyTwoWeekHigh: result.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: result.fiftyTwoWeekLow,
    currency: result.currency,
    exchangeName: result.exchangeName,
    quoteType: result.quoteType,
  }
}

export async function getQuotes(symbols: string[]): Promise<QuoteData[]> {
  const results = await yahoo.quote(symbols)
  return results.map((r: any) => ({
    symbol: r.symbol,
    shortName: r.shortName ?? r.symbol,
    longName: r.longName,
    regularMarketPrice: r.regularMarketPrice ?? 0,
    regularMarketChange: r.regularMarketChange ?? 0,
    regularMarketChangePercent: r.regularMarketChangePercent ?? 0,
    regularMarketPreviousClose: r.regularMarketPreviousClose ?? 0,
    regularMarketOpen: r.regularMarketOpen,
    regularMarketDayHigh: r.regularMarketDayHigh,
    regularMarketDayLow: r.regularMarketDayLow,
    regularMarketVolume: r.regularMarketVolume,
    marketCap: r.marketCap,
    fiftyTwoWeekHigh: r.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: r.fiftyTwoWeekLow,
    currency: r.currency,
    exchangeName: r.exchangeName,
    quoteType: r.quoteType,
  }))
}

export async function getHistory(
  symbol: string,
  range: '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '5y' = '1mo',
  interval: '1m' | '5m' | '15m' | '1h' | '1d' = '1d',
): Promise<HistoryData[]> {
  const result = await yahoo.chart(symbol, {
    period1: getPeriod1(range),
    interval,
  })
  return (result?.quotes ?? []).map((q: any) => ({
    timestamp: Math.floor(new Date(q.date).getTime() / 1000),
    open: q.open ?? 0,
    high: q.high ?? 0,
    low: q.low ?? 0,
    close: q.close ?? 0,
    volume: q.volume ?? 0,
  }))
}

export async function searchTickers(query: string) {
  const results = await yahoo.search(query)
  return results.quotes?.slice(0, 10) ?? []
}

export async function getNews(symbol?: string) {
  const query = symbol || 'stock market'
  const results = await yahoo.search(query)
  return results.news?.slice(0, 10) ?? []
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
