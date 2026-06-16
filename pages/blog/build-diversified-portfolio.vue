<template>
  <div class="min-h-screen bg-[#0a0a0a]">
    <Header />

    <main class="max-w-3xl mx-auto px-6 pt-24 pb-24">
      <div class="flex items-center gap-3 text-xs text-[#888] mb-4">
        <NuxtLink to="/blog" class="hover:text-white transition-colors">← Back to Blog</NuxtLink>
        <span class="w-1 h-1 rounded-full bg-[#555]" />
        <span>June 5, 2026</span>
        <span class="w-1 h-1 rounded-full bg-[#555]" />
        <span class="text-[#00c853]">Education</span>
      </div>

      <h1 class="text-4xl md:text-5xl font-bold text-white mb-6">How to Build a Diversified Portfolio in 2026</h1>

      <div class="prose prose-invert max-w-none text-[#ccc] leading-relaxed space-y-4">
        <p class="text-lg">
          Diversification is the practice of spreading investments across assets that behave differently. When stocks drop, bonds often rise. When the dollar weakens, gold typically gains. The goal: smoother returns over time.
        </p>

        <div class="bg-[#111] border border-[#222] rounded-xl p-6 my-6">
          <h3 class="text-[#00c853] text-sm font-mono tracking-widest mb-4">SAMPLE DIVERSIFIED PORTFOLIO</h3>
          <p class="text-xs text-[#888] mb-4">Track this portfolio live in <NuxtLink to="/terminal/portfolio" class="text-[#00c853] hover:underline">Kalmate's Portfolio Tracker</NuxtLink></p>
          <div class="overflow-x-auto">
            <table class="text-xs w-full">
              <thead>
                <tr class="text-[#888] border-b border-[#222]">
                  <th class="text-left py-2 pr-4">Asset</th>
                  <th class="text-left py-2 pr-4">Symbol</th>
                  <th class="text-right py-2 pr-4">Allocation</th>
                  <th class="text-right py-2 pr-4">Shares</th>
                  <th class="text-left py-2 pl-4">Role</th>
                </tr>
              </thead>
              <tbody class="text-[#ccc]">
                <tr class="border-b border-[#1a1a1a]">
                  <td class="py-2 pr-4 font-bold text-white">S&P 500 ETF</td>
                  <td class="py-2 pr-4 text-[#2979ff]">SPY</td>
                  <td class="text-right py-2 pr-4">40%</td>
                  <td class="text-right py-2 pr-4">10</td>
                  <td class="text-left py-2 pl-4">Core US equities</td>
                </tr>
                <tr class="border-b border-[#1a1a1a]">
                  <td class="py-2 pr-4 font-bold text-white">Nasdaq ETF</td>
                  <td class="py-2 pr-4 text-[#2979ff]">QQQ</td>
                  <td class="text-right py-2 pr-4">15%</td>
                  <td class="text-right py-2 pr-4">5</td>
                  <td class="text-left py-2 pl-4">Tech/growth exposure</td>
                </tr>
                <tr class="border-b border-[#1a1a1a]">
                  <td class="py-2 pr-4 font-bold text-white">US 10Y Bond</td>
                  <td class="py-2 pr-4 text-[#2979ff]">^TNX</td>
                  <td class="text-right py-2 pr-4">20%</td>
                  <td class="text-right py-2 pr-4">—</td>
                  <td class="text-left py-2 pl-4">Fixed income hedge</td>
                </tr>
                <tr class="border-b border-[#1a1a1a]">
                  <td class="py-2 pr-4 font-bold text-white">Gold</td>
                  <td class="py-2 pr-4 text-[#2979ff]">GC=F</td>
                  <td class="text-right py-2 pr-4">10%</td>
                  <td class="text-right py-2 pr-4">—</td>
                  <td class="text-left py-2 pl-4">Inflation hedge</td>
                </tr>
                <tr class="border-b border-[#1a1a1a]">
                  <td class="py-2 pr-4 font-bold text-white">Crude Oil</td>
                  <td class="py-2 pr-4 text-[#2979ff]">CL=F</td>
                  <td class="text-right py-2 pr-4">5%</td>
                  <td class="text-right py-2 pr-4">—</td>
                  <td class="text-left py-2 pl-4">Commodity diversification</td>
                </tr>
                <tr class="border-b border-[#1a1a1a]">
                  <td class="py-2 pr-4 font-bold text-white">Bitcoin</td>
                  <td class="py-2 pr-4 text-[#2979ff]">BTC-USD</td>
                  <td class="text-right py-2 pr-4">5%</td>
                  <td class="text-right py-2 pr-4">—</td>
                  <td class="text-left py-2 pl-4">Alternative asset</td>
                </tr>
                <tr>
                  <td class="py-2 pr-4 font-bold text-white">Ethereum</td>
                  <td class="py-2 pr-4 text-[#2979ff]">ETH-USD</td>
                  <td class="text-right py-2 pr-4">5%</td>
                  <td class="text-right py-2 pr-4">—</td>
                  <td class="text-left py-2 pl-4">Alternative asset</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="border-t border-[#222] mt-4 pt-4 text-xs text-[#888]">
            <span class="text-white">Total allocation:</span> 100% | All symbols trackable in Kalmate's Market Dashboard
          </div>
        </div>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">Step 1: Core Equities (40%)</h2>
        <p>
          Start with a broad market ETF. <NuxtLink to="/terminal/stock/SPY" class="text-[#00c853] hover:underline">SPY</NuxtLink> tracks the S&P 500, giving you exposure to 500 of the largest US companies across all sectors. In Kalmate, you can see SPY's current price, 52-week high/low, volume, and market cap instantly.
        </p>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">Step 2: Growth Exposure (15%)</h2>
        <p>
          <NuxtLink to="/terminal/stock/QQQ" class="text-[#00c853] hover:underline">QQQ</NuxtLink> tracks the Nasdaq-100, heavy on tech: Apple, Microsoft, Nvidia, Meta, Google, Amazon, Tesla. In 2026, tech continues to drive market returns in the AI era. Use Kalmate's <NuxtLink to="/terminal/screener" class="text-[#00c853] hover:underline">Screener</NuxtLink> with the "Tech Stocks" preset to discover more.
        </p>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">Step 3: Bonds for Stability (20%)</h2>
        <p>
          When equities drop, bonds historically rise. The <NuxtLink to="/terminal/stock/%5ETNX" class="text-[#00c853] hover:underline">US 10-Year Treasury yield (^TNX)</NuxtLink> is the benchmark. Track it alongside the 5-year (^FVX) and 30-year (^TYX) in Kalmate's bond section. In 2026 with rates where they are, a 20% bond allocation provides meaningful downside protection.
        </p>

        <div class="bg-[#111] border border-[#222] rounded-xl p-6 my-6">
          <h3 class="text-[#2979ff] text-sm font-mono tracking-widest mb-3">ASSET CORRELATION IN 2026</h3>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div class="bg-[#0a0a0a] rounded-lg p-4">
              <div class="text-[#00c853] text-xs mb-1">Low correlation pairs</div>
              <div class="text-[#ccc]">Stocks ↔ Bonds</div>
              <div class="text-[#ccc]">Stocks ↔ Gold</div>
              <div class="text-[#ccc]">Bonds ↔ Commodities</div>
            </div>
            <div class="bg-[#0a0a0a] rounded-lg p-4">
              <div class="text-[#888] text-xs mb-1">High correlation pairs</div>
              <div class="text-[#ccc]">SPY ↔ QQQ</div>
              <div class="text-[#ccc]">BTC ↔ ETH</div>
              <div class="text-[#ccc]">Gold ↔ Silver</div>
            </div>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">Step 4: Commodities (15%)</h2>
        <p>
          Gold (<NuxtLink to="/terminal/stock/GC%3DF" class="text-[#00c853] hover:underline">GC=F</NuxtLink>) acts as an inflation hedge and store of value. Silver (<NuxtLink to="/terminal/stock/SI%3DF" class="text-[#00c853] hover:underline">SI=F</NuxtLink>) has industrial demand too. Crude Oil (<NuxtLink to="/terminal/stock/CL%3DF" class="text-[#00c853] hover:underline">CL=F</NuxtLink>) moves with economic activity. These assets often zig when equities zag. Track all five of Kalmate's commodity symbols in real time.
        </p>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">Step 5: Crypto (10%)</h2>
        <p>
          Bitcoin (<NuxtLink to="/terminal/stock/BTC-USD" class="text-[#00c853] hover:underline">BTC-USD</NuxtLink>) and Ethereum (<NuxtLink to="/terminal/stock/ETH-USD" class="text-[#00c853] hover:underline">ETH-USD</NuxtLink>) are now established alternative assets. In 2026, institutional adoption continues to grow. Limit crypto to 5-10% due to high volatility — you can monitor both alongside Solana (<NuxtLink to="/terminal/stock/SOL-USD" class="text-[#00c853] hover:underline">SOL-USD</NuxtLink>) in Kalmate's crypto section.
        </p>

        <div class="bg-[#0a0a0a] border border-[#222] rounded-xl p-4 my-6 font-mono text-xs">
          <div class="text-[#888] mb-2">// How to set up in Kalmate</div>
          <div class="text-[#ccc]">1. Open <span class="text-[#00c853]">Market Dashboard</span> → check all 6 asset categories</div>
          <div class="text-[#ccc]">2. Open <span class="text-[#00c853]">Portfolio Tracker</span> → add positions with symbol, shares, avg price</div>
          <div class="text-[#ccc]">3. Open <span class="text-[#00c853]">Alerts</span> → set price alerts for rebalancing thresholds</div>
          <div class="text-[#888] mt-2">// Data refreshes every 30s. All data stored locally in your browser.</div>
        </div>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">Track It All in Kalmate</h2>
        <p>
          Kalmate covers every asset class mentioned above: 9 equities, 4 indices, 3 forex pairs, 4 bonds, 5 commodities, and 4 crypto symbols — all in a single dashboard. Plus the screener can find thousands more.
        </p>
        <p>
          Add positions, track real-time P&amp;L, set alerts for price targets, and use the Pipeline to build custom analysis. No sign-up, no cost.
        </p>
        <p class="mt-6">
          <NuxtLink to="/terminal/portfolio" class="inline-flex items-center gap-2 bg-[#00c853] text-black font-bold px-6 py-3 rounded-lg hover:bg-[#00e060] transition-colors text-sm">
            START TRACKING →
          </NuxtLink>
        </p>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'landing' })

useHead({
  title: 'How to Build a Diversified Portfolio in 2026 — Kalmate Blog',
  meta: [
    { name: 'description', content: 'Build a diversified portfolio step by step with real Kalmate symbols: SPY, QQQ, ^TNX, GC=F, BTC-USD. Track all assets live in Kalmate\'s free portfolio tracker.' },
    { name: 'keywords', content: 'portfolio diversification, diversified portfolio, asset allocation, SPY, QQQ, gold, bitcoin, kalmate portfolio tracker, free portfolio tracker' },
  ],
})
</script>
