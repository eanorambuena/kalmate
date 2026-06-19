<script setup lang="ts">
import type { AlertCondition } from '../utils/types'
import { useToast } from '../composables/useToast'

const { t } = useI18n()
const { add: addToast } = useToast()

const props = defineProps<{ refreshKey?: number }>()

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
const loading = ref(true)
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
      targetPrice.value = typeof q.regularMarketPrice === 'number' ? String(q.regularMarketPrice.toFixed(2)) : ''
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
  finally { loading.value = false }
}

async function addAlert() {
  if (!symbol.value || !targetPrice.value) {
    addToast(t('alerts.toast.fillFields'), 'error')
    return
  }
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
    addToast(t('alerts.toast.created'), 'success')
  } catch (e: any) {
    addToast(e?.data?.statusMessage || e?.message || t('alerts.toast.createFailed'), 'error')
    console.error(e)
  }
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
    addToast(t('alerts.toast.deleted'), 'success')
  } catch (e: any) {
    addToast(e?.data?.statusMessage || e?.message || t('alerts.toast.deleteFailed'), 'error')
    console.error(e)
  }
}

async function rearmAlert(id: string) {
  try {
    await $fetch(`/api/alerts/${id}`, {
      method: 'PATCH',
      body: { triggered: false },
    })
    await fetchAlerts()
    addToast(t('alerts.toast.reArmed'), 'success')
  } catch (e: any) {
    addToast(e?.data?.statusMessage || e?.message || t('alerts.toast.reArmFailed'), 'error')
    console.error(e)
  }
}

onMounted(fetchAlerts)

watch(() => props.refreshKey, () => {
  if (loading.value) return
  fetchAlerts()
})
</script>

<template>
  <div>
    <div class="bg-[#111] border border-[#2a2a2a] rounded-xl p-4 mb-4 card-hover">
      <div class="text-xs text-[#ccc] mb-3 tracking-wider font-sans" id="create-alert-label">{{ $t('alerts.form.create') }}</div>
      <div class="flex flex-wrap gap-2 items-center" role="form" aria-labelledby="create-alert-label">
        <div class="relative">
          <label for="alert-symbol" class="sr-only">{{ $t('alerts.form.symbolPlaceholder') }}</label>
          <input
            id="alert-symbol"
            v-model="symbol"
            :placeholder="$t('alerts.form.symbolPlaceholder')"
            class="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-sm w-24 text-white uppercase placeholder-[#555] focus:border-[#2979ff] focus:outline-none transition-colors font-sans"
          />
          <div class="mt-1">
            <div v-if="loadingPrice" class="text-[#999] text-[10px] animate-pulse">{{ $t('alerts.form.loadingPrice') }}</div>
            <div v-else-if="currentPrice" class="text-[#00c853] text-[10px] font-mono">${{ currentPrice.toFixed(2) }}</div>
          </div>
          <div
            v-if="showSearch && symbol.length > 0"
            class="absolute top-full left-0 mt-8 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-xl z-50 min-w-[240px] overflow-hidden"
          >
            <div v-if="searching" class="text-center text-[#ccc] py-2 text-xs">{{ $t('alerts.form.searching') }}</div>
            <button
              v-for="r in searchResults"
              :key="r.symbol"
              class="w-full text-left px-3 py-2 hover:bg-[#2a2a2a] border-b border-[#222] last:border-0 transition-colors"
              @mousedown="selectSearchResult(r.symbol)"
            >
              <span class="text-[#00c853] font-mono text-sm">{{ r.symbol }}</span>
              <span class="text-[#ccc] text-xs ml-2 font-sans">{{ r.exchange }}</span>
              <div v-if="r.shortname || r.longname" class="text-[#bbb] text-xs truncate font-sans">{{ r.shortname || r.longname }}</div>
            </button>
          </div>
        </div>
        <select
          v-model="type"
          class="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-sm text-white focus:border-[#2979ff] focus:outline-none transition-colors font-sans"
        >
          <option value="above">{{ $t('alerts.form.above') }}</option>
          <option value="below">{{ $t('alerts.form.below') }}</option>
        </select>
        <input
          v-model="targetPrice"
          :placeholder="$t('alerts.form.targetPlaceholder')"
          type="number"
          step="0.01"
          class="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-sm w-24 text-white placeholder-[#555] focus:border-[#2979ff] focus:outline-none transition-colors font-sans"
        />
        <button
          class="bg-[#ffd600] text-black px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-[#ffe040] hover:shadow-lg hover:shadow-[#ffd600]/20 active:scale-95 transition-all duration-200 font-sans"
          @click="addAlert"
        >
          {{ $t('alerts.form.create') }}
        </button>
      </div>
    </div>

    <div class="space-y-2">
      <div v-if="loading" class="space-y-2">
        <div v-for="i in 3" :key="i" class="bg-[#111] border border-[#2a2a2a] rounded-xl p-4">
          <div class="flex items-center gap-3">
            <div class="skeleton h-4 w-16" />
            <div class="skeleton h-4 w-24" />
            <div class="skeleton h-4 w-16 ml-auto" />
          </div>
        </div>
      </div>
      <div v-else-if="alerts.length === 0" class="text-center text-[#888] py-12 text-sm bg-[#111] border border-[#2a2a2a] rounded-xl">
        {{ $t('alerts.list.empty') }}
      </div>
      <div
        v-for="a in alerts"
        :key="a.id"
        class="bg-[#111] border rounded-xl p-4 flex items-center justify-between transition-all duration-200 card-hover"
        :class="a.triggered ? 'border-[#ffd600]' : 'border-[#2a2a2a]'"
      >
        <div class="flex items-center gap-3">
          <span class="text-[#00c853] font-mono font-bold">{{ a.symbol }}</span>
          <span
            class="text-sm font-mono font-medium"
            :class="a.type === 'above' ? 'text-[#00c853]' : 'text-[#ff1744]'"
          >
            {{ a.type === 'above' ? $t('alerts.list.above') : $t('alerts.list.below') }} ${{ a.targetPrice.toFixed(2) }}
          </span>
          <span
            v-if="a.triggered"
            class="text-[#ffd600] text-[10px] font-bold animate-pulse px-2 py-0.5 rounded-full bg-[#ffd600]/10 font-sans"
          >{{ $t('alerts.list.triggered') }}</span>
        </div>
        <div class="flex gap-1">
          <div v-if="a.triggered" class="flex gap-1">
            <button
              class="text-[#2979ff] font-bold text-xs px-2 py-1 rounded hover:bg-[#2979ff]/10 transition-colors font-sans"
              @click="rearmAlert(a.id)"
              :title="$t('alerts.list.reArmTitle')"
            >{{ $t('alerts.list.reArm') }}</button>
            <button
              class="text-[#888] hover:text-[#ff1744] text-xs transition-colors px-1"
              @click="deleteAlert(a.id)"
              :title="$t('alerts.list.deleteTitle')"
            >✕</button>
          </div>
          <template v-else>
            <button
              v-if="deletingId !== a.id"
              class="text-[#888] hover:text-[#ff1744] text-xs transition-colors px-1"
              @click="confirmDelete(a.id)"
              :title="$t('alerts.list.deleteTitle')"
            >✕</button>
            <span v-else class="flex gap-1 text-xs">
              <button class="text-[#ff1744] font-bold px-1.5 hover:text-[#ff5252] transition-colors font-sans" @click="deleteAlert(a.id)">{{ $t('alerts.list.del') }}</button>
              <button class="text-[#999] hover:text-[#ccc] px-1.5 transition-colors font-sans" @click="cancelDelete">{{ $t('alerts.list.cancel') }}</button>
            </span>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
