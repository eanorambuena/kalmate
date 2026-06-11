import { getAlerts } from '../../../utils/store'

export default defineEventHandler(() => {
  return getAlerts()
})
