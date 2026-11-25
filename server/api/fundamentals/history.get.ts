import { servicesFor, toHttpError } from '../../utils/services'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const symbol = String(query.symbol || '').trim()
  if (!symbol) throw createError({ statusCode: 400, statusMessage: 'symbol parameter required' })
  try {
    return await servicesFor(event).fundamentalsHistory(symbol)
  } catch (err) {
    toHttpError(err)
  }
})
