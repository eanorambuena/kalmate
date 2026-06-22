<template>
  <div class="min-h-screen bg-[#0a0a0a]">
    <Header />

    <main class="max-w-3xl mx-auto px-6 pt-24 pb-24">
      <div class="flex items-center gap-3 text-xs text-[#888] mb-4">
        <NuxtLink to="/blog" class="hover:text-white transition-colors">← Back to Blog</NuxtLink>
        <span class="w-1 h-1 rounded-full bg-[#555]" />
        <span>June 28, 2026</span>
        <span class="w-1 h-1 rounded-full bg-[#555]" />
        <span class="text-[#00c853]">Tutorial</span>
      </div>

      <h1 class="text-4xl md:text-5xl font-bold text-white mb-6">Advanced Pipeline: Multi-Symbol Mean-Reversion with RSI + SMA</h1>

      <div class="prose prose-invert max-w-none text-[#ccc] leading-relaxed space-y-4">
        <p class="text-lg">
          In this advanced tutorial, you'll build a mean-reversion strategy that monitors <strong class="text-white">3 symbols simultaneously</strong>, calculates RSI to detect oversold conditions, smooths the data with SMA, and sends a browser notification when an asset crosses your threshold.
        </p>

        <div class="bg-[#111] border border-[#222] rounded-xl p-6 my-8">
          <h3 class="text-[#00c853] text-sm font-mono tracking-widest mb-3">PIPELINE FLOW</h3>
          <div class="flex items-center gap-2 text-sm text-[#ccc] flex-wrap">
            <span class="bg-[#2979ff]/20 border border-[#2979ff]/30 px-3 py-1 rounded">Multi-Symbol Input</span>
            <span class="text-[#555]">→</span>
            <span class="bg-[#00c853]/20 border border-[#00c853]/30 px-3 py-1 rounded">RSI</span>
            <span class="text-[#555]">→</span>
            <span class="bg-[#00c853]/20 border border-[#00c853]/30 px-3 py-1 rounded">SMA</span>
            <span class="text-[#555]">→</span>
            <span class="bg-[#ff69b4]/20 border border-[#ff69b4]/30 px-3 py-1 rounded">Alert Output</span>
          </div>
          <p class="text-[#888] text-xs mt-3">Detect mean-reversion opportunities across multiple assets in real time.</p>
        </div>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">What Is Mean Reversion?</h2>
        <p>Mean reversion assumes that prices tend to return to their average over time. When RSI drops below 30, the asset is oversold — a potential buying opportunity. When RSI rises above 70, it's overbought. This pipeline automates the monitoring.</p>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">Step 1: Add Multi-Symbol Input</h2>
        <ol class="list-decimal pl-6 space-y-2">
          <li>Open <NuxtLink to="/terminal/pipeline" class="text-[#00c853] hover:underline">/terminal/pipeline</NuxtLink>.</li>
          <li>Drag <strong class="text-white">Multi-Symbol Input</strong> (Pro node) onto the canvas.</li>
          <li>Configure it with: <code class="bg-[#0a0a0a] px-1.5 py-0.5 rounded text-[#00c853] font-mono">AAPL, MSFT, GOOGL</code></li>
          <li>Set interval to <code class="bg-[#0a0a0a] px-1.5 py-0.5 rounded text-[#00c853] font-mono">60s</code>.</li>
        </ol>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">Step 2: Add RSI Node</h2>
        <p>The Relative Strength Index compares recent gains to losses to identify overbought/oversold conditions.</p>
        <ol class="list-decimal pl-6 space-y-2">
          <li>Drag <strong class="text-white">RSI</strong> (Pro node) onto the canvas.</li>
          <li>Connect Multi-Symbol Output → RSI Input.</li>
          <li>Click RSI, set <strong>Period</strong> to <code class="bg-[#0a0a0a] px-1.5 py-0.5 rounded text-[#00c853] font-mono">14</code> (standard).</li>
          <li>Set <strong>Oversold Threshold</strong> to <code class="bg-[#0a0a0a] px-1.5 py-0.5 rounded text-[#00c853] font-mono">30</code>, <strong>Overbought</strong> to <code class="bg-[#0a0a0a] px-1.5 py-0.5 rounded text-[#00c853] font-mono">70</code>.</li>
        </ol>

        <div class="bg-[#0a0a0a] border border-[#222] rounded-xl p-4 my-6 font-mono text-xs">
          <div class="text-[#888] mb-2">// RSI calculation (14-period)</div>
          <div class="text-[#ccc]">RSI = 100 - (100 / (1 + RS))</div>
          <div class="text-[#ccc]">RS = average gain / average loss (last 14 periods)</div>
        </div>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">Step 3: Add SMA Node</h2>
        <p>Adding a Simple Moving Average helps confirm the trend direction alongside RSI.</p>
        <ol class="list-decimal pl-6 space-y-2">
          <li>Drag <strong class="text-white">SMA</strong> (Pro node) onto the canvas.</li>
          <li>Connect RSI Output → SMA Input.</li>
          <li>Set <strong>Period</strong> to <code class="bg-[#0a0a0a] px-1.5 py-0.5 rounded text-[#00c853] font-mono">20</code>.</li>
        </ol>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">Step 4: Add Alert Output</h2>
        <ol class="list-decimal pl-6 space-y-2">
          <li>Drag <strong class="text-white">Alert Output</strong> (Pro node) onto the canvas.</li>
          <li>Connect SMA Output → Alert Input.</li>
          <li>Configure the alert: <strong>Condition</strong>: <code class="bg-[#0a0a0a] px-1.5 py-0.5 rounded text-[#00c853] font-mono">RSI &lt; 30</code>, <strong>Message</strong>: <code class="bg-[#0a0a0a] px-1.5 py-0.5 rounded text-[#00c853] font-mono">"{{symbol}} oversold! RSI: {{value}}"</code>.</li>
          <li>Enable <strong>Browser Notification</strong>.</li>
        </ol>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">Step 5: Run and Monitor</h2>
        <ol class="list-decimal pl-6 space-y-2">
          <li>Click <strong class="text-[#00c853]">▶ Run</strong>.</li>
          <li>The pipeline fetches prices for AAPL, MSFT, and GOOGL every 60 seconds.</li>
          <li>RSI calculates for each symbol independently.</li>
          <li>When any symbol crosses below 30, you get a browser notification.</li>
          <li>Check the RSI values in real-time using a <strong>Price Display</strong> node connected to SMA output.</li>
        </ol>

        <div class="bg-[#111] border border-[#222] rounded-xl p-6 my-8">
          <h3 class="text-[#00c853] text-sm font-mono tracking-widest mb-3">PRO TIP: Combine with Telegram</h3>
          <p class="text-[#ccc] text-sm">Replace Alert Output with <strong class="text-white">Telegram Output</strong> to get notifications on your phone. Configure your bot token and chat ID, and you'll never miss a trade signal.</p>
        </div>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">Tuning Your Strategy</h2>
        <ul class="list-disc pl-6 space-y-2">
          <li><strong class="text-white">Lower RSI period</strong> (e.g., 7) for more signals but more false positives.</li>
          <li><strong class="text-white">Add a Forecast node</strong> after SMA to predict where RSI is heading.</li>
          <li><strong class="text-white">Use a Math node</strong> to combine multiple conditions (e.g., RSI &lt; 30 AND price &gt; SMA).</li>
          <li><strong class="text-white">Log results</strong> to a Price Display to track signal accuracy over time.</li>
        </ul>

        <div class="bg-[#0a0a0a] border border-[#222] rounded-xl p-4 my-6 font-mono text-xs">
          <div class="text-[#888] mb-2">// Exportable pipeline config</div>
          <div class="text-[#ccc]">[</div>
          <div class="text-[#ccc] ml-4">{ "type": "multi-symbol-input", "config": { "symbols": ["AAPL","MSFT","GOOGL"], "interval": 60000 } },</div>
          <div class="text-[#ccc] ml-4">{ "type": "rsi", "config": { "period": 14, "oversold": 30, "overbought": 70 } },</div>
          <div class="text-[#ccc] ml-4">{ "type": "sma", "config": { "period": 20 } },</div>
          <div class="text-[#ccc] ml-4">{ "type": "alert", "config": { "condition": "rsi < 30", "message": "{{symbol}} oversold at {{value}}", "notify": true } }</div>
          <div class="text-[#ccc]">]</div>
        </div>

        <p class="mt-8">
          Check the complete <NuxtLink to="/blog/pipeline-nodes-reference" class="text-[#00c853] hover:underline">Pipeline Node Reference</NuxtLink> (publishes July 5) for all 18 node types.
        </p>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'landing' })

useHead({
  title: 'Advanced Pipeline: RSI + SMA Mean Reversion — Kalmate Tutorial',
  meta: [
    { name: 'description', content: 'Build a multi-symbol mean-reversion strategy in Kalmate\'s visual pipeline. Monitor AAPL, MSFT, GOOGL with RSI and SMA, get browser notifications on oversold signals.' },
    { name: 'keywords', content: 'kalmate advanced pipeline, mean reversion strategy, RSI calculation, SMA pipeline, multi-symbol pipeline, trading strategy automation, visual pipeline tutorial' },
  ],
})
</script>