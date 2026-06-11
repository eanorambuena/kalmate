import { removeAlert } from '../../../utils/store'

export default defineEventHandler(async (event) => {
  const { id } = event.context.params as { id: string }
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'id parameter required' })
  }
  removeAlert(id)
  return { success: true }
})
