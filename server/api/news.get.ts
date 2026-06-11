import { getNews } from '../../utils/yahoo'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const symbol = query.symbol as string | undefined

  try {
    return await getNews(symbol)
  } catch (error: any) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
