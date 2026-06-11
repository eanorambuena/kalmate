import { addHolding } from '../../../utils/store'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { symbol, shares, avgPrice, notes } = body

  if (!symbol || shares == null || avgPrice == null) {
    throw createError({ statusCode: 400, statusMessage: 'symbol, shares, and avgPrice required' })
  }

  const holding = {
    id: crypto.randomUUID(),
    symbol: symbol.toUpperCase(),
    shares: Number(shares),
    avgPrice: Number(avgPrice),
    notes: notes || '',
    createdAt: new Date().toISOString(),
  }

  return addHolding(holding, event.context.cloudflare?.env)
})
