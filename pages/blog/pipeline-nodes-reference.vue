<template>
  <div class="min-h-screen bg-[#0a0a0a]">
    <Header />

    <main class="max-w-3xl mx-auto px-6 pt-24 pb-24">
      <div class="flex items-center gap-3 text-xs text-[#888] mb-4">
        <NuxtLink to="/blog" class="hover:text-white transition-colors">← Back to Blog</NuxtLink>
        <span class="w-1 h-1 rounded-full bg-[#555]" />
        <span>July 5, 2026</span>
        <span class="w-1 h-1 rounded-full bg-[#555]" />
        <span class="text-[#00c853]">Reference</span>
      </div>

      <h1 class="text-4xl md:text-5xl font-bold text-white mb-6">All 18 Pipeline Nodes Explained: When to Use Each</h1>

      <div class="prose prose-invert max-w-none text-[#ccc] leading-relaxed space-y-4">
        <p class="text-lg">
          Kalmate's Pipeline has <strong class="text-white">18 node types</strong> across 3 categories: <strong class="text-[#2979ff]">Input</strong> (7), <strong class="text-[#00c853]">Process</strong> (6), and <strong class="text-[#ff69b4]">Output</strong> (5). This guide covers each node with use cases and configuration tips.
        </p>

        <div class="bg-[#111] border border-[#222] rounded-xl p-6 my-8">
          <h3 class="text-[#2979ff] text-sm font-mono tracking-widest mb-3">INPUT NODES</h3>
          <div class="space-y-4">
            <div class="bg-[#0a0a0a] rounded-xl p-4 border border-[#222]">
              <p class="text-white font-bold text-sm">1. Symbol Input <span class="text-[#00c853] font-normal">(Free)</span></p>
              <p class="text-[#ccc] text-xs mt-1">Fetches a single symbol's price from Yahoo Finance. Use for: tracking one stock, crypto, or forex pair. Config: symbol, interval.</p>
            </div>
            <div class="bg-[#0a0a0a] rounded-xl p-4 border border-[#222]">
              <p class="text-white font-bold text-sm">2. Price Feed <span class="text-[#00c853] font-normal">(Free)</span></p>
              <p class="text-[#ccc] text-xs mt-1">Real-time price stream without symbol lookup. Use for: raw price data from another node. Passthrough node.</p>
            </div>
            <div class="bg-[#0a0a0a] rounded-xl p-4 border border-[#222]">
              <p class="text-white font-bold text-sm">3. Scalar <span class="text-[#00c853] font-normal">(Free)</span></p>
              <p class="text-[#ccc] text-xs mt-1">Constant numeric value. Use for: thresholds, multipliers, or fixed offsets in Math operations.</p>
            </div>
            <div class="bg-[#0a0a0a] rounded-xl p-4 border border-[#222]">
              <p class="text-white font-bold text-sm">4. Currency <span class="text-[#00c853] font-normal">(Free)</span></p>
              <p class="text-[#ccc] text-xs mt-1">Fetches forex pair data. Use for: tracking USD/CLP, EUR/USD, or any currency pair.</p>
            </div>
            <div class="bg-[#0a0a0a] rounded-xl p-4 border border-[#222]">
              <p class="text-white font-bold text-sm">5. Multi-Symbol Input <span class="text-[#ff69b4] font-normal">(Pro)</span></p>
              <p class="text-[#ccc] text-xs mt-1">Fetches multiple symbols simultaneously. Use for: portfolio tracking, multi-asset strategies. Config: comma-separated symbols.</p>
            </div>
            <div class="bg-[#0a0a0a] rounded-xl p-4 border border-[#222]">
              <p class="text-white font-bold text-sm">6. Portfolio Input <span class="text-[#00c853] font-normal">(Free)</span></p>
              <p class="text-[#ccc] text-xs mt-1">Loads positions from the Portfolio page. Use for: monitoring your existing holdings with real-time P&L.</p>
            </div>
            <div class="bg-[#0a0a0a] rounded-xl p-4 border border-[#222]">
              <p class="text-white font-bold text-sm">7. News Feed <span class="text-[#00c853] font-normal">(Free)</span></p>
              <p class="text-[#ccc] text-xs mt-1">Fetches latest financial news for a symbol. Use for: fundamental analysis context alongside technical data.</p>
            </div>
          </div>
        </div>

        <div class="bg-[#111] border border-[#222] rounded-xl p-6 my-8">
          <h3 class="text-[#00c853] text-sm font-mono tracking-widest mb-3">PROCESS NODES</h3>
          <div class="space-y-4">
            <div class="bg-[#0a0a0a] rounded-xl p-4 border border-[#222]">
              <p class="text-white font-bold text-sm">8. Kalman Filter <span class="text-[#00c853] font-normal">(Free)</span></p>
              <p class="text-[#ccc] text-xs mt-1">State estimator that smooths noisy price data. Use for: reducing noise, estimating true price, predicting next value. Config: Q (process noise), R (measurement noise).</p>
            </div>
            <div class="bg-[#0a0a0a] rounded-xl p-4 border border-[#222]">
              <p class="text-white font-bold text-sm">9. Math <span class="text-[#00c853] font-normal">(Free)</span></p>
              <p class="text-[#ccc] text-xs mt-1">Arithmetic operations on data streams. Use for: calculating spreads, ratios, or normalized values between symbols.</p>
            </div>
            <div class="bg-[#0a0a0a] rounded-xl p-4 border border-[#222]">
              <p class="text-white font-bold text-sm">10. SMA <span class="text-[#ff69b4] font-normal">(Pro)</span></p>
              <p class="text-[#ccc] text-xs mt-1">Simple Moving Average — unweighted mean over N periods. Use for: identifying trend direction. Config: period (e.g., 20 for 20-period SMA).</p>
            </div>
            <div class="bg-[#0a0a0a] rounded-xl p-4 border border-[#222]">
              <p class="text-white font-bold text-sm">11. EMA <span class="text-[#ff69b4] font-normal">(Pro)</span></p>
              <p class="text-[#ccc] text-xs mt-1">Exponential Moving Average — weighted mean, more responsive to recent data. Use for: faster trend detection. Config: period, multiplier.</p>
            </div>
            <div class="bg-[#0a0a0a] rounded-xl p-4 border border-[#222]">
              <p class="text-white font-bold text-sm">12. RSI <span class="text-[#ff69b4] font-normal">(Pro)</span></p>
              <p class="text-[#ccc] text-xs mt-1">Relative Strength Index — momentum oscillator (0-100). Use for: identifying overbought/oversold conditions. Config: period (14 default), thresholds.</p>
            </div>
            <div class="bg-[#0a0a0a] rounded-xl p-4 border border-[#222]">
              <p class="text-white font-bold text-sm">13. Forecast <span class="text-[#ff69b4] font-normal">(Pro)</span></p>
              <p class="text-[#ccc] text-xs mt-1">Simple prediction based on historical trend. Use for: forward-looking estimates. Config: forecast horizon, trend method.</p>
            </div>
          </div>
        </div>

        <div class="bg-[#111] border border-[#222] rounded-xl p-6 my-8">
          <h3 class="text-[#ff69b4] text-sm font-mono tracking-widest mb-3">OUTPUT NODES</h3>
          <div class="space-y-4">
            <div class="bg-[#0a0a0a] rounded-xl p-4 border border-[#222]">
              <p class="text-white font-bold text-sm">14. Chart Output <span class="text-[#00c853] font-normal">(Free)</span></p>
              <p class="text-[#ccc] text-xs mt-1">Renders a candlestick or line chart. Use for: visualizing processed data. Config: chart type, time range.</p>
            </div>
            <div class="bg-[#0a0a0a] rounded-xl p-4 border border-[#222]">
              <p class="text-white font-bold text-sm">15. Candle Chart <span class="text-[#00c853] font-normal">(Free)</span></p>
              <p class="text-[#ccc] text-xs mt-1">Candle Chart Output with volume bars. Use for: detailed technical analysis with volume confirmation.</p>
            </div>
            <div class="bg-[#0a0a0a] rounded-xl p-4 border border-[#222]">
              <p class="text-white font-bold text-sm">16. Price Display <span class="text-[#00c853] font-normal">(Free)</span></p>
              <p class="text-[#ccc] text-xs mt-1">Shows numeric value in a clean display. Use for: debugging pipeline data, monitoring real-time values.</p>
            </div>
            <div class="bg-[#0a0a0a] rounded-xl p-4 border border-[#222]">
              <p class="text-white font-bold text-sm">17. Telegram Output <span class="text-[#ff69b4] font-normal">(Pro)</span></p>
              <p class="text-[#ccc] text-xs mt-1">Sends alerts to your Telegram. Use for: mobile notifications. Config: bot token, chat ID, message template.</p>
            </div>
            <div class="bg-[#0a0a0a] rounded-xl p-4 border border-[#222]">
              <p class="text-white font-bold text-sm">18. Email Output <span class="text-[#ff69b4] font-normal">(Pro)</span></p>
              <p class="text-[#ccc] text-xs mt-1">Sends reports via email. Use for: daily summaries, alert digests. Config: recipient, frequency.</p>
            </div>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">Quick Decision Guide</h2>
        <div class="bg-[#111] border border-[#222] rounded-xl p-6 my-6">
          <div class="space-y-3 text-sm [&>p]:flex [&>p]:gap-2">
            <p><span class="text-[#2979ff] font-bold min-w-[24px]">→</span><strong class="text-white min-w-[110px]">Watch one price:</strong><span class="text-[#ccc]">Symbol Input → Chart Output</span></p>
            <p><span class="text-[#2979ff] font-bold min-w-[24px]">→</span><strong class="text-white min-w-[110px]">Smooth noisy data:</strong><span class="text-[#ccc]">Symbol Input → Kalman Filter → Chart Output</span></p>
            <p><span class="text-[#2979ff] font-bold min-w-[24px]">→</span><strong class="text-white min-w-[110px]">Track trend:</strong><span class="text-[#ccc]">Symbol Input → SMA/EMA → Chart Output</span></p>
            <p><span class="text-[#2979ff] font-bold min-w-[24px]">→</span><strong class="text-white min-w-[110px]">Find reversals:</strong><span class="text-[#ccc]">Symbol Input → RSI → Alert Output</span></p>
            <p><span class="text-[#2979ff] font-bold min-w-[24px]">→</span><strong class="text-white min-w-[110px]">Multi-asset scan:</strong><span class="text-[#ccc]">Multi-Symbol Input → RSI → Alert Output</span></p>
            <p><span class="text-[#2979ff] font-bold min-w-[24px]">→</span><strong class="text-white min-w-[110px]">Compare two assets:</strong><span class="text-[#ccc]">2x Symbol Input → Math (ratio) → Chart Output</span></p>
            <p><span class="text-[#2979ff] font-bold min-w-[24px]">→</span><strong class="text-white min-w-[110px]">Protect portfolio:</strong><span class="text-[#ccc]">Portfolio Input → Kalman Filter → Telegram Output</span></p>
            <p><span class="text-[#2979ff] font-bold min-w-[24px]">→</span><strong class="text-white min-w-[110px]">Daily summary:</strong><span class="text-[#ccc]">Symbol Input → Price Display → Email Output</span></p>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">Free vs Pro</h2>
        <p><strong class="text-[#00c853]">Free</strong> nodes (11 types) cover basic pipelines: symbol input, Kalman filter, chart output, price display, portfolio input, and more.</p>
        <p><strong class="text-[#ff69b4]">Pro</strong> nodes (7 types) add advanced indicators (SMA, EMA, RSI, Forecast) and communication (Telegram, Email). $9.990 CLP once, forever.</p>

        <p class="mt-8">
          Ready to build? <NuxtLink to="/terminal/pipeline" class="text-[#00c853] hover:underline">Open the Pipeline Editor</NuxtLink>. Start with the <NuxtLink to="/blog/first-pipeline-tutorial" class="text-[#00c853] hover:underline">Beginner Tutorial</NuxtLink> if you haven't yet.
        </p>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'landing' })

useHead({
  title: 'All 18 Pipeline Nodes Explained — Kalmate Reference Guide',
  meta: [
    { name: 'description', content: 'Complete Kalmate pipeline node reference. 18 nodes across 3 categories: Input (7), Process (6), and Output (5). Free vs Pro breakdown, config tips, and use cases for each node.' },
    { name: 'keywords', content: 'kalmate pipeline nodes, pipeline reference, kalmate node types, symbol input, kalman filter, RSI, SMA, EMA, forecast node, telegram output, pipeline tutorial' },
  ],
})
</script>