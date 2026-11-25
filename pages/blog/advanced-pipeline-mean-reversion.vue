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

      <h1 class="text-4xl md:text-5xl font-bold text-white mb-6">Advanced Pipeline: Mean Reversion with Z-Score and RSI</h1>

      <div class="prose prose-invert max-w-none text-[#ccc] leading-relaxed space-y-4">
        <p class="text-lg">
          In this advanced tutorial, you'll build a mean-reversion check for one asset. The Z-Score measures how far today's price sits from its own recent average, RSI measures momentum, and an Alert node reports when the Z-Score drops below your threshold.
        </p>

        <div class="bg-[#111] border border-[#222] rounded-xl p-6 my-8">
          <h3 class="text-[#00c853] text-sm font-mono tracking-widest mb-3">PIPELINE FLOW</h3>
          <div class="flex items-center gap-2 text-sm text-[#ccc] flex-wrap">
            <span class="bg-[#2979ff]/20 border border-[#2979ff]/30 px-3 py-1 rounded">Symbol</span>
            <span class="text-[#555]">→</span>
            <span class="bg-[#2979ff]/20 border border-[#2979ff]/30 px-3 py-1 rounded">Price Feed</span>
            <span class="text-[#555]">→</span>
            <span class="bg-[#00c853]/20 border border-[#00c853]/30 px-3 py-1 rounded">Z-Score</span>
            <span class="text-[#555]">→</span>
            <span class="bg-[#ff69b4]/20 border border-[#ff69b4]/30 px-3 py-1 rounded">Alert</span>
          </div>
          <p class="text-[#888] text-xs mt-3">RSI and Chart nodes sit beside the Z-Score to show momentum and the price history.</p>
        </div>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">What Is Mean Reversion?</h2>
        <p>Mean reversion assumes that prices tend to return toward their average over time. A Z-Score below -2 means the price is unusually low against its own recent history; above +2 means unusually high. RSI below 30 is read as oversold, above 70 as overbought. Neither is a guarantee: the pipeline only shows where the asset stands.</p>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">Step 1: Add Symbol and Price Feed</h2>
        <ol class="list-decimal pl-6 space-y-2">
          <li>Open <NuxtLink to="/terminal/pipeline" class="text-[#00c853] hover:underline">/terminal/pipeline</NuxtLink>.</li>
          <li>Drag a <strong class="text-white">Symbol</strong> node onto the canvas and set its ticker to <code class="bg-[#0a0a0a] px-1.5 py-0.5 rounded text-[#00c853] font-mono">AAPL</code>.</li>
          <li>Drag a <strong class="text-white">Price Feed</strong> node and connect Symbol's output to its input.</li>
        </ol>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">Step 2: Add Z-Score</h2>
        <p>The Z-Score compares the log price with its rolling mean and standard deviation over the window.</p>
        <ol class="list-decimal pl-6 space-y-2">
          <li>Drag a <strong class="text-white">Z-Score</strong> node onto the canvas.</li>
          <li>Connect Price Feed's <strong>Price Series</strong> output to Z-Score's input.</li>
          <li>Keep the <strong>Window</strong> at <code class="bg-[#0a0a0a] px-1.5 py-0.5 rounded text-[#00c853] font-mono">252</code> days (about one trading year).</li>
        </ol>

        <div class="bg-[#0a0a0a] border border-[#222] rounded-xl p-4 my-6 font-mono text-xs">
          <div class="text-[#888] mb-2">// Z-Score (window N)</div>
          <div class="text-[#ccc]">z = (log price - rolling mean of log price) / rolling std dev</div>
        </div>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">Step 3: Add RSI and a Chart</h2>
        <ol class="list-decimal pl-6 space-y-2">
          <li>Drag an <strong class="text-white">RSI</strong> (Pro node) onto the canvas and connect Price Feed's Price Series to it.</li>
          <li>Keep <strong>Period</strong> at <code class="bg-[#0a0a0a] px-1.5 py-0.5 rounded text-[#00c853] font-mono">14</code> (the standard).</li>
          <li>Drag a <strong class="text-white">Chart</strong> node. Connect Price Feed's Price Series to <strong>Main Series</strong>.</li>
          <li>Connect the RSI node's <strong>RSI Series</strong> output to an overlay. The chart draws it in a panel below the price.</li>
        </ol>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">Step 4: Add an Alert</h2>
        <ol class="list-decimal pl-6 space-y-2">
          <li>Drag an <strong class="text-white">Alert</strong> node onto the canvas.</li>
          <li>Connect Z-Score's <strong>Z-Score</strong> output (the latest value) to the Alert's <strong>Value</strong> input.</li>
          <li>Set <strong>Trigger when</strong> to <code class="bg-[#0a0a0a] px-1.5 py-0.5 rounded text-[#00c853] font-mono">Below threshold</code> and <strong>Threshold</strong> to <code class="bg-[#0a0a0a] px-1.5 py-0.5 rounded text-[#00c853] font-mono">-2</code>.</li>
        </ol>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">Step 5: Run and Read the Result</h2>
        <ol class="list-decimal pl-6 space-y-2">
          <li>Click <strong class="text-[#00c853]">▶ Run</strong>.</li>
          <li>The Z-Score node shows the latest value. The Alert shows <strong>Triggered</strong> when the value is below -2, and <strong>Watching</strong> otherwise.</li>
          <li>The Alert only reports the state inside the editor. It does not send notifications, so check the pipeline when you want an update.</li>
        </ol>

        <div class="bg-[#111] border border-[#222] rounded-xl p-6 my-8">
          <h3 class="text-[#00c853] text-sm font-mono tracking-widest mb-3">TIP: Check the Forecast Before You Trust a Signal</h3>
          <p class="text-[#ccc] text-sm">Add a <strong class="text-white">Forecast</strong> node to the Price Series and connect its Forecast output to the chart. The Skill vs No Change output shows how the chosen model did against the "no change" forecast on this asset's own past. If skill is near zero, the model has no edge here.</p>
        </div>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">Tuning Your Strategy</h2>
        <ul class="list-disc pl-6 space-y-2">
          <li><strong class="text-white">Shorten the Z-Score window</strong> (e.g., 60) to react to shorter swings, at the cost of more noise.</li>
          <li><strong class="text-white">Combine signals</strong> with a Weighted Average node: connect RSI and Z-Score to its inputs and display the result.</li>
          <li><strong class="text-white">Compare with a reference</strong> using Compare to Reference, for example against a fair value or a target price, to label the price as Undervalued or Overvalued within a tolerance band.</li>
        </ul>

        <div class="bg-[#0a0a0a] border border-[#222] rounded-xl p-4 my-6 font-mono text-xs">
          <div class="text-[#888] mb-2">// Pipeline nodes used in this tutorial</div>
          <div class="text-[#ccc]">[</div>
          <div class="text-[#ccc] ml-4">{ "type": "symbolInput", "data": { "symbol": "AAPL" } },</div>
          <div class="text-[#ccc] ml-4">{ "type": "priceFeed", "data": {} },</div>
          <div class="text-[#ccc] ml-4">{ "type": "zScore", "data": { "window": 252 } },</div>
          <div class="text-[#ccc] ml-4">{ "type": "rsiIndicator", "data": { "period": 14 } },</div>
          <div class="text-[#ccc] ml-4">{ "type": "chartOutput", "data": {} },</div>
          <div class="text-[#ccc] ml-4">{ "type": "alertOutput", "data": { "condition": "below", "threshold": -2 } }</div>
          <div class="text-[#ccc]">]</div>
        </div>

        <p class="mt-8">
          Check the complete <NuxtLink to="/blog/pipeline-nodes-reference" class="text-[#00c853] hover:underline">Pipeline Node Reference</NuxtLink> for all 21 node types.
        </p>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'landing' })

useHead({
  title: 'Advanced Pipeline: Z-Score and RSI Mean Reversion — Kalmate Tutorial',
  meta: [
    { name: 'description', content: 'Build a mean-reversion check in Kalmate\'s visual pipeline: a Z-Score and RSI on one asset, with an Alert when the Z-Score drops below -2. Shows the state in the editor; no notifications.' },
    { name: 'keywords', content: 'kalmate advanced pipeline, mean reversion, z-score, RSI calculation, alert node, visual pipeline tutorial' },
  ],
})
</script>