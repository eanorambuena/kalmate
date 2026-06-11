import { getNews, searchTickers, getQuotes } from '../../utils/yahoo'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const q = (query.q as string) || 'stock market'
  const minPrice = query.minPrice ? Number(query.minPrice) : undefined
  const maxPrice = query.maxPrice ? Number(query.maxPrice) : undefined
  const sortBy = (query.sortBy as string) || 'change'
  const sortDir = (query.sortDir as string) || 'desc'

  try {
    const searchResults = await searchTickers(q)
    const symbols = searchResults
      .filter((r: any) => r.quoteType === 'EQUITY')
      .slice(0, 30)
      .map((r: any) => r.symbol)

    if (symbols.length === 0) return []

    const quotes = await getQuotes(symbols)

    let filtered = quotes.filter(q => {
      if (minPrice !== undefined && (q.regularMarketPrice ?? 0) < minPrice) return false
      if (maxPrice !== undefined && (q.regularMarketPrice ?? 0) > maxPrice) return false
      return true
    })

    filtered.sort((a: any, b: any) => {
      const aVal = a[sortBy] ?? 0
      const bVal = b[sortBy] ?? 0
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal
    })

    return filtered.slice(0, 30)
  } catch (error: any) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
