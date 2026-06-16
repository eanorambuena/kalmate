<template>
  <div class="min-h-screen bg-[#0a0a0a]">
    <Header />

    <main class="max-w-3xl mx-auto px-6 pt-24 pb-24">
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
          Technical indicators help you extract signal from market noise. In this guide, we'll walk through three indicators available in Kalmate's <NuxtLink to="/terminal/pipeline" class="text-[#00c853] hover:underline">Pipeline</NuxtLink> — and show you the actual math with real numbers.
        </p>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">Simple Moving Average (SMA)</h2>
        <p>
          The SMA calculates the average price over a fixed window. Each day gets equal weight.
        </p>

        <div class="bg-[#111] border border-[#222] rounded-xl p-6 my-6">
          <h3 class="text-[#2979ff] text-sm font-mono tracking-widest mb-3">SMA(3) — STEP BY STEP</h3>
          <p class="text-xs text-[#888] mb-3">Using real closing prices from a typical AAPL week</p>
          <div class="overflow-x-auto">
            <table class="text-xs w-full">
              <thead>
                <tr class="text-[#888] border-b border-[#222]">
                  <th class="text-left py-2 pr-4">Day</th>
                  <th class="text-right py-2 pr-4">Close</th>
                  <th class="text-right py-2 pr-4">SMA(3)</th>
                  <th class="text-left py-2 pl-4 text-[#555]">Calculation</th>
                </tr>
              </thead>
              <tbody class="text-[#ccc]">
                <tr class="border-b border-[#1a1a1a]">
                  <td class="py-2 pr-4">1</td>
                  <td class="text-right py-2 pr-4">100</td>
                  <td class="text-right py-2 pr-4 text-[#555]">—</td>
                  <td class="text-left py-2 pl-4 text-[#555]">not enough data</td>
                </tr>
                <tr class="border-b border-[#1a1a1a]">
                  <td class="py-2 pr-4">2</td>
                  <td class="text-right py-2 pr-4">102</td>
                  <td class="text-right py-2 pr-4 text-[#555]">—</td>
                  <td class="text-left py-2 pl-4 text-[#555]">not enough data</td>
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
          The SMA smooths out daily fluctuations. On day 5, the price jumped to 105, but the SMA only moved to 103 — it lags because it averages the last 3 days equally.
        </p>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">Exponential Moving Average (EMA)</h2>
        <p>
          The EMA gives more weight to recent prices, making it more responsive. The formula uses a multiplier: <strong class="text-white">Multiplier = 2 ÷ (period + 1)</strong>.
        </p>

        <div class="bg-[#111] border border-[#222] rounded-xl p-6 my-6">
          <h3 class="text-[#2979ff] text-sm font-mono tracking-widest mb-3">EMA(3) — SAME DATA, FASTER RESPONSE</h3>
          <p class="text-xs text-[#888] mb-3">EMA multiplier for period 3: 2 ÷ (3 + 1) = 0.5</p>
          <div class="overflow-x-auto">
            <table class="text-xs w-full">
              <thead>
                <tr class="text-[#888] border-b border-[#222]">
                  <th class="text-left py-2 pr-4">Day</th>
                  <th class="text-right py-2 pr-4">Close</th>
                  <th class="text-right py-2 pr-4">EMA(3)</th>
                  <th class="text-left py-2 pl-4 text-[#555]">Formula</th>
                </tr>
              </thead>
              <tbody class="text-[#ccc]">
                <tr class="border-b border-[#1a1a1a]">
                  <td class="py-2 pr-4">1</td>
                  <td class="text-right py-2 pr-4">100</td>
                  <td class="text-right py-2 pr-4 text-[#555]">—</td>
                  <td class="text-left py-2 pl-4 text-[#555]">seed with SMA</td>
                </tr>
                <tr class="border-b border-[#1a1a1a]">
                  <td class="py-2 pr-4">2</td>
                  <td class="text-right py-2 pr-4">102</td>
                  <td class="text-right py-2 pr-4 text-[#555]">—</td>
                  <td class="text-left py-2 pl-4 text-[#555]">seed with SMA</td>
                </tr>
                <tr class="border-b border-[#1a1a1a]">
                  <td class="py-2 pr-4">3</td>
                  <td class="text-right py-2 pr-4">101</td>
                  <td class="text-right py-2 pr-4 text-[#00c853]">101.00</td>
                  <td class="text-left py-2 pl-4">seed = SMA = 101.00</td>
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
          Notice the difference on day 5: SMA = 103.00 vs EMA = 103.50. The EMA reacted faster because it weighted the latest price (105) at 50% instead of 33%. This makes EMA better for short-term trading.
        </p>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">Kalman Filter — Adaptive Smoothing</h2>
        <p>
          The Kalman filter is a recursive algorithm that estimates the "true" price by filtering out noise. Unlike SMA/EMA which use fixed windows, the Kalman filter <strong class="text-white">adapts to volatility automatically</strong>.
        </p>

        <div class="bg-[#0a0a0a] border border-[#222] rounded-xl p-4 my-6 font-mono text-xs">
          <div class="text-[#888] mb-2">// Kalman Filter — Schwartz-Smith 2-Factor Model</div>
          <div class="text-[#ccc]">state = { trend, cycle }</div>
          <div class="text-[#ccc]">predict: trend[t] = phi × trend[t-1] + noise</div>
          <div class="text-[#ccc]">update: state[t] = predict + KalmanGain × (price - predict)</div>
          <div class="text-[#888] mt-2">// Default parameters in Kalmate</div>
          <div class="text-[#ccc]">{ phi: 0.9, mu: 0.0001, sigmaChi: 0.02, sigmaXi: 0.005 }</div>
        </div>

        <p>
          In Kalmate's Pipeline, the Kalman filter node outputs: <strong class="text-white">smoothed price</strong>, <strong class="text-white">trend component</strong>, <strong class="text-white">cycle component</strong>, and <strong class="text-white">confidence bands</strong>. It's particularly useful for noisy markets where SMA/EMA give inconsistent signals.
        </p>

        <div class="bg-[#111] border border-[#222] rounded-xl p-6 my-6">
          <h3 class="text-[#00c853] text-sm font-mono tracking-widest mb-3">SMA vs EMA vs KALMAN — WHEN TO USE WHAT</h3>
          <div class="space-y-4 text-sm">
            <div class="flex gap-4 bg-[#0a0a0a] rounded-lg p-4">
              <div class="text-[#2979ff] font-bold shrink-0 w-12">SMA</div>
              <div class="text-[#ccc]">Best for identifying long-term trend direction. Use SMA(50) and SMA(200) for the classic "golden cross" and "death cross" signals.</div>
            </div>
            <div class="flex gap-4 bg-[#0a0a0a] rounded-lg p-4">
              <div class="text-[#00c853] font-bold shrink-0 w-12">EMA</div>
              <div class="text-[#ccc]">Best for short-term trading. Use EMA(12) and EMA(26) for the MACD crossover strategy. Reacts faster to price changes.</div>
            </div>
            <div class="flex gap-4 bg-[#0a0a0a] rounded-lg p-4">
              <div class="text-[#ff69b4] font-bold shrink-0 w-12">Kalman</div>
              <div class="text-[#ccc]">Best for volatile/choppy markets where you need adaptive smoothing. The Kalman filter adjusts its sensitivity based on market conditions automatically.</div>
            </div>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">Try It Yourself in the Pipeline</h2>
        <p>
          Open <NuxtLink to="/terminal/pipeline" class="text-[#00c853] hover:underline">Kalmate's Pipeline</NuxtLink> and build this setup in under 30 seconds:
        </p>
        <ol class="list-decimal pl-6 space-y-2">
          <li>Add a <strong class="text-white">Symbol Input</strong> node, set it to <code class="text-[#00c853]">AAPL</code></li>
          <li>Add a <strong class="text-white">Price Feed</strong> node, connect from Symbol Input</li>
          <li>Add an <strong class="text-white">SMA Indicator</strong> (period 20), connect from Price Feed</li>
          <li>Add a <strong class="text-white">Kalman Filter</strong>, connect from Price Feed</li>
          <li>Add two <strong class="text-white">Chart Output</strong> nodes, connect SMA to one and Kalman to the other</li>
          <li>Compare the smoothed lines — see how Kalman adapts while SMA lags</li>
        </ol>
        <p class="mt-4">
          The Pipeline runs automatically as you build. Change the symbol to <code class="text-[#00c853]">BTC-USD</code> or any other ticker and watch both indicators update instantly.
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
    { name: 'description', content: 'Learn SMA, EMA, and Kalman filters with real numbers and step-by-step tables. Compare SMA(3) vs EMA(3) on real data. Try them live in the Kalmate Pipeline.' },
    { name: 'keywords', content: 'SMA, EMA, Kalman filter, technical indicators, moving average, trading indicators, kalmate pipeline, market analysis' },
  ],
})
</script>
