<script setup lang="ts">
import { canonicalUrl } from '../../utils/seo'
import { useCurrency } from '~/composables/useCurrency'
const { formatPrice, formatChange, formatChangePercent } = useCurrency()

const { t } = useI18n()

const canonical = canonicalUrl('/terminal/screener')

interface QuoteItem {
  symbol: string
  shortName?: string
  regularMarketPrice: number
  regularMarketChange: number
  regularMarketChangePercent: number
  regularMarketVolume?: number
  marketCap?: number
}

const results = ref<QuoteItem[]>([])
const loading = ref(false)
const searchQuery = ref('technology stocks')
const minPrice = ref('')
const maxPrice = ref('')
const sortBy = ref('regularMarketChange')
const sortDir = ref('desc')

const presetList = computed(() => [
  { label: t('terminal.screener.presets.topGainers'), q: 'stock market', sort: 'regularMarketChangePercent', dir: 'desc' },
  { label: t('terminal.screener.presets.topLosers'), q: 'stock market', sort: 'regularMarketChangePercent', dir: 'asc' },
  { label: t('terminal.screener.presets.techStocks'), q: 'technology stocks', sort: 'marketCap', dir: 'desc' },
  { label: t('terminal.screener.presets.dividend'), q: 'dividend stocks', sort: 'regularMarketChangePercent', dir: 'desc' },
  { label: t('terminal.screener.presets.growth'), q: 'growth stocks', sort: 'regularMarketChangePercent', dir: 'desc' },
])

const sortOptions = computed(() => [
  { value: 'regularMarketChangePercent', label: t('terminal.screener.filters.sortChangePct') },
  { value: 'regularMarketChange', label: t('terminal.screener.filters.sortChange') },
  { value: 'regularMarketPrice', label: t('terminal.screener.filters.sortPrice') },
  { value: 'marketCap', label: t('terminal.screener.filters.sortMktCap') },
  { value: 'regularMarketVolume', label: t('terminal.screener.filters.sortVolume') },
])

const orderOptions = computed(() => [
  { value: 'desc', label: t('terminal.screener.filters.orderHighLow') },
  { value: 'asc', label: t('terminal.screener.filters.orderLowHigh') },
])

useHead({
  title: computed(() => t('terminal.heading.screener')),
  meta: [
    { name: 'description', content: computed(() => t('landing.features.cards.screener.desc')) },
    { name: 'keywords', content: 'kalmate screener, stock screener, stock filter, ETF screener, forex screener, crypto screener, trading opportunities, market screener' },
    { property: 'og:title', content: computed(() => t('terminal.heading.screener')) },
    { property: 'og:description', content: computed(() => t('landing.features.cards.screener.desc')) },
    { property: 'og:url', content: canonical },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: computed(() => t('terminal.heading.screener')) },
    { name: 'twitter:description', content: computed(() => t('landing.features.cards.screener.desc')) },
  ],
  link: [{ rel: 'canonical', href: canonical }],
})

async function search() {
  loading.value = true
  try {
    const params = new URLSearchParams({ q: searchQuery.value })
    if (minPrice.value) params.set('minPrice', minPrice.value)
    if (maxPrice.value) params.set('maxPrice', maxPrice.value)
    params.set('sortBy', sortBy.value)
    params.set('sortDir', sortDir.value)
    const data = await $fetch(`/api/screener?${params}`)
    results.value = data as QuoteItem[]
  } catch {
    results.value = []
  } finally {
    loading.value = false
  }
}

function applyPreset(p: typeof presetList.value[number]) {
  searchQuery.value = p.q
  sortBy.value = p.sort
  sortDir.value = p.dir
  search()
}

onMounted(search)
</script>

