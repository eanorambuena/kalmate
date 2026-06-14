<script setup lang="ts">
import type { PortfolioHolding, QuoteData } from '../utils/types'
import { useToast } from '../composables/useToast'

const { add: addToast } = useToast()

const holdings = ref<PortfolioHolding[]>([])
const quotes = ref<Record<string, QuoteData>>({})
const newSymbol = ref('')
const newShares = ref('')
const newAvgPrice = ref('')
const searchResults = ref<any[]>([])
const searching = ref(false)
const showSearch = ref(false)
const loading = ref(true)
let searchTimer: ReturnType<typeof setTimeout>

async function fetchPortfolio() {
  try {
    const data = await $fetch('/api/portfolio')
    holdings.value = (data as any).holdings ?? []
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

async function fetchQuotes() {
  if (holdings.value.length === 0) return
  try {
    const symbols = holdings.value.map(h => h.symbol).join(',')
    const data = await $fetch(`/api/quote?symbols=${symbols}`)
    const map: Record<string, QuoteData> = {}
    const arr = Array.isArray(data) ? data : [data]
    arr.forEach((q: any) => { map[q.symbol] = q })
    quotes.value = map
  } catch (e) { console.error(e) }
}

async function addHolding() {
  if (!newSymbol.value || !newShares.value || !newAvgPrice.value) {
    addToast('Fill in all fields', 'error')
    return
  }
  try {
    await $fetch('/api/portfolio', {
      method: 'POST',
      body: {
        symbol: newSymbol.value.toUpperCase(),
        shares: Number(newShares.value),
        avgPrice: Number(newAvgPrice.value),
      },
    })
    newSymbol.value = ''
    newShares.value = ''
    newAvgPrice.value = ''
    await fetchPortfolio()
    await fetchQuotes()
    addToast(`${newSymbol.value.toUpperCase() || 'Position'} added`, 'success')
  } catch (e) {
    addToast('Failed to add position', 'error')
    console.error(e)
  }
}

function calcTotalPnL() {
  let totalValue = 0
  let totalCost = 0
  for (const h of holdings.value) {
    const q = quotes.value[h.symbol]
    if (q) {
      totalValue += h.shares * q.regularMarketPrice
      totalCost += h.shares * h.avgPrice
    }
  }
  if (totalCost === 0) return null
  return { totalValue, totalCost, pnl: totalValue - totalCost, pnlPercent: ((totalValue - totalCost) / totalCost) * 100 }
}

const deletingId = ref<string | null>(null)

function confirmDelete(id: string) {
  deletingId.value = id
}

function cancelDelete() {
  deletingId.value = null
}

async function deleteHolding(id: string) {
  try {
    await $fetch(`/api/portfolio/${id}`, { method: 'DELETE' })
    deletingId.value = null
    await fetchPortfolio()
    await fetchQuotes()
    addToast('Position deleted', 'success')
  } catch (e) {
    addToast('Failed to delete', 'error')
    console.error(e)
  }
}

function calcPnL(h: PortfolioHolding) {
  const quote = quotes.value[h.symbol]
  if (!quote) return null
  const currentValue = h.shares * quote.regularMarketPrice
  const costBasis = h.shares * h.avgPrice
  const pnl = currentValue - costBasis
  const pnlPercent = costBasis > 0 ? ((currentValue - costBasis) / costBasis) * 100 : 0
  return { pnl, pnlPercent, currentValue }
}

onMounted(() => {
  fetchPortfolio()
})

watch(holdings, () => { fetchQuotes() }, { deep: true })

watch(newSymbol, (val) => {
  clearTimeout(searchTimer)
  if (val.length < 1) {
    searchResults.value = []
    showSearch.value = false
    return
  }
  searching.value = true
  searchTimer = setTimeout(async () => {
    try {
      const data = await $fetch(`/api/search?q=${encodeURIComponent(val)}`)
      searchResults.value = (data as any[]).slice(0, 8)
      showSearch.value = true
    } catch (e) {
      console.error(e)
      searchResults.value = []
      showSearch.value = true
    } finally {
      searching.value = false
    }
  }, 300)
})

function selectSearchResult(symbol: string) {
  newSymbol.value = symbol
  searchResults.value = []
  showSearch.value = false
}
</script>

<template>
  <div>
    <div class="bg-[#111] border border-[#2a2a2a] rounded-xl p-4 mb-4 card-hover">
      <div class="text-xs text-[#aaa] mb-3 tracking-wider font-sans">ADD POSITION</div>
      <div class="flex flex-wrap gap-2">
        <div class="relative">
          <input
            v-model="newSymbol"
            placeholder="SYMBOL"
            class="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-sm w-24 text-white uppercase placeholder-[#555] focus:border-[#00c853] focus:outline-none transition-colors"
          />
          <div
            v-if="showSearch && newSymbol.length > 0"
            class="absolute top-full left-0 mt-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-xl z-50 min-w-[240px] overflow-hidden"
          >
            <div v-if="searching" class="text-center text-[#aaa] py-2 text-xs">Searching...</div>
            <button
              v-for="r in searchResults"
              :key="r.symbol"
              class="w-full text-left px-3 py-2 hover:bg-[#2a2a2a] border-b border-[#222] last:border-0 transition-colors"
              @mousedown="selectSearchResult(r.symbol)"
            >
              <span class="text-[#00c853] font-mono text-sm">{{ r.symbol }}</span>
              <span class="text-[#aaa] text-xs ml-2 font-sans">{{ r.exchange }}</span>
              <div v-if="r.shortname || r.longname" class="text-[#bbb] text-xs truncate font-sans">{{ r.shortname || r.longname }}</div>
            </button>
          </div>
        </div>
        <input
          v-model="newShares"
          placeholder="SHARES"
          type="number"
          class="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-sm w-20 text-white placeholder-[#555] focus:border-[#00c853] focus:outline-none transition-colors"
        />
        <input
          v-model="newAvgPrice"
          placeholder="AVG $"
          type="number"
          step="0.01"
          class="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-sm w-24 text-white placeholder-[#555] focus:border-[#00c853] focus:outline-none transition-colors"
        />
        <button
          class="bg-[#00c853] text-black px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-[#00e060] hover:shadow-lg hover:shadow-[#00c853]/20 active:scale-95 transition-all duration-200 font-sans"
          @click="addHolding"
        >
          ADD
        </button>
      </div>
    </div>

    <!-- Skeleton -->
    <div v-if="loading" class="bg-[#111] border border-[#2a2a2a] rounded-xl overflow-hidden">
      <div class="p-4 space-y-3">
        <div class="skeleton h-4 w-40 mb-4" />
        <div v-for="i in 3" :key="i" class="flex items-center gap-3">
          <div class="skeleton h-4 w-16" />
          <div class="skeleton h-4 w-12" />
          <div class="skeleton h-4 w-20" />
          <div class="skeleton h-4 w-20" />
          <div class="skeleton h-4 w-24" />
          <div class="skeleton h-4 w-20" />
        </div>
      </div>
    </div>

    <!-- Summary -->
    <div v-else-if="holdings.length > 0" class="bg-[#111] border border-[#2a2a2a] rounded-xl p-4 mb-3 card-hover">
      <div class="text-xs text-[#aaa] mb-3 tracking-wider font-sans">PORTFOLIO SUMMARY</div>
      <div class="grid grid-cols-3 gap-4 text-center">
        <div class="bg-[#1a1a1a] rounded-lg p-3">
          <div class="text-[10px] text-[#666] font-sans uppercase tracking-wider">Total Value</div>
          <div class="text-lg font-mono font-bold mt-1 animate-count-up">
            {{ calcTotalPnL() ? '$' + calcTotalPnL()!.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '...' }}
          </div>
        </div>
        <div class="bg-[#1a1a1a] rounded-lg p-3">
          <div class="text-[10px] text-[#666] font-sans uppercase tracking-wider">P&amp;L</div>
          <div
            class="text-lg font-mono font-bold mt-1"
            :class="calcTotalPnL() ? (calcTotalPnL()!.pnl >= 0 ? 'text-[#00c853]' : 'text-[#ff1744]') : ''"
          >
            {{ calcTotalPnL() ? '$' + calcTotalPnL()!.pnl.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '...' }}
          </div>
        </div>
        <div class="bg-[#1a1a1a] rounded-lg p-3">
          <div class="text-[10px] text-[#666] font-sans uppercase tracking-wider">Return</div>
          <div
            class="text-lg font-mono font-bold mt-1"
            :class="calcTotalPnL() ? (calcTotalPnL()!.pnlPercent >= 0 ? 'text-[#00c853]' : 'text-[#ff1744]') : ''"
          >
            {{ calcTotalPnL() ? calcTotalPnL()!.pnlPercent.toFixed(2) + '%' : '...' }}
          </div>
        </div>
      </div>
    </div>

    <div class="bg-[#111] border border-[#2a2a2a] rounded-xl overflow-hidden card-hover">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-[#2a2a2a] text-[#aaa] text-xs">
            <th class="text-left px-3 py-2.5 font-sans">SYMBOL</th>
            <th class="text-right px-3 py-2.5 font-sans">SHARES</th>
            <th class="text-right px-3 py-2.5 font-sans">AVG $</th>
            <th class="text-right px-3 py-2.5 font-sans">CURRENT</th>
            <th class="text-right px-3 py-2.5 font-sans">P&amp;L</th>
            <th class="text-right px-3 py-2.5 font-sans">VALUE</th>
            <th class="text-right px-3 py-2.5" />
          </tr>
        </thead>
        <tbody>
          <tr v-if="holdings.length === 0">
            <td colspan="7" class="text-center text-[#aaa] py-12 text-xs font-sans">
              No positions. Add one above.
            </td>
          </tr>
          <tr
            v-for="(h, i) in holdings"
            :key="h.id"
            class="border-b border-[#1a1a1a] hover:bg-[#1a1a1a] transition-colors duration-150"
          >
            <td class="px-3 py-2.5 font-mono text-[#00c853] font-bold">{{ h.symbol }}</td>
            <td class="px-3 py-2.5 text-right font-mono">{{ h.shares }}</td>
            <td class="px-3 py-2.5 text-right font-mono">{{ '$' + h.avgPrice.toFixed(2) }}</td>
            <td class="px-3 py-2.5 text-right font-mono font-medium">
              <span v-if="quotes[h.symbol]" class="animate-count-up" :style="{ animationDelay: `${i * 50}ms` }">
                {{ '$' + quotes[h.symbol].regularMarketPrice.toFixed(2) }}
              </span>
              <span v-else class="text-[#555]">...</span>
            </td>
            <td
              class="px-3 py-2.5 text-right font-mono font-medium"
              :class="calcPnL(h) ? (calcPnL(h)!.pnl >= 0 ? 'text-[#00c853]' : 'text-[#ff1744]') : ''"
            >
              <span v-if="calcPnL(h)" class="animate-count-up" :style="{ animationDelay: `${i * 50}ms` }">
                {{ calcPnL(h)!.pnl >= 0 ? '+' : '' }}{{ '$' + calcPnL(h)!.pnl.toFixed(2) }} ({{ calcPnL(h)!.pnlPercent.toFixed(2) }}%)
              </span>
              <span v-else class="text-[#555]">...</span>
            </td>
            <td class="px-3 py-2.5 text-right font-mono font-medium">
              <span v-if="calcPnL(h)" class="animate-count-up" :style="{ animationDelay: `${i * 50}ms` }">
                {{ '$' + calcPnL(h)!.currentValue.toFixed(2) }}
              </span>
              <span v-else class="text-[#555]">...</span>
            </td>
            <td class="px-3 py-2.5 text-right">
              <button
                v-if="deletingId !== h.id"
                class="text-[#555] hover:text-[#ff1744] text-xs transition-colors px-1"
                @click="confirmDelete(h.id)"
                title="Delete"
              >
                ✕
              </button>
              <span v-else class="flex gap-1 text-xs">
                <button class="text-[#ff1744] font-bold px-1 hover:text-[#ff5252] transition-colors" @click="deleteHolding(h.id)">DEL</button>
                <button class="text-[#666] hover:text-[#aaa] px-1 transition-colors" @click="cancelDelete">X</button>
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
