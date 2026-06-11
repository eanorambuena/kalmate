import { addAlert } from '../../../utils/store'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { symbol, type, targetPrice } = body

  if (!symbol || !type || targetPrice == null) {
    throw createError({ statusCode: 400, statusMessage: 'symbol, type, and targetPrice required' })
  }
  if (type !== 'above' && type !== 'below') {
    throw createError({ statusCode: 400, statusMessage: 'type must be "above" or "below"' })
  }

  const alert = {
    id: crypto.randomUUID(),
    symbol: symbol.toUpperCase(),
    type: type as 'above' | 'below',
    targetPrice: Number(targetPrice),
    triggered: false,
    createdAt: new Date().toISOString(),
  }

  return addAlert(alert, event.context.cloudflare?.env)
})
