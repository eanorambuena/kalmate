export interface CategoryItem {
  symbol: string
  name: string
  price: number | null
  change: number | null
  changePercent: number | null
}

export interface CategoryData {
  title: string
  items: CategoryItem[]
}

export function getAllMarketSymbols(markets: Record<string, { symbol: string; name: string }[]>): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const entries of Object.values(markets)) {
    for (const entry of entries) {
      if (!seen.has(entry.symbol)) {
        seen.add(entry.symbol)
        result.push(entry.symbol)
      }
    }
  }
  return result
}

export function distributeQuotes(
  quotes: any[],
  markets: Record<string, { symbol: string; name: string }[]>,
): CategoryData[] {
  const quoteMap = new Map<string, any>()
  if (Array.isArray(quotes)) {
    for (const q of quotes) {
      if (q?.symbol) quoteMap.set(q.symbol, q)
    }
  }

  return Object.entries(markets).map(([title, symbols]) => ({
    title,
    items: symbols.map(({ symbol, name }) => {
      const q = quoteMap.get(symbol)
      return {
        symbol,
        name,
        price: q?.regularMarketPrice ?? null,
        change: q?.regularMarketChange ?? null,
        changePercent: q?.regularMarketChangePercent ?? null,
      }
    }),
  }))
}
