import { createServices, DataError, type Services } from '../../utils/providers/services'
import { tickerDb } from '../../utils/tickerStore'

// One service graph per request; the storage backend is chosen here, not in routes.
export function servicesFor(event: any): Services {
  return createServices({ db: tickerDb(event) })
}

export function toHttpError(err: unknown): never {
  if (err instanceof DataError) throw createError({ statusCode: err.status, statusMessage: err.message })
  const message = err instanceof Error ? err.message : 'unknown error'
  throw createError({ statusCode: 500, statusMessage: message })
}
