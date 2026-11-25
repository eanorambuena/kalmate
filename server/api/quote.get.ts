import { servicesFor, toHttpError } from '../utils/services'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const symbols = (query.symbols || query.symbol) as string | undefined
  if (!symbols) throw createError({ statusCode: 400, statusMessage: 'symbol or symbols parameter required' })
  try {
    return await servicesFor(event).quotes(symbols.split(','))
  } catch (err) {
    toHttpError(err)
  }
})
