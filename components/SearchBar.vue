<script setup lang="ts">
interface SearchResult {
  symbol: string
  shortname?: string
  longname?: string
  exchange?: string
  quoteType?: string
}

const router = useRouter()
const query = ref('')
const results = ref<SearchResult[]>([])
const isOpen = ref(false)
const searching = ref(false)
const noResults = ref(false)
let debounceTimer: ReturnType<typeof setTimeout>

watch(query, (newVal) => {
  clearTimeout(debounceTimer)
  noResults.value = false
  if (newVal.length < 1) {
    results.value = []
    isOpen.value = false
    return
  }
  searching.value = true
  debounceTimer = setTimeout(async () => {
    try {
      const data = await $fetch(`/api/search?q=${encodeURIComponent(newVal)}`)
      results.value = (data as SearchResult[]).slice(0, 8)
      noResults.value = results.value.length === 0
      isOpen.value = true
    } catch (e) {
      console.error(e)
      results.value = []
      noResults.value = true
      isOpen.value = true
    } finally {
      searching.value = false
    }
  }, 300)
})

function selectSymbol(symbol: string) {
  query.value = ''
  results.value = []
  isOpen.value = false
  noResults.value = false
  router.push(`/terminal/stock/${symbol}`)
}
</script>

<template>
  <div class="relative w-full max-w-md">
    <input
      v-model="query"
      type="text"
      :placeholder="$t('search.placeholder')"
      :aria-label="$t('search.inputLabel')"
      role="combobox"
      aria-expanded="isOpen && results.length > 0"
      aria-autocomplete="list"
      aria-controls="search-results"
      aria-activedescendant=""
      class="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-1.5 text-sm text-white placeholder-[#888] focus:outline-none focus:border-[#00c853] font-sans"
      @focus="isOpen = true"
      @blur="setTimeout(() => { isOpen = false; noResults = false }, 200)"
    />
    <div
      v-if="isOpen && query.length > 0"
      id="search-results"
      role="listbox"
      :aria-label="$t('search.resultsLabel')"
      class="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-[#333] rounded shadow-xl z-50 max-h-80 overflow-y-auto"
    >
      <div v-if="searching" class="text-center text-[#ccc] py-3 text-xs" aria-live="polite">
        {{ $t('search.searching') }}
      </div>
      <div v-else-if="noResults" class="text-center text-[#ccc] py-3 text-xs" aria-live="polite">
        {{ $t('search.noResults', { query }) }}
      </div>
      <button
        v-for="r in results"
        :key="r.symbol"
        role="option"
        :aria-label="`${r.symbol} - ${r.shortname || r.longname || ''} on ${r.exchange || ''}`"
        class="w-full text-left px-3 py-2 hover:bg-[#2a2a2a] border-b border-[#222] last:border-0"
        @mousedown="selectSymbol(r.symbol)"
      >
        <div class="flex items-center justify-between">
          <span class="text-[#00c853] font-mono text-sm">{{ r.symbol }}</span>
          <span class="text-[#ccc] text-xs font-sans">{{ r.exchange }}</span>
        </div>
        <div v-if="r.shortname || r.longname" class="text-[#bbb] text-xs truncate font-sans">
          {{ r.shortname || r.longname }}
        </div>
      </button>
    </div>
  </div>
</template>
