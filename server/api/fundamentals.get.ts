import { servicesFor, toHttpError } from '../utils/services'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const symbol = String(query.symbol || '').trim()
  const asOf = String(query.asOf || new Date().toISOString().slice(0, 10))
  if (!symbol) throw createError({ statusCode: 400, statusMessage: 'symbol parameter required' })
  if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf)) throw createError({ statusCode: 400, statusMessage: 'asOf must be YYYY-MM-DD' })
  try {
    return await servicesFor(event).fundamentals(symbol, asOf)
  } catch (err) {
    toHttpError(err)
  }
})
