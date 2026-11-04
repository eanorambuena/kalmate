import { servicesFor, toHttpError } from '../utils/services'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  try {
    return await servicesFor(event).screener({
      q: (query.q as string) || undefined,
      minPrice: query.minPrice ? Number(query.minPrice) : undefined,
      maxPrice: query.maxPrice ? Number(query.maxPrice) : undefined,
      sortBy: (query.sortBy as string) || undefined,
      sortDir: (query.sortDir as string) || undefined,
    })
  } catch (err) {
    toHttpError(err)
  }
})