<template>
  <div class="text-xs text-[#ccc] mb-3 tracking-wider font-sans">{{ $t('terminal.heading.screener') }}</div>

      <!-- Presets -->
      <div class="flex flex-wrap gap-2 mb-4">
        <button
          v-for="p in presetList"
          :key="p.label"
          class="bg-[#1a1a1a] text-[#bbb] px-2 py-1 rounded text-xs hover:bg-[#333] transition-colors font-sans"
          @click="applyPreset(p)"
        >
          {{ p.label }}
        </button>
      </div>

      <!-- Filters -->
      <div class="bg-[#111] border border-[#333] rounded p-3 mb-4" role="search" :aria-label="$t('terminal.screener.filters.search')">
        <div class="flex flex-wrap gap-2 items-end">
          <div>
            <label for="scr-query" class="text-[#ccc] text-[10px] mb-1 font-sans block">{{ $t('terminal.screener.filters.search') }}</label>
            <input
              id="scr-query"
              v-model="searchQuery"
              type="text"
              :placeholder="$t('terminal.screener.filters.searchPlaceholder')"
               class="bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-sm w-48 text-white font-sans"
              @keyup.enter="search"
            />
          </div>
          <div>
            <label for="scr-min" class="text-[#ccc] text-[10px] mb-1 font-sans block">{{ $t('terminal.screener.filters.minPrice') }}</label>
            <input
              id="scr-min"
              v-model="minPrice"
              type="number"
              step="0.01"
              :placeholder="$t('terminal.screener.filters.minPricePlaceholder')"
               class="bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-sm w-20 text-white font-sans"
            />
          </div>
          <div>
            <label for="scr-max" class="text-[#ccc] text-[10px] mb-1 font-sans block">{{ $t('terminal.screener.filters.maxPrice') }}</label>
            <input
              id="scr-max"
              v-model="maxPrice"
              type="number"
              step="0.01"
              :placeholder="$t('terminal.screener.filters.maxPricePlaceholder')"
              class="bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-sm w-20 text-white font-sans"
            />
          </div>
          <div>
            <label for="scr-sort" class="text-[#ccc] text-[10px] mb-1 font-sans block">{{ $t('terminal.screener.filters.sortBy') }}</label>
            <select
              id="scr-sort"
              v-model="sortBy"
              class="bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-sm text-white font-sans"
            >
              <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
          <div>
            <label for="scr-dir" class="text-[#ccc] text-[10px] mb-1 font-sans block">{{ $t('terminal.screener.filters.order') }}</label>
            <select
              id="scr-dir"
              v-model="sortDir"
              class="bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-sm text-white font-sans"
            >
              <option v-for="opt in orderOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
          <button
            class="bg-[#2979ff] text-white px-3 py-1 rounded text-sm font-bold hover:bg-[#448aff] transition-colors font-sans"
            @click="search"
          >
            {{ $t('terminal.screener.filters.screen') }}
          </button>
        </div>
      </div>

      <!-- Results -->
      <div class="bg-[#111] border border-[#333] rounded overflow-hidden">
        <div v-if="loading" class="text-center text-[#ccc] py-8 text-xs animate-pulse-slow">
          {{ $t('terminal.screener.results.loading') }}
        </div>
        <div v-else-if="results.length === 0" class="text-center text-[#ccc] py-8 text-xs">
          {{ $t('terminal.screener.results.empty') }}
        </div>
        <table v-else class="w-full text-sm">
          <thead>
            <tr class="border-b border-[#333] text-[#ccc] text-xs">
              <th class="text-left px-3 py-2">{{ $t('terminal.screener.columns.symbol') }}</th>
              <th class="text-left px-3 py-2 hidden sm:table-cell">{{ $t('terminal.screener.columns.name') }}</th>
              <th class="text-right px-3 py-2">{{ $t('terminal.screener.columns.price') }}</th>
              <th class="text-right px-3 py-2">{{ $t('terminal.screener.columns.change') }}</th>
              <th class="text-right px-3 py-2 hidden sm:table-cell">{{ $t('terminal.screener.columns.changePct') }}</th>
              <th class="text-right px-3 py-2 hidden md:table-cell">{{ $t('terminal.screener.columns.volume') }}</th>
              <th class="text-right px-3 py-2 hidden lg:table-cell">{{ $t('terminal.screener.columns.mktCap') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in results"
              :key="item.symbol"
              class="border-b border-[#1a1a1a] hover:bg-[#1a1a1a]"
            >
              <td class="px-3 py-2">
                <NuxtLink
                  :to="`/stock/${item.symbol}`"
                  class="text-[#00c853] font-mono font-bold hover:underline"
                >
                  {{ item.symbol }}
                </NuxtLink>
              </td>
              <td class="px-3 py-2 text-[#bbb] text-xs truncate hidden sm:table-cell max-w-[200px]">
                {{ item.shortName ?? '-' }}
              </td>
              <td class="px-3 py-2 text-right font-mono">
                {{ formatPrice(item.regularMarketPrice) }}
              </td>
              <td
                class="px-3 py-2 text-right font-mono"
                :class="(item.regularMarketChange ?? 0) >= 0 ? 'text-[#00c853]' : 'text-[#ff1744]'"
              >
                {{ formatChange(item.regularMarketChange) }}
              </td>
              <td
                class="px-3 py-2 text-right font-mono hidden sm:table-cell"
                :class="(item.regularMarketChangePercent ?? 0) >= 0 ? 'text-[#00c853]' : 'text-[#ff1744]'"
              >
                {{ formatChangePercent(item.regularMarketChangePercent) }}
              </td>
              <td class="px-3 py-2 text-right font-mono text-[#ccc] hidden md:table-cell">
                {{ item.regularMarketVolume?.toLocaleString() ?? '-' }}
              </td>
              <td class="px-3 py-2 text-right font-mono text-[#ccc] hidden lg:table-cell">
                {{ item.marketCap ? '$' + (item.marketCap / 1e9).toFixed(1) + 'B' : '-' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
</template>
