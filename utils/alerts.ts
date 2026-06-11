import { getAlerts, updateAlert } from './store'
import { getQuote } from './yahoo'

export async function checkAlerts() {
  const alerts = getAlerts().filter(a => !a.triggered)
  const results: { alert: any; currentPrice: number; triggered: boolean }[] = []

  for (const alert of alerts) {
    try {
      const quote = await getQuote(alert.symbol)
      const currentPrice = quote.regularMarketPrice
      const triggered = alert.type === 'above'
        ? currentPrice >= alert.targetPrice
        : currentPrice <= alert.targetPrice

      updateAlert(alert.id, {
        triggered,
        lastChecked: new Date().toISOString(),
      })

      results.push({ alert, currentPrice, triggered })
    } catch (e) {
      console.warn(`Alert check failed for ${alert.symbol}:`, e)
    }
  }

  return results
}
