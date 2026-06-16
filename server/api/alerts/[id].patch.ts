import { updateAlert } from '../../../utils/store'

export default defineEventHandler(async (event) => {
  const { id } = event.context.params as { id: string }
  const body = await readBody(event)

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'id parameter required' })
  }

  const { type, targetPrice, triggered } = body
  const update: any = {}
  if (type) update.type = type
  if (targetPrice != null) update.targetPrice = Number(targetPrice)
  if (triggered != null) update.triggered = triggered

  await updateAlert(id, update, event.context.cloudflare?.env)
  return { success: true }
})
