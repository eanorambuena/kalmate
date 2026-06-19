<template>
  <div class="min-h-screen bg-[#0a0a0a]">
    <Header />

    <main class="max-w-3xl mx-auto px-6 pt-24 pb-24">
      <div class="flex items-center gap-3 text-xs text-[#888] mb-4">
        <NuxtLink to="/blog" class="hover:text-white transition-colors">← {{ $t('common.back') }}</NuxtLink>
        <span class="w-1 h-1 rounded-full bg-[#555]" />
        <span>{{ $t('blogPosts.indicators.date') }}</span>
        <span class="w-1 h-1 rounded-full bg-[#555]" />
        <span class="text-[#00c853]">{{ $t('blogPosts.indicators.category') }}</span>
      </div>

      <h1 class="text-4xl md:text-5xl font-bold text-white mb-6">{{ $t('blogPosts.indicators.title') }}</h1>

      <div class="prose prose-invert max-w-none text-[#ccc] leading-relaxed space-y-4">
        <p class="text-lg">
          {{ $t('blogPosts.indicators.intro') }}
        </p>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">{{ $t('blogPosts.indicators.sma.heading') }}</h2>
        <p>
          {{ $t('blogPosts.indicators.sma.text') }}
        </p>

        <div class="bg-[#111] border border-[#222] rounded-xl p-6 my-6">
          <h3 class="text-[#2979ff] text-sm font-mono tracking-widest mb-3">{{ $t('blogPosts.indicators.sma.stepByStep') }}</h3>
          <p class="text-xs text-[#888] mb-3">{{ $t('blogPosts.indicators.sma.tableCaption') }}</p>
          <div class="overflow-x-auto">
            <table class="text-xs w-full">
              <thead>
                <tr class="text-[#888] border-b border-[#222]">
                  <th class="text-left py-2 pr-4">{{ smaHeaders[0] }}</th>
                  <th class="text-right py-2 pr-4">{{ smaHeaders[1] }}</th>
                  <th class="text-right py-2 pr-4">{{ smaHeaders[2] }}</th>
                  <th class="text-left py-2 pl-4 text-[#555]">{{ smaHeaders[3] }}</th>
                </tr>
              </thead>
              <tbody class="text-[#ccc]">
                <tr class="border-b border-[#1a1a1a]">
                  <td class="py-2 pr-4">1</td>
                  <td class="text-right py-2 pr-4">100</td>
                  <td class="text-right py-2 pr-4 text-[#555]">—</td>
                  <td class="text-left py-2 pl-4 text-[#555]">{{ $t('blogPosts.indicators.sma.notEnoughData') }}</td>
                </tr>
                <tr class="border-b border-[#1a1a1a]">
                  <td class="py-2 pr-4">2</td>
                  <td class="text-right py-2 pr-4">102</td>
                  <td class="text-right py-2 pr-4 text-[#555]">—</td>
                  <td class="text-left py-2 pl-4 text-[#555]">{{ $t('blogPosts.indicators.sma.notEnoughData') }}</td>
                </tr>
                <tr class="border-b border-[#1a1a1a]">
                  <td class="py-2 pr-4">3</td>
                  <td class="text-right py-2 pr-4">101</td>
                  <td class="text-right py-2 pr-4 text-[#00c853]">101.00</td>
                  <td class="text-left py-2 pl-4">(100 + 102 + 101) ÷ 3</td>
                </tr>
                <tr class="border-b border-[#1a1a1a]">
                  <td class="py-2 pr-4">4</td>
                  <td class="text-right py-2 pr-4">103</td>
                  <td class="text-right py-2 pr-4 text-[#00c853]">102.00</td>
                  <td class="text-left py-2 pl-4">(102 + 101 + 103) ÷ 3</td>
                </tr>
                <tr>
                  <td class="py-2 pr-4">5</td>
                  <td class="text-right py-2 pr-4">105</td>
                  <td class="text-right py-2 pr-4 text-[#00c853]">103.00</td>
                  <td class="text-left py-2 pl-4">(101 + 103 + 105) ÷ 3</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <p>
          {{ $t('blogPosts.indicators.sma.note') }}
        </p>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">{{ $t('blogPosts.indicators.ema.heading') }}</h2>
        <p>
          {{ $t('blogPosts.indicators.ema.text') }}
        </p>

        <div class="bg-[#111] border border-[#222] rounded-xl p-6 my-6">
          <h3 class="text-[#2979ff] text-sm font-mono tracking-widest mb-3">{{ $t('blogPosts.indicators.ema.stepByStep') }}</h3>
          <p class="text-xs text-[#888] mb-3">{{ $t('blogPosts.indicators.ema.tableCaption') }}</p>
          <div class="overflow-x-auto">
            <table class="text-xs w-full">
              <thead>
                <tr class="text-[#888] border-b border-[#222]">
                  <th class="text-left py-2 pr-4">{{ emaHeaders[0] }}</th>
                  <th class="text-right py-2 pr-4">{{ emaHeaders[1] }}</th>
                  <th class="text-right py-2 pr-4">{{ emaHeaders[2] }}</th>
                  <th class="text-left py-2 pl-4 text-[#555]">{{ emaHeaders[3] }}</th>
                </tr>
              </thead>
              <tbody class="text-[#ccc]">
                <tr class="border-b border-[#1a1a1a]">
                  <td class="py-2 pr-4">1</td>
                  <td class="text-right py-2 pr-4">100</td>
                  <td class="text-right py-2 pr-4 text-[#555]">—</td>
                  <td class="text-left py-2 pl-4 text-[#555]">{{ $t('blogPosts.indicators.ema.seed') }}</td>
                </tr>
                <tr class="border-b border-[#1a1a1a]">
                  <td class="py-2 pr-4">2</td>
                  <td class="text-right py-2 pr-4">102</td>
                  <td class="text-right py-2 pr-4 text-[#555]">—</td>
                  <td class="text-left py-2 pl-4 text-[#555]">{{ $t('blogPosts.indicators.ema.seed') }}</td>
                </tr>
                <tr class="border-b border-[#1a1a1a]">
                  <td class="py-2 pr-4">3</td>
                  <td class="text-right py-2 pr-4">101</td>
                  <td class="text-right py-2 pr-4 text-[#00c853]">101.00</td>
                  <td class="text-left py-2 pl-4">{{ $t('blogPosts.indicators.ema.seedFormula') }}</td>
                </tr>
                <tr class="border-b border-[#1a1a1a]">
                  <td class="py-2 pr-4">4</td>
                  <td class="text-right py-2 pr-4">103</td>
                  <td class="text-right py-2 pr-4 text-[#00c853]">102.00</td>
                  <td class="text-left py-2 pl-4">103 × 0.5 + 101 × 0.5</td>
                </tr>
                <tr>
                  <td class="py-2 pr-4">5</td>
                  <td class="text-right py-2 pr-4">105</td>
                  <td class="text-right py-2 pr-4 text-[#00c853]">103.50</td>
                  <td class="text-left py-2 pl-4">105 × 0.5 + 102 × 0.5</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <p>
          {{ $t('blogPosts.indicators.ema.note') }}
        </p>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">{{ $t('blogPosts.indicators.kalman.heading') }}</h2>
        <p>
          {{ $t('blogPosts.indicators.kalman.text') }}
        </p>

        <div class="bg-[#0a0a0a] border border-[#222] rounded-xl p-4 my-6 font-mono text-xs">
          <div class="text-[#888] mb-2">// Kalman Filter — Schwartz-Smith 2-Factor Model</div>
          <div class="text-[#ccc]">state = { trend, cycle }</div>
          <div class="text-[#ccc]">predict: trend[t] = phi × trend[t-1] + noise</div>
          <div class="text-[#ccc]">update: state[t] = predict + KalmanGain × (price - predict)</div>
          <div class="text-[#888] mt-2">{{ $t('blogPosts.indicators.kalman.defaultParams') }}</div>
          <div class="text-[#ccc]">{ phi: 0.9, mu: 0.0001, sigmaChi: 0.02, sigmaXi: 0.005 }</div>
        </div>

        <p>
          {{ $t('blogPosts.indicators.kalman.note') }}
        </p>

        <div class="bg-[#111] border border-[#222] rounded-xl p-6 my-6">
          <h3 class="text-[#00c853] text-sm font-mono tracking-widest mb-3">{{ $t('blogPosts.indicators.comparison.heading') }}</h3>
          <div class="space-y-4 text-sm">
            <div v-for="item in comparisonItems" :key="item.indicator" class="flex gap-4 bg-[#0a0a0a] rounded-lg p-4">
              <div class="font-bold shrink-0 w-12" :class="{ 'text-[#2979ff]': item.indicator === 'SMA', 'text-[#00c853]': item.indicator === 'EMA', 'text-[#ff69b4]': item.indicator === 'Kalman' }">{{ item.indicator }}</div>
              <div class="text-[#ccc]">{{ item.desc }}</div>
            </div>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">{{ $t('blogPosts.indicators.tryPipeline.heading') }}</h2>
        <p>
          {{ $t('blogPosts.indicators.tryPipeline.text') }}
        </p>
        <ol class="list-decimal pl-6 space-y-2">
          <li v-for="(step, i) in pipelineSteps" :key="i">
            <span v-html="step" />
          </li>
        </ol>
        <p class="mt-4">
          {{ $t('blogPosts.indicators.tryPipeline.text2') }}
        </p>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'landing' })

const { t } = useI18n()

const smaHeaders = computed(() => t('blogPosts.indicators.sma.tableHeaders'))
const emaHeaders = computed(() => t('blogPosts.indicators.ema.tableHeaders'))
const comparisonItems = computed(() => t('blogPosts.indicators.comparison.items'))
const pipelineSteps = computed(() => t('blogPosts.indicators.tryPipeline.steps'))

useHead({
  title: computed(() => t('blogPosts.indicators.title')),
  meta: [
    { name: 'description', content: computed(() => t('blogPosts.indicators.intro')) },
    { name: 'keywords', content: 'SMA, EMA, Kalman filter, technical indicators, moving average, trading indicators, kalmate pipeline, market analysis' },
  ],
})
</script>
