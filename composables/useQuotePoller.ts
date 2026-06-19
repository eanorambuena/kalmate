import { ref, onMounted, onUnmounted } from 'vue'
import { getAllMarketSymbols, distributeQuotes, type CategoryData } from '~/utils/quotePoller'
import type { ALL_MARKETS } from '~/utils/constants'

export function useQuotePoller(
  markets: typeof ALL_MARKETS,
  intervalMs = 60_000,
) {
  const categories = ref<CategoryData[]>([])
  const pending = ref(true)
  const error = ref<string | null>(null)
  let intervalId: ReturnType<typeof setInterval> | null = null
  let visibilityHandler: (() => void) | null = null

  async function fetchQuotes() {
    try {
      const symbols = getAllMarketSymbols(markets)
      const result = await $fetch(`/api/quote?symbols=${symbols.join(',')}`)
      categories.value = distributeQuotes(result, markets)
      error.value = null
    } catch (e: any) {
      error.value = e?.message || 'Failed to fetch quotes'
    } finally {
      pending.value = false
    }
  }

  function startPolling() {
    stopPolling()
    fetchQuotes()
    intervalId = setInterval(fetchQuotes, intervalMs)
    if (typeof document !== 'undefined') {
      visibilityHandler = () => {
        if (document.hidden) {
          stopPolling()
        } else {
          startPolling()
        }
      }
      document.addEventListener('visibilitychange', visibilityHandler)
    }
  }

  function stopPolling() {
    if (intervalId !== null) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  onMounted(startPolling)
  onUnmounted(() => {
    stopPolling()
    if (visibilityHandler && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', visibilityHandler)
    }
  })

  return { categories, pending, error, refresh: fetchQuotes }
}
