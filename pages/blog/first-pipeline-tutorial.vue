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

      <h1 class="text-4xl md:text-5xl font-bold text-white mb-6">Your First Pipeline: Symbol Input → Kalman Filter → Chart Output</h1>

      <div class="prose prose-invert max-w-none text-[#ccc] leading-relaxed space-y-4">
        <p class="text-lg">
          Kalmate's <NuxtLink to="/terminal/pipeline" class="text-[#00c853] hover:underline">Pipeline</NuxtLink> lets you build visual data workflows by connecting nodes — no code required. In this tutorial, you'll build a live pipeline that fetches AAPL prices, smooths them with a Kalman Filter, and displays a real-time chart.
        </p>

        <div class="bg-[#111] border border-[#222] rounded-xl p-6 my-8">
          <h3 class="text-[#00c853] text-sm font-mono tracking-widest mb-3">WHAT YOU'LL BUILD</h3>
          <div class="flex items-center gap-2 text-sm text-[#ccc] flex-wrap">
            <span class="bg-[#2979ff]/20 border border-[#2979ff]/30 px-3 py-1 rounded">Symbol Input</span>
            <span class="text-[#555]">→</span>
            <span class="bg-[#00c853]/20 border border-[#00c853]/30 px-3 py-1 rounded">Kalman Filter</span>
            <span class="text-[#555]">→</span>
            <span class="bg-[#ff69b4]/20 border border-[#ff69b4]/30 px-3 py-1 rounded">Chart Output</span>
          </div>
          <p class="text-[#888] text-xs mt-3">Result: A live candlestick chart where price noise is filtered out by the Kalman algorithm.</p>
        </div>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">Step 1: Open the Pipeline Editor</h2>
        <p>Go to <NuxtLink to="/terminal/pipeline" class="text-[#00c853] hover:underline">/terminal/pipeline</NuxtLink>. You'll see a blank canvas with a node palette on the left (Input, Process, Output categories).</p>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">Step 2: Add a Symbol Input Node</h2>
        <ol class="list-decimal pl-6 space-y-2">
          <li>Click <strong class="text-white">Input</strong> in the palette to expand it.</li>
          <li>Drag <strong class="text-white">Symbol Input</strong> onto the canvas.</li>
          <li>Click the node to open its config panel on the right.</li>
          <li>Enter <code class="bg-[#0a0a0a] px-1.5 py-0.5 rounded text-[#00c853] font-mono">AAPL</code> as the symbol.</li>
          <li>Set <strong>Interval</strong> to <code class="bg-[#0a0a0a] px-1.5 py-0.5 rounded text-[#00c853] font-mono">30s</code> (default).</li>
          <li>Click <strong>Save</strong>. The node will start fetching live AAPL quotes from Yahoo Finance.</li>
        </ol>

        <div class="bg-[#0a0a0a] border border-[#222] rounded-xl p-4 my-6 font-mono text-xs">
          <div class="text-[#888] mb-2">// Node config example</div>
          <div class="text-[#ccc]">{</div>
          <div class="text-[#ccc] ml-4">"symbol": "AAPL",</div>
          <div class="text-[#ccc] ml-4">"interval": 30000,</div>
          <div class="text-[#ccc] ml-4">"output": "price"</div>
          <div class="text-[#ccc]">}</div>
        </div>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">Step 3: Add a Kalman Filter Node</h2>
        <p>The Kalman Filter smooths noisy price data by estimating the true signal. It's perfect for financial time series where prices jump around.</p>
        <ol class="list-decimal pl-6 space-y-2">
          <li>Click <strong class="text-white">Process</strong> in the palette.</li>
          <li>Drag <strong class="text-white">Kalman Filter</strong> onto the canvas, to the right of Symbol Input.</li>
          <li>Click the node. Set <strong>Process Noise (Q)</strong> to <code class="bg-[#0a0a0a] px-1.5 py-0.5 rounded text-[#00c853] font-mono">0.01</code> and <strong>Measurement Noise (R)</strong> to <code class="bg-[#0a0a0a] px-1.5 py-0.5 rounded text-[#00c853] font-mono">0.1</code>.</li>
          <li><strong>Q (process noise)</strong> = how much the true price can change between steps. Lower = smoother.</li>
          <li><strong>R (measurement noise)</strong> = how noisy the incoming data is. Higher = trust the model more.</li>
        </ol>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">Step 4: Connect the Nodes</h2>
        <ol class="list-decimal pl-6 space-y-2">
          <li>Hover the <strong>output handle</strong> (right side) of Symbol Input — it glows green.</li>
          <li>Click and drag to the <strong>input handle</strong> (left side) of Kalman Filter.</li>
          <li>A connection line appears. Data now flows: Symbol Input → Kalman Filter.</li>
        </ol>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">Step 5: Add a Chart Output Node</h2>
        <ol class="list-decimal pl-6 space-y-2">
          <li>Click <strong class="text-white">Output</strong> in the palette.</li>
          <li>Drag <strong class="text-white">Chart Output</strong> onto the canvas, to the right of Kalman Filter.</li>
          <li>Connect Kalman Filter's output → Chart Output's input.</li>
          <li>Click Chart Output, set <strong>Chart Type</strong> to <code class="bg-[#0a0a0a] px-1.5 py-0.5 rounded text-[#00c853] font-mono">Candlestick</code>.</li>
          <li>Set <strong>Time Range</strong> to <code class="bg-[#0a0a0a] px-1.5 py-0.5 rounded text-[#00c853] font-mono">1d</code>.</li>
        </ol>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">Step 6: Run the Pipeline</h2>
        <p>Click the <strong class="text-[#00c853]">▶ Run</strong> button in the top toolbar. Within seconds:</p>
        <ul class="list-disc pl-6 space-y-2">
          <li>Symbol Input fetches live AAPL price (updates every 30s).</li>
          <li>Kalman Filter outputs a smoothed price series.</li>
          <li>Chart Output renders a live candlestick chart.</li>
        </ul>
        <p>Come back in a few minutes — the chart updates automatically as new data arrives.</p>

        <div class="bg-[#111] border border-[#222] rounded-xl p-6 my-8">
          <h3 class="text-[#00c853] text-sm font-mono tracking-widest mb-3">PRO TIP: Tweak Q and R</h3>
          <p class="text-[#ccc] text-sm">Try <code class="bg-[#0a0a0a] px-1.5 py-0.5 rounded text-[#00c853] font-mono">Q=0.001, R=0.5</code> for ultra-smooth (laggy) or <code class="bg-[#0a0a0a] px-1.5 py-0.5 rounded text-[#00c853] font-mono">Q=0.1, R=0.01</code> for responsive (noisier). The Kalman Filter adapts in real time.</p>
        </div>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">What's Next?</h2>
        <ul class="list-disc pl-6 space-y-2">
          <li>Add a <strong class="text-white">SMA</strong> node after Kalman Filter to compare smoothed vs. simple moving average.</li>
          <li>Swap <strong class="text-white">Chart Output</strong> for <strong class="text-white">Candle Chart Output</strong> for volume bars.</li>
          <li>Add an <strong class="text-white">Alert Output</strong> to get browser notifications when price crosses a threshold.</li>
          <li>Read <NuxtLink to="/blog/advanced-pipeline-mean-reversion" class="text-[#00c853] hover:underline">Advanced Pipeline: Multi-Symbol Mean-Reversion with RSI + SMA</NuxtLink> (publishes June 28).</li>
          <li>See <NuxtLink to="/blog/pipeline-nodes-reference" class="text-[#00c853] hover:underline">All 18 Pipeline Nodes Explained</NuxtLink> (publishes July 5).</li>
        </ul>

        <div class="bg-[#0a0a0a] border border-[#222] rounded-xl p-4 my-6 font-mono text-xs">
          <div class="text-[#888] mb-2">// Full pipeline JSON (export from editor)</div>
          <div class="text-[#ccc]">[</div>
          <div class="text-[#ccc] ml-4">{ "type": "symbol-input", "config": { "symbol": "AAPL", "interval": 30000 } },</div>
          <div class="text-[#ccc] ml-4">{ "type": "kalman-filter", "config": { "q": 0.01, "r": 0.1 } },</div>
          <div class="text-[#ccc] ml-4">{ "type": "chart-output", "config": { "chartType": "candlestick", "range": "1d" } }</div>
          <div class="text-[#ccc]">]</div>
        </div>

        <p class="mt-8">
          Questions? <NuxtLink to="/contact" class="text-[#00c853] hover:underline">Contact us</NuxtLink> or open an issue on <NuxtLink to="https://github.com/eanorambuena/kalmate" target="_blank" rel="noopener noreferrer" class="text-[#00c853] hover:underline">GitHub</NuxtLink>.
        </p>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'landing' })

useHead({
  title: 'Your First Pipeline Tutorial — Kalmate | Build a Live Kalman Filter Chart',
  meta: [
    { name: 'description', content: 'Step-by-step tutorial: build your first Kalmate pipeline. Connect Symbol Input → Kalman Filter → Chart Output for live AAPL price smoothing. No code required.' },
    { name: 'keywords', content: 'kalmate pipeline tutorial, kalman filter tutorial, visual data pipeline, node editor tutorial, aapl real-time chart, financial pipeline beginner' },
  ],
})
</script>