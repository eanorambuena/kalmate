import type { AlertCondition } from '~/utils/types'

export function useAlerts() {
  const triggeredAlerts = ref<Set<string>>(new Set())
  const pollingInterval = ref<ReturnType<typeof setInterval> | null>(null)
  const isPolling = ref(false)

  async function checkAlerts() {
    try {
      const data = await $fetch('/api/alerts/check', { method: 'POST' })
      const result = data as { checked: number; triggered: number; results: Array<{ alert: AlertCondition; triggered: boolean }> }

      const newTriggered = result.results
        ?.filter(r => r.triggered)
        .map(r => r.alert.id) ?? []

      if (newTriggered.length > 0) {
        const updated = new Set(triggeredAlerts.value)
        newTriggered.forEach(id => updated.add(id))
        triggeredAlerts.value = updated

        if (typeof window !== 'undefined' && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            newTriggered.forEach(() => {
              try {
                const notification = new Notification('🚨 Alert Triggered', {
                  body: `${result.results.find(r => r.triggered)?.alert.symbol} hit target price!`,
                })
                setTimeout(() => notification.close(), 5000)
              } catch {
                // Notifications not supported
              }
            })
          } else if (Notification.permission !== 'denied') {
            Notification.requestPermission()
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
    checkAlerts,
    startPolling,
    stopPolling,
  }
}
