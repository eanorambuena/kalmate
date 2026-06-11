import { getPortfolio } from '../../../utils/store'

export default defineEventHandler(async (event) => {
  return getPortfolio(event.context.cloudflare?.env)
})
