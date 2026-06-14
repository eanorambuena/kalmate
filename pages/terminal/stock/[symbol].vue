<script setup lang="ts">
import type { QuoteData, HistoryData } from '../../utils/types'
import KalmanAnalysis from '../../../components/KalmanAnalysis.vue'

const route = useRoute()
const symbol = route.params.symbol as string

const quote = ref<QuoteData | null>(null)
const history = ref<HistoryData[]>([])
const range = ref<'1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y'>('1mo')
const loading = ref(true)
const error = ref(false)
const historyCache = ref<Record<string, HistoryData[]>>({})

async function fetchQuote() {
  try {
    const data = await $fetch(`/api/quote?symbol=${symbol}`)
    quote.value = data as QuoteData
  } catch (e) {
    console.error(e)
    error.value = true
  }
}

function intervalForRange(r: string): string {
  switch (r) {
    case '1d': return '5m'
    case '5d': return '1h'
    default: return '1d'
  }
}

async function fetchHistory() {
  const key = `${range.value}:${intervalForRange(range.value)}`
  if (historyCache.value[key]) {
    history.value = historyCache.value[key]
    return
  }
  try {
    const data = await $fetch(`/api/history?symbol=${symbol}&range=${range.value}&interval=${intervalForRange(range.value)}`)
    historyCache.value[key] = data as HistoryData[]
    history.value = data as HistoryData[]
  } catch (e) { console.error(e) }
}

onMounted(async () => {
  loading.value = true
  await Promise.all([fetchQuote(), fetchHistory()])
  loading.value = false
})

watch(range, () => {
  fetchHistory()
})
</script>

<template>
  <div v-if="loading" class="text-center text-[#aaa] py-20 text-sm animate-pulse-slow">
        Loading market data...
      </div>
      <div v-else-if="error" class="text-center py-20">
        <div class="text-[#ff1744] font-bold mb-2">Data Unavailable</div>
        <div class="text-[#aaa] text-xs">Yahoo Finance may be unreachable or {{ symbol }} is not a valid symbol.</div>
      </div>
      <template v-else>
        <div v-if="quote" class="bg-[#111] border border-[#333] rounded p-4 mb-4" aria-live="polite" aria-label="Quote data">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h1 class="text-2xl font-bold font-mono text-[#00c853]">{{ symbol }}</h1>
              <div v-if="quote.shortName" class="text-sm text-[#bbb] font-sans">{{ quote.shortName }}</div>
            </div>
            <div class="text-right" aria-label="Price and change">
              <div class="text-3xl font-bold font-mono" aria-label="Current price: {{ '$' + quote.regularMarketPrice?.toFixed(2) }}">{{ '$' + quote.regularMarketPrice?.toFixed(2) }}</div>
              <div
                class="text-sm font-mono"
                :class="quote.regularMarketChange >= 0 ? 'text-[#00c853]' : 'text-[#ff1744]'"
                :aria-label="`Change: ${quote.regularMarketChange >= 0 ? '+' : ''}${quote.regularMarketChange?.toFixed(2)} (${quote.regularMarketChangePercent?.toFixed(2)}%)`"
              >
                {{ quote.regularMarketChange >= 0 ? '+' : '' }}{{ quote.regularMarketChange?.toFixed(2) }}
                ({{ quote.regularMarketChangePercent?.toFixed(2) }}%)
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-xs">
            <div>
              <span class="text-[#aaa] font-sans">Open: </span>
              <span class="text-white font-mono">{{ '$' + (quote.regularMarketOpen?.toFixed(2) ?? '-') }}</span>
            </div>
            <div>
              <span class="text-[#aaa] font-sans">High: </span>
              <span class="text-white font-mono">{{ '$' + (quote.regularMarketDayHigh?.toFixed(2) ?? '-') }}</span>
            </div>
            <div>
              <span class="text-[#aaa] font-sans">Low: </span>
              <span class="text-white font-mono">{{ '$' + (quote.regularMarketDayLow?.toFixed(2) ?? '-') }}</span>
            </div>
            <div>
              <span class="text-[#aaa] font-sans">Prev Close: </span>
              <span class="text-white font-mono">{{ '$' + (quote.regularMarketPreviousClose?.toFixed(2) ?? '-') }}</span>
            </div>
            <div>
              <span class="text-[#aaa] font-sans">Volume: </span>
              <span class="text-white font-mono">{{ quote.regularMarketVolume?.toLocaleString() ?? '-' }}</span>
            </div>
            <div>
              <span class="text-[#aaa] font-sans">Mkt Cap: </span>
              <span class="text-white font-mono">{{ quote.marketCap ? '$' + (quote.marketCap / 1e9).toFixed(2) + 'B' : '-' }}</span>
            </div>
            <div>
              <span class="text-[#aaa] font-sans">52W High: </span>
              <span class="text-white font-mono">{{ '$' + (quote.fiftyTwoWeekHigh?.toFixed(2) ?? '-') }}</span>
            </div>
            <div>
              <span class="text-[#aaa] font-sans">52W Low: </span>
              <span class="text-white font-mono">{{ '$' + (quote.fiftyTwoWeekLow?.toFixed(2) ?? '-') }}</span>
            </div>
          </div>
        </div>

        <div class="bg-[#111] border border-[#333] rounded p-4">
          <div class="flex items-center gap-2 mb-4" role="group" aria-label="Chart time range">
            <button
              v-for="r in (['1d', '5d', '1mo', '3mo', '6mo', '1y'] as const)"
              :key="r"
              class="px-2 py-1 text-xs rounded transition-colors font-sans"
              :class="range === r
                ? 'bg-[#00c853] text-black font-bold'
                : 'bg-[#1a1a1a] text-[#bbb] hover:text-white'"
              @click="range = r"
              :aria-pressed="range === r"
              :aria-label="`${r} range`"
            >
              {{ r.toUpperCase() }}
            </button>
          </div>
          <div v-if="history.length > 0">
            <ClientOnly><StockChart :data="history" /></ClientOnly>
          </div>
          <div v-else class="h-[400px] flex items-center justify-center text-[#aaa] text-sm" aria-label="No chart data">
            No chart data available
          </div>
        </div>

        <div class="mt-4">
          <KalmanAnalysis :symbol="symbol" />
        </div>
      </template>
</template>
