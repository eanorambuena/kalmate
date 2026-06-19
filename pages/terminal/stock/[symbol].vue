<script setup lang="ts">
import type { QuoteData, HistoryData } from '../../utils/types'
import KalmanAnalysis from '../../../components/KalmanAnalysis.vue'
import { useCurrency } from '~/composables/useCurrency'
const { formatPrice, formatChange, formatChangePercent } = useCurrency()

const { t } = useI18n()

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
  <div v-if="loading" class="text-center text-[#ccc] py-20 text-sm animate-pulse-slow">
        {{ $t('terminal.stock.loading') }}
      </div>
      <div v-else-if="error" class="text-center py-20">
        <div class="text-[#ff1744] font-bold mb-2">{{ $t('terminal.stock.errorHeading') }}</div>
        <div class="text-[#ccc] text-xs">{{ $t('terminal.stock.errorDesc', { symbol }) }}</div>
      </div>
      <template v-else>
        <div v-if="quote" class="bg-[#111] border border-[#333] rounded p-4 mb-4" aria-live="polite" :aria-label="$t('terminal.stock.quoteLabel')">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h1 class="text-2xl font-bold font-mono text-[#00c853]">{{ symbol }}</h1>
              <div v-if="quote.shortName" class="text-sm text-[#bbb] font-sans">{{ quote.shortName }}</div>
            </div>
            <div class="text-right" :aria-label="$t('terminal.stock.priceLabel')">
              <div class="text-3xl font-bold font-mono" :aria-label="$t('terminal.stock.priceAria') + formatPrice(quote.regularMarketPrice)">{{ formatPrice(quote.regularMarketPrice) }}</div>
              <div
                class="text-sm font-mono"
                :class="quote.regularMarketChange >= 0 ? 'text-[#00c853]' : 'text-[#ff1744]'"
                :aria-label="$t('terminal.stock.changeAria') + formatChange(quote.regularMarketChange) + ' (' + formatChangePercent(quote.regularMarketChangePercent) + ')'"
              >
                {{ formatChange(quote.regularMarketChange) }}
                ({{ formatChangePercent(quote.regularMarketChangePercent) }})
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-xs">
            <div>
              <span class="text-[#ccc] font-sans">{{ $t('terminal.stock.open') }}</span>
              <span class="text-white font-mono">{{ formatPrice(quote.regularMarketOpen) }}</span>
            </div>
            <div>
              <span class="text-[#ccc] font-sans">{{ $t('terminal.stock.high') }}</span>
              <span class="text-white font-mono">{{ formatPrice(quote.regularMarketDayHigh) }}</span>
            </div>
            <div>
              <span class="text-[#ccc] font-sans">{{ $t('terminal.stock.low') }}</span>
              <span class="text-white font-mono">{{ formatPrice(quote.regularMarketDayLow) }}</span>
            </div>
            <div>
              <span class="text-[#ccc] font-sans">{{ $t('terminal.stock.prevClose') }}</span>
              <span class="text-white font-mono">{{ formatPrice(quote.regularMarketPreviousClose) }}</span>
            </div>
            <div>
              <span class="text-[#ccc] font-sans">{{ $t('terminal.stock.volume') }}</span>
              <span class="text-white font-mono">{{ quote.regularMarketVolume?.toLocaleString() ?? '-' }}</span>
            </div>
            <div>
              <span class="text-[#ccc] font-sans">{{ $t('terminal.stock.mktCap') }}</span>
              <span class="text-white font-mono">{{ quote.marketCap ? '$' + (quote.marketCap / 1e9).toFixed(2) + 'B' : '-' }}</span>
            </div>
            <div>
              <span class="text-[#ccc] font-sans">{{ $t('terminal.stock.w52High') }}</span>
              <span class="text-white font-mono">{{ formatPrice(quote.fiftyTwoWeekHigh) }}</span>
            </div>
            <div>
              <span class="text-[#ccc] font-sans">{{ $t('terminal.stock.w52Low') }}</span>
              <span class="text-white font-mono">{{ formatPrice(quote.fiftyTwoWeekLow) }}</span>
            </div>
          </div>
        </div>

        <div class="bg-[#111] border border-[#333] rounded p-4">
          <div class="flex items-center gap-2 mb-4" role="group" :aria-label="$t('terminal.stock.chartRangeLabel')">
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
              {{ $t(`stockRange.${r}`) }}
            </button>
          </div>
          <div v-if="history.length > 0">
            <ClientOnly><StockChart :data="history" /></ClientOnly>
          </div>
          <div v-else class="h-[400px] flex items-center justify-center text-[#ccc] text-sm" :aria-label="$t('terminal.stock.noChartData')">
            {{ $t('terminal.stock.noChartData') }}
          </div>
        </div>

        <div class="mt-4">
          <KalmanAnalysis :symbol="symbol" />
        </div>
      </template>
</template>
