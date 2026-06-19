<template>
  <div class="min-h-screen bg-[#0a0a0a]">
    <Header />

    <main class="max-w-3xl mx-auto px-6 pt-24 pb-24">
      <div class="flex items-center gap-3 text-xs text-[#888] mb-4">
        <NuxtLink to="/blog" class="hover:text-white transition-colors">← {{ $t('common.back') }}</NuxtLink>
        <span class="w-1 h-1 rounded-full bg-[#555]" />
        <span>{{ $t('blogPosts.terminal.date') }}</span>
        <span class="w-1 h-1 rounded-full bg-[#555]" />
        <span class="text-[#00c853]">{{ $t('blogPosts.terminal.category') }}</span>
      </div>

      <h1 class="text-4xl md:text-5xl font-bold text-white mb-6">{{ $t('blogPosts.terminal.title') }}</h1>

      <div class="prose prose-invert max-w-none text-[#ccc] leading-relaxed space-y-4">
        <p class="text-lg">
          {{ $t('blogPosts.terminal.intro') }}
        </p>

        <p>
          {{ $t('blogPosts.terminal.intro2') }}
        </p>

        <div class="bg-[#111] border border-[#222] rounded-xl p-6 my-8">
          <h3 class="text-[#00c853] text-sm font-mono tracking-widest mb-3">{{ $t('blogPosts.terminal.costComparison') }}</h3>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div class="bg-[#0a0a0a] rounded-lg p-4 border border-[#222]">
              <div class="text-[#888] mb-1">{{ $t('blogPosts.terminal.bloomberg.label') }}</div>
              <div class="text-white text-2xl font-bold">{{ $t('blogPosts.terminal.bloomberg.price') }}</div>
              <div class="text-[#888] text-xs">{{ $t('blogPosts.terminal.bloomberg.caption') }}</div>
            </div>
            <div class="bg-[#0a0a0a] rounded-lg p-4 border border-[#00c853]/30">
              <div class="text-[#888] mb-1">{{ $t('blogPosts.terminal.kalmate.label') }}</div>
              <div class="text-[#00c853] text-2xl font-bold">{{ $t('blogPosts.terminal.kalmate.price') }}</div>
              <div class="text-[#888] text-xs">{{ $t('blogPosts.terminal.kalmate.caption') }}</div>
            </div>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">{{ $t('blogPosts.terminal.dataCoverage') }}</h2>
        <p>
          Kalmate tracks <strong class="text-white">{{ $t('blogPosts.terminal.symbols') }}</strong> across <strong class="text-white">{{ $t('blogPosts.terminal.assetClasses') }}</strong> out of the box, with full search across thousands more via Yahoo Finance:
        </p>

        <div class="bg-[#111] border border-[#222] rounded-xl p-6 my-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div v-for="section in dataSections" :key="section.heading">
              <h4 class="text-[#2979ff] font-bold mb-2">{{ section.heading }}</h4>
              <div class="text-[#ccc] space-y-1">
                <div>{{ section.items.join(', ') }}</div>
              </div>
            </div>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">{{ $t('blogPosts.terminal.tryNow') }}</h2>
        <p>
          Open <NuxtLink to="/terminal/stock/AAPL" class="text-[#00c853] hover:underline">Kalmate's AAPL page</NuxtLink> right now. You'll see the current price, daily change, and a candlestick chart with 6 time ranges (1d to 1y). The price refreshes every <strong class="text-white">30 seconds</strong>. Come back in a few minutes and watch it update.
        </p>

        <div class="bg-[#0a0a0a] border border-[#222] rounded-xl p-4 my-6 font-mono text-xs">
          <div class="text-[#888] mb-2">// Live data flow</div>
          <div class="text-[#ccc]">Kalmate → Yahoo Finance → Real-time quote → Your browser</div>
          <div class="text-[#888] mt-2">// Cache refresh cycle</div>
          <div class="text-[#ccc]">Quotes: 30s | History: 5min | News: 5min | Search: 10min</div>
        </div>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">{{ $t('blogPosts.terminal.coreFeatures') }}</h2>
        <ul class="list-disc pl-6 space-y-2">
          <li v-for="feature in terminalFeatures" :key="feature.heading">
            <strong class="text-white">{{ feature.heading }}</strong> — {{ feature.desc }}
          </li>
        </ul>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">{{ $t('blogPosts.terminal.pipelineSuperpower') }}</h2>
        <p>
          {{ $t('blogPosts.terminal.pipelineDesc') }}
        </p>
        <p>
          {{ $t('blogPosts.terminal.pipelineDesc2') }}
        </p>

        <div class="bg-[#111] border border-[#222] rounded-xl p-6 my-6">
          <h3 class="text-[#00c853] text-sm font-mono tracking-widest mb-3">{{ $t('blogPosts.terminal.pipelineNodes') }}</h3>
          <div class="grid grid-cols-3 gap-3 text-xs">
            <div v-for="cat in nodeCategories" :key="cat.label" class="bg-[#0a0a0a] rounded-lg p-3 border border-[#2979ff]/30">
              <div class="text-[#2979ff] font-bold">{{ cat.label }}</div>
              <div class="text-[#ccc] mt-1">{{ cat.items }}</div>
            </div>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">{{ $t('blogPosts.terminal.openSource') }}</h2>
        <p>
          {{ $t('blogPosts.terminal.openSourceDesc') }}
        </p>
        <p>
          {{ $t('blogPosts.terminal.closing') }}
        </p>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'landing' })

const { t } = useI18n()

const dataSections = computed(() => t('blogPosts.terminal.sections'))
const terminalFeatures = computed(() => t('blogPosts.terminal.features'))
const nodeCategories = computed(() => t('blogPosts.terminal.nodeCategories'))

useHead({
  title: computed(() => t('blogPosts.terminal.title')),
  meta: [
    { name: 'description', content: computed(() => t('blogPosts.terminal.intro')) },
    { name: 'keywords', content: 'financial terminal, bloomberg alternative, free market data, kalmate, yahoo finance terminal, real-time stock quotes, visual pipeline' },
  ],
})
</script>
