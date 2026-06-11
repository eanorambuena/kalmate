import { updateHolding } from '../../../utils/store'

export default defineEventHandler(async (event) => {
  const { id } = event.context.params as { id: string }
  const body = await readBody(event)

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'id parameter required' })
  }

  const { shares, avgPrice, notes } = body
  const update: any = {}
  if (shares != null) update.shares = Number(shares)
  if (avgPrice != null) update.avgPrice = Number(avgPrice)
  if (notes !== undefined) update.notes = notes

  await updateHolding(id, update, event.context.cloudflare?.env)
  return { success: true }
})
