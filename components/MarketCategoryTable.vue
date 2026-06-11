<script setup lang="ts">
interface CategoryItem {
  symbol: string
  name: string
  price: number | null
  change: number | null
  changePercent: number | null
}

const props = defineProps<{
  title: string
  symbols: { symbol: string; name: string }[]
}>()

const items = ref<CategoryItem[]>([])
const loading = ref(true)
const error = ref(false)

async function fetchData() {
  loading.value = true
  error.value = false
  try {
    const syms = props.symbols.map(s => s.symbol).join(',')
    const data = await $fetch(`/api/quote?symbols=${syms}`)
    const arr = Array.isArray(data) ? data : [data]
    items.value = props.symbols.map((sym, i) => {
      const q = arr[i] || {}
      return {
        symbol: sym.symbol,
        name: sym.name,
        price: q.regularMarketPrice ?? null,
        change: q.regularMarketChange ?? null,
        changePercent: q.regularMarketChangePercent ?? null,
      }
    })
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
  setInterval(fetchData, 30000)
})
</script>

<template>
  <div>
    <div class="text-xs text-[#aaa] mb-2 tracking-wider flex items-center gap-2 font-sans">
      <span>{{ title }}</span>
      <span v-if="loading" class="text-[#555] animate-pulse-slow text-[10px] font-sans">updating...</span>
    </div>
    <div v-if="error" class="text-[#ff1744] text-xs py-6 text-center bg-[#111] border border-[#333] rounded">
      No data available
    </div>
    <div v-else class="bg-[#111] border border-[#333] rounded overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-[#333] text-[#aaa] text-xs">
            <th class="text-left px-3 py-2 font-sans">SYMBOL</th>
            <th class="text-left px-3 py-2 font-sans hidden sm:table-cell">NAME</th>
            <th class="text-right px-3 py-2 font-sans">PRICE</th>
            <th class="text-right px-3 py-2 font-sans">CHANGE</th>
            <th class="text-right px-3 py-2 font-sans hidden sm:table-cell">CHANGE %</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in items"
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
            <td class="px-3 py-2 text-[#bbb] text-xs hidden sm:table-cell font-sans">{{ item.name }}</td>
            <td class="px-3 py-2 text-right font-mono">
              {{ item.price != null ? '$' + item.price.toFixed(2) : '...' }}
            </td>
            <td
              class="px-3 py-2 text-right font-mono"
              :class="(item.change ?? 0) >= 0 ? 'text-[#00c853]' : 'text-[#ff1744]'"
            >
              {{ item.change != null ? (item.change >= 0 ? '+' : '') + item.change.toFixed(2) : '...' }}
            </td>
            <td
              class="px-3 py-2 text-right font-mono hidden sm:table-cell"
              :class="(item.changePercent ?? 0) >= 0 ? 'text-[#00c853]' : 'text-[#ff1744]'"
            >
              {{ item.changePercent != null ? (item.changePercent >= 0 ? '+' : '') + item.changePercent.toFixed(2) + '%' : '...' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
