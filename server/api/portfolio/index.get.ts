import { getPortfolio } from '../../../utils/store'

export default defineEventHandler(() => {
  return getPortfolio()
})
