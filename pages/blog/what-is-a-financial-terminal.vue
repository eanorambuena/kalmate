<template>
  <div class="min-h-screen bg-[#0a0a0a]">
    <Header />

    <main class="max-w-3xl mx-auto px-6 pt-24 pb-24">
      <div class="flex items-center gap-3 text-xs text-[#888] mb-4">
        <NuxtLink to="/blog" class="hover:text-white transition-colors">← Back to Blog</NuxtLink>
        <span class="w-1 h-1 rounded-full bg-[#555]" />
        <span>June 15, 2026</span>
        <span class="w-1 h-1 rounded-full bg-[#555]" />
        <span class="text-[#00c853]">Education</span>
      </div>

      <h1 class="text-4xl md:text-5xl font-bold text-white mb-6">What Is a Financial Terminal and Why Do You Need One?</h1>

      <div class="prose prose-invert max-w-none text-[#ccc] leading-relaxed space-y-4">
        <p class="text-lg">
          A financial terminal aggregates real-time market data, analytics, and tools into a single interface. Professional terminals like Bloomberg Terminal cost <strong class="text-white">over $24,000 per year</strong> per user.
        </p>

        <p>
          Kalmate brings the same core capabilities — live quotes, charts, portfolio tracking, screening, and alerts — directly in your browser at <strong class="text-white">zero cost</strong>, no sign-up required.
        </p>

        <div class="bg-[#111] border border-[#222] rounded-xl p-6 my-8">
          <h3 class="text-[#00c853] text-sm font-mono tracking-widest mb-3">COST COMPARISON</h3>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div class="bg-[#0a0a0a] rounded-lg p-4 border border-[#222]">
              <div class="text-[#888] mb-1">Bloomberg Terminal</div>
              <div class="text-white text-2xl font-bold">$24,000</div>
              <div class="text-[#888] text-xs">per year, per user</div>
            </div>
            <div class="bg-[#0a0a0a] rounded-lg p-4 border border-[#00c853]/30">
              <div class="text-[#888] mb-1">Kalmate</div>
              <div class="text-[#00c853] text-2xl font-bold">$0</div>
              <div class="text-[#888] text-xs">forever, unlimited users</div>
            </div>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">What Data Does Kalmate Cover?</h2>
        <p>
          Kalmate tracks <strong class="text-white">29 key symbols</strong> across <strong class="text-white">6 asset classes</strong> out of the box, with full search across thousands more via Yahoo Finance:
        </p>

        <div class="bg-[#111] border border-[#222] rounded-xl p-6 my-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 class="text-[#2979ff] font-bold mb-2">Equities</h4>
              <div class="text-[#ccc] space-y-1">
                <div>SPY, QQQ, AAPL, MSFT, GOOGL, AMZN, NVDA, META, TSLA</div>
              </div>
            </div>
            <div>
              <h4 class="text-[#2979ff] font-bold mb-2">Indices</h4>
              <div class="text-[#ccc] space-y-1">
                <div>S&P 500 (^GSPC), NASDAQ (^IXIC), DOW (^DJI), NIKKEI 225 (^N225)</div>
              </div>
            </div>
            <div>
              <h4 class="text-[#2979ff] font-bold mb-2">Forex & Bonds</h4>
              <div class="text-[#ccc] space-y-1">
                <div>USD/EUR, USD/CLP, USD/BRL, US 10Y (^TNX), US 30Y (^TYX), US 5Y (^FVX)</div>
              </div>
            </div>
            <div>
              <h4 class="text-[#2979ff] font-bold mb-2">Commodities & Crypto</h4>
              <div class="text-[#ccc] space-y-1">
                <div>Gold (GC=F), Silver (SI=F), Crude Oil (CL=F), Bitcoin (BTC-USD), Ethereum (ETH-USD)</div>
              </div>
            </div>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">Try It Now: Watch AAPL Move in Real Time</h2>
        <p>
          Open <NuxtLink to="/terminal/stock/AAPL" class="text-[#00c853] hover:underline">Kalmate's AAPL page</NuxtLink> right now. You'll see the current price, daily change, and a candlestick chart with 6 time ranges (1d to 1y). The price refreshes every <strong class="text-white">30 seconds</strong>. Come back in a few minutes and watch it update.
        </p>

        <div class="bg-[#0a0a0a] border border-[#222] rounded-xl p-4 my-6 font-mono text-xs">
          <div class="text-[#888] mb-2">// Live data flow</div>
          <div class="text-[#ccc]">Kalmate → Yahoo Finance → Real-time quote → Your browser</div>
          <div class="text-[#888] mt-2">// Cache refresh cycle</div>
          <div class="text-[#ccc]">Quotes: 30s | History: 5min | News: 5min | Search: 10min</div>
        </div>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">Core Features, No Paywall</h2>
        <ul class="list-disc pl-6 space-y-2">
          <li><strong class="text-white">Market Dashboard</strong> — 6 asset categories in a single-page view with real-time prices, change %, and color-coded movement</li>
          <li><strong class="text-white">Professional Charts</strong> — Candlestick + volume charts with 6 time ranges (1d/5d/1mo/3mo/6mo/1y)</li>
          <li><strong class="text-white">Stock Screener</strong> — Search and filter thousands of instruments with 5 presets: Top Gainers, Top Losers, Tech Stocks, Dividend, Growth</li>
          <li><strong class="text-white">Portfolio Tracker</strong> — Add positions, track real-time P&amp;L, stored locally in your browser</li>
          <li><strong class="text-white">Price Alerts</strong> — Set above/below thresholds with 30-second polling and browser notifications</li>
          <li><strong class="text-white">Data Pipeline</strong> — Visual node editor with 18 node types across 3 categories: input, process, output</li>
        </ul>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">The Pipeline: Kalmate's Superpower</h2>
        <p>
          Unlike traditional terminals, Kalmate includes a <NuxtLink to="/terminal/pipeline" class="text-[#00c853] hover:underline">visual data pipeline</NuxtLink> where you connect nodes to build custom analysis. Drag a <strong class="text-white">Symbol Input</strong>, connect it to a <strong class="text-white">Kalman Filter</strong>, then to a <strong class="text-white">Chart Output</strong> — no coding required.
        </p>
        <p>
          11 node types are free, and 7 pro nodes (SMA, EMA, RSI, Multi-Symbol Input, Forecast, Telegram, Email) add advanced capabilities.
        </p>

        <div class="bg-[#111] border border-[#222] rounded-xl p-6 my-6">
          <h3 class="text-[#00c853] text-sm font-mono tracking-widest mb-3">PIPELINE NODES</h3>
          <div class="grid grid-cols-3 gap-3 text-xs">
            <div class="bg-[#0a0a0a] rounded-lg p-3 border border-[#2979ff]/30">
              <div class="text-[#2979ff] font-bold">Input</div>
              <div class="text-[#ccc] mt-1">Symbol, Price Feed, Scalar, Currency, Multi-Symbol</div>
            </div>
            <div class="bg-[#0a0a0a] rounded-lg p-3 border border-[#00c853]/30">
              <div class="text-[#00c853] font-bold">Process</div>
              <div class="text-[#ccc] mt-1">Kalman Filter, SMA, EMA, RSI, Math, Forecast, Portfolio</div>
            </div>
            <div class="bg-[#0a0a0a] rounded-lg p-3 border border-[#ff69b4]/30">
              <div class="text-[#ff69b4] font-bold">Output</div>
              <div class="text-[#ccc] mt-1">Chart, Candle Chart, Price Display, Alert, Telegram, Email</div>
            </div>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-white mt-8 mb-4">Open Source, Free Forever</h2>
        <p>
          Kalmate is <a href="https://github.com/eanorambuena/kalmate" target="_blank" rel="noopener noreferrer" class="text-[#00c853] hover:underline">open source on GitHub</a>. Built with Nuxt 4, Vue 3, and Tailwind CSS, deployed on Cloudflare Pages. No accounts, no API keys, no hidden fees.
        </p>
        <p>
          Ready to explore? <NuxtLink to="/terminal" class="text-[#00c853] hover:underline">Launch the terminal</NuxtLink> and start tracking markets today.
        </p>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'landing' })

useHead({
  title: 'What Is a Financial Terminal? — Kalmate Blog | Market Data Tools',
  meta: [
    { name: 'description', content: 'Learn what a financial terminal is, compare Bloomberg vs Kalmate costs, see real-time AAPL data, and explore 29 symbols across 6 asset classes — all free, no sign-up.' },
    { name: 'keywords', content: 'financial terminal, bloomberg alternative, free market data, kalmate, yahoo finance terminal, real-time stock quotes, visual pipeline' },
  ],
})
</script>
