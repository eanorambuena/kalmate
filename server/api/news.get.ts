import { servicesFor, toHttpError } from '../utils/services'

export default defineEventHandler(async (event) => {
  const symbol = getQuery(event).symbol as string | undefined
  try {
    return await servicesFor(event).news(symbol)
  } catch (err) {
    toHttpError(err)
  }
})
