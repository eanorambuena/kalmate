import type { AlertCondition } from '~/utils/types'

export function useAlerts() {
  const triggeredAlerts = ref<Set<string>>(new Set())
  const pollingInterval = ref<ReturnType<typeof setInterval> | null>(null)
  const isPolling = ref(false)
  const refreshKey = ref(0)

  async function checkAlerts() {
    try {
      const data = await $fetch('/api/alerts/check', { method: 'POST' })
      const result = data as { checked: number; triggered: number; results: Array<{ alert: AlertCondition; triggered: boolean; currentPrice: number }> }

      refreshKey.value++

      const newTriggered = result.results
        ?.filter(r => r.triggered)
        .map(r => r.alert.id) ?? []

      if (newTriggered.length > 0) {
        const updated = new Set(triggeredAlerts.value)
        newTriggered.forEach(id => updated.add(id))
        triggeredAlerts.value = updated

        if (typeof window !== 'undefined' && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            newTriggered.forEach(alertId => {
              const triggered = result.results.find(r => r.alert.id === alertId)
              if (!triggered) return
              try {
                const notification = new Notification('Alert Triggered', {
                  body: `${triggered.alert.symbol} ${triggered.alert.type === 'above' ? '>' : '<'} $${triggered.alert.targetPrice} at $${triggered.currentPrice}`,
                })
                setTimeout(() => notification.close(), 5000)
              } catch {
                // Notifications not supported
              }
            })
          }
        }
      }

      return result
    } catch (e) {
      console.error(e)
      return null
    }
  }

  function startPolling(intervalMs = 60000) {
    if (pollingInterval.value) return
    isPolling.value = true
    checkAlerts()
    pollingInterval.value = setInterval(checkAlerts, intervalMs)
  }

  function stopPolling() {
    if (pollingInterval.value) {
      clearInterval(pollingInterval.value)
      pollingInterval.value = null
    }
    isPolling.value = false
  }

  onUnmounted(() => {
    stopPolling()
  })

  return {
    triggeredAlerts,
    isPolling,
    refreshKey,
    checkAlerts,
    startPolling,
    stopPolling,
  }
}
