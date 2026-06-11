import { getAlerts } from '../../../utils/store'

export default defineEventHandler(async (event) => {
  return getAlerts(event.context.cloudflare?.env)
})
