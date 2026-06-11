<script setup lang="ts">
import type { PortfolioHolding, QuoteData } from '../utils/types'

const holdings = ref<PortfolioHolding[]>([])
const quotes = ref<Record<string, QuoteData>>({})
const newSymbol = ref('')
const newShares = ref('')
const newAvgPrice = ref('')

async function fetchPortfolio() {
  try {
    const data = await $fetch('/api/portfolio')
    holdings.value = (data as any).holdings ?? []
  } catch (e) { console.error(e) }
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
  if (!newSymbol.value || !newShares.value || !newAvgPrice.value) return
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
  } catch (e) { console.error(e) }
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
  } catch (e) { console.error(e) }
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
</script>

<template>
  <div>
    <div class="bg-[#111] border border-[#333] rounded p-3 mb-4">
      <div class="text-xs text-[#aaa] mb-3 tracking-wider font-sans">ADD POSITION</div>
      <div class="flex flex-wrap gap-2">
        <input
          v-model="newSymbol"
          placeholder="SYMBOL"
          class="bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-sm w-24 text-white uppercase"
        />
        <input
          v-model="newShares"
          placeholder="SHARES"
          type="number"
          class="bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-sm w-20 text-white"
        />
        <input
          v-model="newAvgPrice"
          placeholder="AVG PRICE"
          type="number"
          step="0.01"
          class="bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-sm w-24 text-white"
        />
        <button
          class="bg-[#00c853] text-black px-3 py-1 rounded text-sm font-bold hover:bg-[#00e060] transition-colors font-sans"
          @click="addHolding"
        >
          ADD
        </button>
      </div>
    </div>

    <!-- Summary -->
    <div v-if="holdings.length > 0" class="bg-[#111] border border-[#333] rounded p-3 mb-3">
      <div class="text-xs text-[#aaa] mb-2 tracking-wider font-sans">PORTFOLIO SUMMARY</div>
      <div class="grid grid-cols-3 gap-3 text-center">
        <div>
          <div class="text-xs text-[#aaa] font-sans">Total Value</div>
          <div class="text-sm font-mono font-bold">{{ calcTotalPnL() ? '$' + calcTotalPnL()!.totalValue.toFixed(2) : '...' }}</div>
        </div>
        <div>
          <div class="text-xs text-[#aaa] font-sans">P&amp;L</div>
          <div
            class="text-sm font-mono font-bold"
            :class="calcTotalPnL() ? (calcTotalPnL()!.pnl >= 0 ? 'text-[#00c853]' : 'text-[#ff1744]') : ''"
          >
            {{ calcTotalPnL() ? '$' + calcTotalPnL()!.pnl.toFixed(2) : '...' }}
          </div>
        </div>
        <div>
          <div class="text-xs text-[#aaa] font-sans">Return</div>
          <div
            class="text-sm font-mono font-bold"
            :class="calcTotalPnL() ? (calcTotalPnL()!.pnlPercent >= 0 ? 'text-[#00c853]' : 'text-[#ff1744]') : ''"
          >
            {{ calcTotalPnL() ? calcTotalPnL()!.pnlPercent.toFixed(2) + '%' : '...' }}
          </div>
        </div>
      </div>
    </div>

    <div class="bg-[#111] border border-[#333] rounded overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-[#333] text-[#aaa] text-xs">
            <th class="text-left px-3 py-2 font-sans">SYMBOL</th>
            <th class="text-right px-3 py-2 font-sans">SHARES</th>
            <th class="text-right px-3 py-2 font-sans">AVG PRICE</th>
            <th class="text-right px-3 py-2 font-sans">CURRENT</th>
            <th class="text-right px-3 py-2 font-sans">P&amp;L</th>
            <th class="text-right px-3 py-2 font-sans">VALUE</th>
            <th class="text-right px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          <tr v-if="holdings.length === 0">
            <td colspan="7" class="text-center text-[#aaa] py-8 text-xs font-sans">
              No positions. Add one above.
            </td>
          </tr>
          <tr
            v-for="h in holdings"
            :key="h.id"
            class="border-b border-[#1a1a1a] hover:bg-[#1a1a1a]"
          >
            <td class="px-3 py-2 font-mono text-[#00c853]">{{ h.symbol }}</td>
            <td class="px-3 py-2 text-right font-mono">{{ h.shares }}</td>
            <td class="px-3 py-2 text-right font-mono">{{ '$' + h.avgPrice.toFixed(2) }}</td>
            <td class="px-3 py-2 text-right font-mono">
              {{ quotes[h.symbol] ? '$' + quotes[h.symbol].regularMarketPrice.toFixed(2) : '...' }}
            </td>
            <td
              class="px-3 py-2 text-right font-mono"
              :class="calcPnL(h) ? (calcPnL(h)!.pnl >= 0 ? 'text-[#00c853]' : 'text-[#ff1744]') : ''"
            >
              {{ calcPnL(h) ? '$' + calcPnL(h)!.pnl.toFixed(2) + ' (' + calcPnL(h)!.pnlPercent.toFixed(2) + '%)' : '...' }}
            </td>
            <td class="px-3 py-2 text-right font-mono">
              {{ calcPnL(h) ? '$' + calcPnL(h)!.currentValue.toFixed(2) : '...' }}
            </td>
            <td class="px-3 py-2 text-right">
              <button
                v-if="deletingId !== h.id"
                class="text-[#aaa] hover:text-[#ff1744] text-xs"
                @click="confirmDelete(h.id)"
              >
                ✕
              </button>
              <span v-else class="flex gap-1 text-xs">
                <button class="text-[#ff1744] font-bold" @click="deleteHolding(h.id)">DEL</button>
                <button class="text-[#aaa]" @click="cancelDelete">X</button>
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
