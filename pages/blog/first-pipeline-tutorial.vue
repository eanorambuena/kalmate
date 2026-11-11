<template>
  <div class="min-h-screen bg-[#0a0a0a]">
    <Header />

    <main class="max-w-3xl mx-auto px-6 pt-24 pb-24">
      <div class="flex items-center gap-3 text-xs text-[#888] mb-4">
        <NuxtLink to="/blog" class="hover:text-white transition-colors">← Back to Blog</NuxtLink>
        <span class="w-1 h-1 rounded-full bg-[#555]" />
        <span>June 21, 2026</span>
        <span class="w-1 h-1 rounded-full bg-[#555]" />
        <span class="text-[#00c853]">Tutorial</span>
      </div>

      <h1 class="text-4xl md:text-5xl font-bold text-white mb-6">Your First Pipeline: Symbol → Price Feed → Kalman Filter → Chart</h1>

      <div class="prose prose-invert max-w-none text-[#ccc] leading-relaxed space-y-4">
        <p class="text-lg">
          Kalmate's <NuxtLink to="/terminal/pipeline" class="text-[#00c853] hover:underline">Pipeline</NuxtLink> lets you build visual data workflows by connecting nodes, no code required. In this tutorial you'll build a pipeline that loads AAPL price history, smooths it with a Kalman Filter, and plots the result on a chart.
        </p>

        <div class="bg-[#111] border border-[#222] rounded-xl p-6 my-8">
          <h3 class="text-[#00c853] text-sm font-mono tracking-widest mb-3">WHAT YOU'LL BUILD</h3>
          <div class="flex items-center gap-2 text-sm text-[#ccc] flex-wrap">
            <span class="bg-[#2979ff]/20 border border-[#2979ff]/30 px-3 py-1 rounded">Symbol</span>
            <span class="text-[#555]">→</span>
            <span class="bg-[#2979ff]/20 border border-[#2979ff]/30 px-3 py-1 rounded">Price Feed</span>
            <span class="text-[#555]">→</span>
            <span class="bg-[#00c853]/20 border border-[#00c853]/30 px-3 py-1 rounded">Kalman Filter</span>
            <span class="text-[#555]">→</span>
            <span class="bg-[#ff69b4]/20 border border-[#ff69b4]/30 px-3 py-1 rounded">Chart</span>
          </div>
          <p class="text-[#888] text-xs mt-3">Result: a price chart with the smoothed level drawn over the actual closes.</p>
        </div>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">Step 1: Open the Pipeline Editor</h2>
        <p>Go to <NuxtLink to="/terminal/pipeline" class="text-[#00c853] hover:underline">/terminal/pipeline</NuxtLink>. You'll see a blank canvas and a palette of nodes grouped as Input, Process and Output.</p>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">Step 2: Add a Symbol Node</h2>
        <ol class="list-decimal pl-6 space-y-2">
          <li>Drag <strong class="text-white">Symbol</strong> from the Input group onto the canvas.</li>
          <li>Click the node and set its <strong>Ticker</strong> to <code class="bg-[#0a0a0a] px-1.5 py-0.5 rounded text-[#00c853] font-mono">AAPL</code>.</li>
        </ol>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">Step 3: Add a Price Feed Node</h2>
        <p>Price Feed fetches the latest price and up to 5 years of daily history for the symbol. It has three outputs: Price, Price Series and Candle Series. This tutorial uses Price Series.</p>
        <ol class="list-decimal pl-6 space-y-2">
          <li>Drag <strong class="text-white">Price Feed</strong> onto the canvas, to the right of Symbol.</li>
          <li>Connect Symbol's <strong>Symbol</strong> output to Price Feed's <strong>Symbol</strong> input.</li>
        </ol>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">Step 4: Add a Kalman Filter Node</h2>
        <p>The Kalman Filter estimates the underlying level of a noisy price series. Its deviation output shows how far the price sits from that level.</p>
        <ol class="list-decimal pl-6 space-y-2">
          <li>Drag <strong class="text-white">Kalman Filter</strong> onto the canvas, to the right of Price Feed.</li>
          <li>Connect Price Feed's <strong>Price Series</strong> output to the Kalman Filter's input.</li>
          <li>Keep <strong>Smoothing</strong> at <code class="bg-[#0a0a0a] px-1.5 py-0.5 rounded text-[#00c853] font-mono">Balanced</code>. Responsive follows the price more closely; Smooth lags more and removes more noise.</li>
        </ol>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">Step 5: Add a Chart</h2>
        <ol class="list-decimal pl-6 space-y-2">
          <li>Drag <strong class="text-white">Chart</strong> from the Output group onto the canvas.</li>
          <li>Connect Price Feed's <strong>Price Series</strong> output to the Chart's <strong>Main Series</strong> input.</li>
          <li>Connect the Kalman Filter's <strong>Smoothed</strong> output to <strong>Overlay A</strong>.</li>
        </ol>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">Step 6: Run the Pipeline</h2>
        <p>Click the <strong class="text-[#00c853]">▶ Run</strong> button in the toolbar. Within seconds:</p>
        <ul class="list-disc pl-6 space-y-2">
          <li>Price Feed loads the AAPL history.</li>
          <li>Kalman Filter outputs the smoothed level and the deviation from it.</li>
          <li>The Chart draws the price with the smoothed line over it.</li>
        </ul>

        <div class="bg-[#111] border border-[#222] rounded-xl p-6 my-8">
          <h3 class="text-[#00c853] text-sm font-mono tracking-widest mb-3">TIP: Try the Smoothing Options</h3>
          <p class="text-[#ccc] text-sm">Switch <strong class="text-white">Smoothing</strong> between Responsive, Balanced and Smooth and watch how the overlay follows the price. The Kalman Filter adapts its estimate to the data, so no manual noise settings are needed.</p>
        </div>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">What's Next?</h2>
        <ul class="list-disc pl-6 space-y-2">
          <li>Add a <strong class="text-white">Z-Score</strong> node after Price Feed to see how far the price sits from its own recent average.</li>
          <li>Swap <strong class="text-white">Chart</strong> for <strong class="text-white">Candle Chart</strong> to see open, high, low and close candles.</li>
          <li>Add an <strong class="text-white">Alert</strong> node to flag when a value crosses a threshold. The alert shows its state in the editor.</li>
          <li>Read <NuxtLink to="/blog/advanced-pipeline-mean-reversion" class="text-[#00c853] hover:underline">Advanced Pipeline: Mean Reversion with Z-Score and RSI</NuxtLink>.</li>
          <li>See <NuxtLink to="/blog/pipeline-nodes-reference" class="text-[#00c853] hover:underline">All 21 Pipeline Nodes Explained</NuxtLink>.</li>
        </ul>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'landing' })

useHead({
  title: 'Your First Pipeline Tutorial — Kalmate | Build a Kalman Filter Price Chart',
  meta: [
    { name: 'description', content: 'Step-by-step tutorial: build your first Kalmate pipeline. Connect Symbol → Price Feed → Kalman Filter → Chart to smooth AAPL price history. No code required.' },
    { name: 'keywords', content: 'kalmate pipeline tutorial, kalman filter tutorial, visual data pipeline, node editor tutorial, aapl real-time chart, financial pipeline beginner' },
  ],
})
</script>