import { servicesFor, toHttpError } from '../utils/services'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const symbol = query.symbol as string | undefined
  const range = (query.range as string) || '1mo'
  const interval = (query.interval as string) || '1d'
  if (!symbol) throw createError({ statusCode: 400, statusMessage: 'symbol parameter required' })
  try {
    return await servicesFor(event).history(symbol, range, interval)
  } catch (err) {
    toHttpError(err)
  }
})
