<template>
  <div class="min-h-screen bg-[#0a0a0a]">
    <header class="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-[#1a1a1a]">
      <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <NuxtLink to="/" class="text-[#00c853] font-bold text-xl tracking-wider">KALMATE⌘</NuxtLink>
        <div class="flex items-center gap-6">
          <NuxtLink to="/terminal" class="text-[#ccc] hover:text-white transition-colors text-sm">Terminal</NuxtLink>
          <NuxtLink to="/blog" class="text-[#ccc] hover:text-white transition-colors text-sm">Blog</NuxtLink>
          <NuxtLink to="/about" class="text-[#ccc] hover:text-white transition-colors text-sm">About</NuxtLink>
          <NuxtLink to="/contact" class="text-[#ccc] hover:text-white transition-colors text-sm">Contact</NuxtLink>
        </div>
      </div>
    </header>

    <main class="max-w-3xl mx-auto px-6 pt-32 pb-24">
      <div class="flex items-center gap-3 text-xs text-[#888] mb-4">
        <NuxtLink to="/blog" class="hover:text-white transition-colors">← Back to Blog</NuxtLink>
        <span class="w-1 h-1 rounded-full bg-[#555]" />
        <span>June 10, 2026</span>
        <span class="w-1 h-1 rounded-full bg-[#555]" />
        <span class="text-[#00c853]">Tutorial</span>
      </div>

      <h1 class="text-4xl md:text-5xl font-bold text-white mb-6">Understanding Market Indicators: SMA, EMA, and Kalman Filters</h1>

      <div class="prose prose-invert max-w-none text-[#ccc] leading-relaxed space-y-4">
        <p class="text-lg">
          Technical indicators help traders analyze market trends and make informed decisions. Here's a beginner-friendly guide to three popular indicators available in Kalmate.
        </p>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">Simple Moving Average (SMA)</h2>
        <p>
          The SMA calculates the average price over a specific period. For example, a 20-day SMA adds up the closing prices of the last 20 days and divides by 20.
        </p>
        <p>
          <strong class="text-white">Use case:</strong> Identify trend direction. When price is above the SMA, the trend is up. When below, the trend is down. Common periods are 20, 50, and 200 days.
        </p>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">Exponential Moving Average (EMA)</h2>
        <p>
          The EMA gives more weight to recent prices, making it more responsive to new information than the SMA. This helps traders react faster to price changes.
        </p>
        <p>
          <strong class="text-white">Use case:</strong> Short-term trading. The 12 and 26-day EMAs are commonly used together — when the 12-day crosses above the 26-day, it's a bullish signal.
        </p>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">Kalman Filter</h2>
        <p>
          The Kalman filter is a more advanced algorithm that estimates the true state of a noisy system. In financial markets, it smooths price data by filtering out market noise.
        </p>
        <p>
          <strong class="text-white">Use case:</strong> When you need a cleaner trend line. The Kalman filter adapts to volatility changes automatically, making it useful for both trending and ranging markets.
        </p>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">How to Use Them in Kalmate</h2>
        <p>
          Kalmate's <NuxtLink to="/terminal/pipeline" class="text-[#00c853] hover:underline">Pipeline</NuxtLink> feature lets you combine these indicators visually. Connect a data source node to SMA, EMA, or Kalman nodes, and see the results instantly on your charts.
        </p>
        <p>
          No coding required — just drag, connect, and analyze.
        </p>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'landing' })

useHead({
  title: 'Understanding SMA, EMA, and Kalman Filters — Kalmate Blog',
  meta: [
    { name: 'description', content: 'Learn about Simple Moving Average (SMA), Exponential Moving Average (EMA), and Kalman Filters — three essential technical indicators for market analysis and trading.' },
    { name: 'keywords', content: 'SMA, EMA, Kalman filter, technical indicators, moving average, trading indicators, market analysis, kalmate pipeline' },
  ],
})
</script>
