import { servicesFor, toHttpError } from '../utils/services'

export default defineEventHandler(async (event) => {
  const q = getQuery(event).q as string | undefined
  if (!q) throw createError({ statusCode: 400, statusMessage: 'q parameter required (min 1 char)' })
  try {
    return await servicesFor(event).search(q)
  } catch (err) {
    toHttpError(err)
  }
})
