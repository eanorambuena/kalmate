<script setup lang="ts">
interface NewsItem {
  title: string
  link: string
  publisher?: string
  publishedDate?: string
  summary?: string
}

const { data, pending } = await useAsyncData(
  'market-news',
  async () => {
    const result = await $fetch('/api/news')
    return (result as NewsItem[]).slice(0, 8)
  },
  { default: () => [] }
)

const news = computed(() => data.value)

function timeAgo(dateStr?: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

onMounted(() => {
  const interval = setInterval(() => refresh(), 120000)
  onUnmounted(() => clearInterval(interval))
})
</script>

<template>
  <div>
    <div class="text-xs text-[#aaa] mb-2 tracking-wider font-sans">MARKET NEWS</div>
    <div class="bg-[#111] border border-[#333] rounded overflow-hidden">
      <div v-if="pending" class="text-center text-[#aaa] py-8 text-xs animate-pulse-slow">
        Loading news...
      </div>
      <div v-else class="divide-y divide-[#1a1a1a]">
        <a
          v-for="item in news"
          :key="item.link"
          :href="item.link"
          target="_blank"
          rel="noopener noreferrer"
          class="block px-3 py-2 hover:bg-[#1a1a1a] transition-colors"
        >
          <div class="text-sm text-white line-clamp-2 font-sans">{{ item.title }}</div>
          <div class="flex items-center gap-2 mt-1">
            <span v-if="item.publisher" class="text-[#00c853] text-[10px] font-sans">{{ item.publisher }}</span>
            <span class="text-[#555] text-[10px] font-sans">{{ timeAgo(item.publishedDate) }}</span>
          </div>
        </a>
      </div>
    </div>
  </div>
</template>
