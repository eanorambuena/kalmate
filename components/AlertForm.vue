<script setup lang="ts">
import type { AlertCondition } from '../utils/types'

const alerts = ref<AlertCondition[]>([])
const symbol = ref('')
const type = ref<'above' | 'below'>('above')
const targetPrice = ref('')
const currentPrice = ref<number | null>(null)
const loadingPrice = ref(false)
const deletingId = ref<string | null>(null)
const searchResults = ref<any[]>([])
const searching = ref(false)
const showSearch = ref(false)
let searchTimer: ReturnType<typeof setTimeout>

async function fetchCurrentPrice() {
  if (!symbol.value) {
    currentPrice.value = null
    return
  }
  loadingPrice.value = true
  try {
    const data = await $fetch(`/api/quote?symbol=${symbol.value}`)
    const q = data as { regularMarketPrice: number }
    currentPrice.value = q.regularMarketPrice
    if (!targetPrice.value) {
      targetPrice.value = String(q.regularMarketPrice.toFixed(2))
    }
  } catch (e) {
    console.error(e)
    currentPrice.value = null
  } finally {
    loadingPrice.value = false
  }
}

let priceTimer: ReturnType<typeof setTimeout>
watch(symbol, () => {
  clearTimeout(priceTimer)
  clearTimeout(searchTimer)
  if (!symbol.value) { currentPrice.value = null; searchResults.value = []; showSearch.value = false; return }
  priceTimer = setTimeout(fetchCurrentPrice, 500)
  searching.value = true
  searchTimer = setTimeout(async () => {
    try {
      const data = await $fetch(`/api/search?q=${encodeURIComponent(symbol.value)}`)
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

function selectSearchResult(sym: string) {
  symbol.value = sym
  searchResults.value = []
  showSearch.value = false
}

async function fetchAlerts() {
  try {
    const data = await $fetch('/api/alerts')
    alerts.value = data as AlertCondition[]
  } catch { /* ignore */ }
}

async function addAlert() {
  if (!symbol.value || !targetPrice.value) return
  try {
    await $fetch('/api/alerts', {
      method: 'POST',
      body: {
        symbol: symbol.value.toUpperCase(),
        type: type.value,
        targetPrice: Number(targetPrice.value),
      },
    })
    symbol.value = ''
    targetPrice.value = ''
    await fetchAlerts()
  } catch (e) { console.error(e) }
}

function confirmDelete(id: string) {
  deletingId.value = id
}

function cancelDelete() {
  deletingId.value = null
}

async function deleteAlert(id: string) {
  try {
    await $fetch(`/api/alerts/${id}`, { method: 'DELETE' })
    deletingId.value = null
    await fetchAlerts()
  } catch (e) { console.error(e) }
}

onMounted(fetchAlerts)
</script>

<template>
  <div>
    <div class="bg-[#111] border border-[#333] rounded p-3 mb-4">
      <div class="text-xs text-[#aaa] mb-3 tracking-wider font-sans">CREATE ALERT</div>
      <div class="flex flex-wrap gap-2 items-center">
        <div class="relative">
          <input
            v-model="symbol"
            placeholder="SYMBOL"
            class="bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-sm w-24 text-white uppercase font-sans"
          />
          <div v-if="loadingPrice" class="text-[#aaa] text-xs mt-1">Loading...</div>
          <div v-else-if="currentPrice" class="text-[#bbb] text-xs mt-1 font-sans">Current: {{ '$' + currentPrice.toFixed(2) }}</div>
          <div
            v-if="showSearch && symbol.length > 0"
            class="absolute top-full left-0 mt-7 bg-[#1a1a1a] border border-[#333] rounded shadow-xl z-50 min-w-[240px]"
          >
            <div v-if="searching" class="text-center text-[#aaa] py-2 text-xs">Searching...</div>
            <button
              v-for="r in searchResults"
              :key="r.symbol"
              class="w-full text-left px-3 py-2 hover:bg-[#2a2a2a] border-b border-[#222] last:border-0"
              @mousedown="selectSearchResult(r.symbol)"
            >
              <span class="text-[#00c853] font-mono text-sm">{{ r.symbol }}</span>
              <span class="text-[#aaa] text-xs ml-2 font-sans">{{ r.exchange }}</span>
              <div v-if="r.shortname || r.longname" class="text-[#bbb] text-xs truncate font-sans">{{ r.shortname || r.longname }}</div>
            </button>
          </div>
        </div>
        <select
          v-model="type"
          class="bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-sm text-white font-sans"
        >
          <option value="above">ABOVE</option>
          <option value="below">BELOW</option>
        </select>
        <input
          v-model="targetPrice"
          placeholder="PRICE"
          type="number"
          step="0.01"
          class="bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-sm w-24 text-white font-sans"
        />
        <button
          class="bg-[#ffd600] text-black px-3 py-1 rounded text-sm font-bold hover:bg-[#ffe040] transition-colors font-sans"
          @click="addAlert"
        >
          CREATE
        </button>
      </div>
    </div>

    <div class="space-y-2">
      <div v-if="alerts.length === 0" class="text-center text-[#aaa] py-8 text-xs">
        No alerts configured.
      </div>
      <div
        v-for="a in alerts"
        :key="a.id"
        class="bg-[#111] border rounded p-3 flex items-center justify-between"
        :class="a.triggered ? 'border-[#ffd600]' : 'border-[#333]'"
      >
        <div class="flex items-center gap-3">
          <span class="text-[#00c853] font-mono font-bold">{{ a.symbol }}</span>
          <span
            class="text-xs font-mono"
            :class="a.type === 'above' ? 'text-[#00c853]' : 'text-[#ff1744]'"
          >
            {{ a.type === 'above' ? '>' : '<' }} {{ '$' + a.targetPrice.toFixed(2) }}
          </span>
          <span
            v-if="a.triggered"
            class="text-[#ffd600] text-xs font-bold animate-pulse font-sans"
          >TRIGGERED</span>
        </div>
        <button
          v-if="deletingId !== a.id"
          class="text-[#aaa] hover:text-[#ff1744] text-xs"
          @click="confirmDelete(a.id)"
        >
          ✕
        </button>
        <span v-else class="flex gap-1 text-xs">
          <button class="text-[#ff1744] font-bold font-sans" @click="deleteAlert(a.id)">DEL</button>
                <button class="text-[#aaa] font-sans" @click="cancelDelete">X</button>
        </span>
      </div>
    </div>
  </div>
</template>
