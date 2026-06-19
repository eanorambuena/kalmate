<script setup lang="ts">
const { t } = useI18n()

interface NewsItem {
  title: string
  link: string
  publisher?: string
  publishedDate?: string
  summary?: string
}

const { data, pending, refresh } = await useAsyncData(
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
  if (diff < 60) return t('news.time.justNow')
  if (diff < 3600) return t('news.time.minAgo', { m: Math.floor(diff / 60) })
  if (diff < 86400) return t('news.time.hourAgo', { h: Math.floor(diff / 3600) })
  return t('news.time.dayAgo', { d: Math.floor(diff / 86400) })
}

onMounted(() => {
  let interval: ReturnType<typeof setInterval>
  function start() { interval = setInterval(() => refresh(), 300000) }
  function stop() { clearInterval(interval) }
  start()
  function onVisibility() {
    if (document.hidden) stop()
    else { refresh(); start() }
  }
  document.addEventListener('visibilitychange', onVisibility)
  onUnmounted(() => {
    stop()
    document.removeEventListener('visibilitychange', onVisibility)
  })
})
</script>

<template>
  <div>
    <div class="text-xs text-[#ccc] mb-2 tracking-wider font-sans flex items-center gap-2" aria-live="polite">
      <span>{{ $t('news.heading') }}</span>
      <span v-if="pending" class="inline-block w-2 h-2 rounded-full bg-[#2979ff] animate-pulse" :aria-label="$t('news.loadingLabel')" />
    </div>
    <div class="bg-[#111] border border-[#2a2a2a] rounded-xl overflow-hidden card-hover" :aria-label="$t('news.containerLabel')">
      <div v-if="pending && news.length === 0" class="divide-y divide-[#1a1a1a]" :aria-label="$t('news.loadingLabel')">
        <div v-for="i in 5" :key="i" class="px-3 py-3">
          <div class="skeleton h-4 w-full mb-2" />
          <div class="skeleton h-4 w-3/4 mb-2" />
          <div class="skeleton h-3 w-24" />
        </div>
      </div>
      <div v-else-if="news.length === 0" class="text-center text-[#888] py-10 text-sm">
        {{ $t('news.empty') }}
      </div>
      <div v-else class="divide-y divide-[#1a1a1a]">
        <a
          v-for="(item, i) in news"
          :key="item.link"
          :href="item.link"
          target="_blank"
          rel="noopener noreferrer"
          class="block px-3 py-2.5 hover:bg-[#1a1a1a] transition-colors"
          :aria-label="`${item.title} - by ${item.publisher || 'unknown'}`"
        >
          <div class="text-sm text-white line-clamp-2 font-sans leading-snug">{{ item.title }}</div>
          <div class="flex items-center gap-2 mt-1">
            <span v-if="item.publisher" class="text-[#00c853] text-[10px] font-sans font-medium">{{ item.publisher }}</span>
            <span class="text-[#888] text-[10px] font-sans">{{ timeAgo(item.publishedDate) }}</span>
          </div>
        </a>
      </div>
    </div>
  </div>
</template>
