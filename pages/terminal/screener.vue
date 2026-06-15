<script setup lang="ts">
import { canonicalUrl } from '../../utils/seo'

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
const presets = [
  { label: 'Top Gainers', q: 'stock market', sort: 'regularMarketChangePercent', dir: 'desc' },
  { label: 'Top Losers', q: 'stock market', sort: 'regularMarketChangePercent', dir: 'asc' },
  { label: 'Tech Stocks', q: 'technology stocks', sort: 'marketCap', dir: 'desc' },
  { label: 'Dividend', q: 'dividend stocks', sort: 'regularMarketChangePercent', dir: 'desc' },
  { label: 'Growth', q: 'growth stocks', sort: 'regularMarketChangePercent', dir: 'desc' },
]

useHead({
  title: 'Stock Screener | Kalmate',
  meta: [
    { name: 'description', content: 'Filter and sort thousands of instruments with the Kalmate stock screener.' },
    { property: 'og:title', content: 'Stock Screener | Kalmate' },
    { property: 'og:description', content: 'Filter and sort thousands of instruments with the Kalmate stock screener.' },
    { property: 'og:url', content: canonical },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Stock Screener | Kalmate' },
    { name: 'twitter:description', content: 'Filter and sort thousands of instruments with the Kalmate stock screener.' },
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

function applyPreset(p: typeof presets[number]) {
  searchQuery.value = p.q
  sortBy.value = p.sort
  sortDir.value = p.dir
  search()
}

onMounted(search)
</script>

<template>
  <div class="text-xs text-[#aaa] mb-3 tracking-wider font-sans">SCREENER</div>

      <!-- Presets -->
      <div class="flex flex-wrap gap-2 mb-4">
        <button
          v-for="p in presets"
          :key="p.label"
          class="bg-[#1a1a1a] text-[#bbb] px-2 py-1 rounded text-xs hover:bg-[#333] transition-colors font-sans"
          @click="applyPreset(p)"
        >
          {{ p.label }}
        </button>
      </div>

      <!-- Filters -->
      <div class="bg-[#111] border border-[#333] rounded p-3 mb-4" role="search" aria-label="Stock screener filters">
        <div class="flex flex-wrap gap-2 items-end">
          <div>
            <label for="scr-query" class="text-[#888] text-[10px] mb-1 font-sans block">Search</label>
            <input
              id="scr-query"
              v-model="searchQuery"
              type="text"
              placeholder="e.g. tech stocks, dividend..."
               class="bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-sm w-48 text-white font-sans"
              @keyup.enter="search"
            />
          </div>
          <div>
            <label for="scr-min" class="text-[#888] text-[10px] mb-1 font-sans block">Min Price</label>
            <input
              id="scr-min"
              v-model="minPrice"
              type="number"
              step="0.01"
              placeholder="0"
               class="bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-sm w-20 text-white font-sans"
            />
          </div>
          <div>
            <label for="scr-max" class="text-[#888] text-[10px] mb-1 font-sans block">Max Price</label>
            <input
              id="scr-max"
              v-model="maxPrice"
              type="number"
              step="0.01"
              placeholder="9999"
              class="bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-sm w-20 text-white font-sans"
            />
          </div>
          <div>
            <label for="scr-sort" class="text-[#888] text-[10px] mb-1 font-sans block">Sort By</label>
            <select
              id="scr-sort"
              v-model="sortBy"
              class="bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-sm text-white font-sans"
            >
              <option value="regularMarketChangePercent">Change %</option>
              <option value="regularMarketChange">Change</option>
              <option value="regularMarketPrice">Price</option>
              <option value="marketCap">Mkt Cap</option>
              <option value="regularMarketVolume">Volume</option>
            </select>
          </div>
          <div>
            <label for="scr-dir" class="text-[#888] text-[10px] mb-1 font-sans block">Order</label>
            <select
              id="scr-dir"
              v-model="sortDir"
              class="bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-sm text-white font-sans"
            >
              <option value="desc">High to Low</option>
              <option value="asc">Low to High</option>
            </select>
          </div>
          <button
            class="bg-[#2979ff] text-white px-3 py-1 rounded text-sm font-bold hover:bg-[#448aff] transition-colors font-sans"
            @click="search"
          >
            SCREEN
          </button>
        </div>
      </div>

      <!-- Results -->
      <div class="bg-[#111] border border-[#333] rounded overflow-hidden">
        <div v-if="loading" class="text-center text-[#aaa] py-8 text-xs animate-pulse-slow">
          Screening...
        </div>
        <div v-else-if="results.length === 0" class="text-center text-[#aaa] py-8 text-xs">
          No results. Try a different search.
        </div>
        <table v-else class="w-full text-sm">
          <thead>
            <tr class="border-b border-[#333] text-[#aaa] text-xs">
              <th class="text-left px-3 py-2">SYMBOL</th>
              <th class="text-left px-3 py-2 hidden sm:table-cell">NAME</th>
              <th class="text-right px-3 py-2">PRICE</th>
              <th class="text-right px-3 py-2">CHANGE</th>
              <th class="text-right px-3 py-2 hidden sm:table-cell">CHANGE %</th>
              <th class="text-right px-3 py-2 hidden md:table-cell">VOLUME</th>
              <th class="text-right px-3 py-2 hidden lg:table-cell">MKT CAP</th>
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
                {{ '$' + (item.regularMarketPrice?.toFixed(2) ?? '...') }}
              </td>
              <td
                class="px-3 py-2 text-right font-mono"
                :class="(item.regularMarketChange ?? 0) >= 0 ? 'text-[#00c853]' : 'text-[#ff1744]'"
              >
                {{ item.regularMarketChange >= 0 ? '+' : '' }}{{ item.regularMarketChange?.toFixed(2) ?? '...' }}
              </td>
              <td
                class="px-3 py-2 text-right font-mono hidden sm:table-cell"
                :class="(item.regularMarketChangePercent ?? 0) >= 0 ? 'text-[#00c853]' : 'text-[#ff1744]'"
              >
                {{ item.regularMarketChangePercent >= 0 ? '+' : '' }}{{ item.regularMarketChangePercent?.toFixed(2) ?? '...' }}%
              </td>
              <td class="px-3 py-2 text-right font-mono text-[#888] hidden md:table-cell">
                {{ item.regularMarketVolume?.toLocaleString() ?? '-' }}
              </td>
              <td class="px-3 py-2 text-right font-mono text-[#888] hidden lg:table-cell">
                {{ item.marketCap ? '$' + (item.marketCap / 1e9).toFixed(1) + 'B' : '-' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
</template>
