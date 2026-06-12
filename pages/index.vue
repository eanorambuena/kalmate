<script setup lang="ts">
definePageMeta({ layout: 'landing' })

useHead({
  title: 'Kalmate — Bloomberg-Style Financial Terminal',
  meta: [
    { name: 'description', content: 'Free Bloomberg-style financial terminal with real-time market data, portfolio tracking, alerts, and professional charts. Powered by Yahoo Finance.' },
    { name: 'keywords', content: 'financial terminal, bloomberg alternative, stock market, real-time quotes, portfolio tracker, yahoo finance, chile' },
    { property: 'og:title', content: 'Kalmate — Bloomberg-Style Financial Terminal' },
    { property: 'og:description', content: 'Free Bloomberg-style financial terminal with real-time market data, portfolio tracking, alerts, and professional charts.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Kalmate — Bloomberg-Style Financial Terminal' },
  ],
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Kalmate",
        "url": "https://kalmate.app",
        "applicationCategory": "FinanceApplication",
        "operatingSystem": "Web",
        "description": "Free Bloomberg-style financial terminal with real-time market data, portfolio tracking, alerts, and professional charts.",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        },
        "author": {
          "@type": "Person",
          "name": "Emmanuel Norambuena",
          "url": "https://eanorambuena.github.io"
        }
      })
    }
  ]
})
</script>

<template>
  <div class="min-h-screen bg-[#0a0a0a]">
    <header class="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-[#1a1a1a]">
      <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <span class="text-[#00c853] font-bold text-xl tracking-wider">KALMATE⌘</span>
        <div class="flex items-center gap-6">
          <a href="/console" class="text-[#888] hover:text-white transition-colors text-sm">Console</a>
          <a href="#features" class="text-[#888] hover:text-white transition-colors text-sm">Features</a>
          <a href="#tech" class="text-[#888] hover:text-white transition-colors text-sm">Tech</a>
        </div>
      </div>
    </header>

    <section class="min-h-screen flex items-center relative overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-br from-[#00c853]/5 via-transparent to-[#2979ff]/5" />
      <div class="max-w-6xl mx-auto px-6 relative z-10">
        <div class="max-w-3xl">
          <div class="text-[#00c853] text-sm font-mono tracking-widest mb-6">REAL-TIME MARKET DATA</div>
          <h1 class="text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
            Financial Intelligence<br />
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#00c853] to-[#2979ff]">at Your Fingertips</span>
          </h1>
          <p class="text-[#aaa] text-lg md:text-xl leading-relaxed mb-8 max-w-xl">
            Free Bloomberg-style terminal powered by Yahoo Finance. Track equities, forex, bonds, commodities, and crypto with real-time data and professional-grade charts.
          </p>
          <div class="flex items-center gap-4">
            <a href="/console" class="inline-flex items-center gap-2 bg-[#00c853] text-black font-bold px-8 py-3.5 rounded-lg hover:bg-[#00e060] transition-colors text-sm tracking-wide">
              LAUNCH CONSOLE
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
            </a>
            <a href="/console/stock/AAPL" class="inline-flex items-center gap-2 border border-[#333] text-[#ccc] px-8 py-3.5 rounded-lg hover:border-[#555] transition-colors text-sm">
              VIEW SAMPLE
            </a>
          </div>
        </div>
      </div>
      <div class="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-[#00c853]/10 rounded-full blur-3xl pointer-events-none" />
    </section>

    <section id="features" class="py-32 px-6">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-20">
          <p class="text-[#00c853] text-sm font-mono tracking-widest mb-4">FEATURES</p>
          <h2 class="text-4xl md:text-5xl font-bold text-white">Professional Tools, Zero Cost</h2>
          <p class="text-[#aaa] mt-4 max-w-lg mx-auto">Everything you need to track and analyze financial markets, completely free.</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-[#111] border border-[#222] rounded-2xl p-8 hover:border-[#00c853]/30 transition-all duration-300">
            <div class="w-12 h-12 rounded-xl bg-[#00c853]/10 flex items-center justify-center mb-5">
              <svg class="w-6 h-6 text-[#00c853]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            </div>
            <h3 class="text-white font-bold text-lg mb-3">Market Dashboard</h3>
            <p class="text-[#888] text-sm leading-relaxed">Real-time quotes for equities, forex, bonds, commodities, and crypto. Organized by category with instant search.</p>
          </div>
          <div class="bg-[#111] border border-[#222] rounded-2xl p-8 hover:border-[#00c853]/30 transition-all duration-300">
            <div class="w-12 h-12 rounded-xl bg-[#00c853]/10 flex items-center justify-center mb-5">
              <svg class="w-6 h-6 text-[#00c853]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            </div>
            <h3 class="text-white font-bold text-lg mb-3">Portfolio Tracking</h3>
            <p class="text-[#888] text-sm leading-relaxed">Track your holdings with real-time P&L. Add positions, monitor performance, and make informed decisions.</p>
          </div>
          <div class="bg-[#111] border border-[#222] rounded-2xl p-8 hover:border-[#00c853]/30 transition-all duration-300">
            <div class="w-12 h-12 rounded-xl bg-[#00c853]/10 flex items-center justify-center mb-5">
              <svg class="w-6 h-6 text-[#00c853]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
            </div>
            <h3 class="text-white font-bold text-lg mb-3">Smart Alerts</h3>
            <p class="text-[#888] text-sm leading-relaxed">Set price alerts above/below thresholds. Real-time polling with browser notifications so you never miss a move.</p>
          </div>
          <div class="bg-[#111] border border-[#222] rounded-2xl p-8 hover:border-[#00c853]/30 transition-all duration-300">
            <div class="w-12 h-12 rounded-xl bg-[#00c853]/10 flex items-center justify-center mb-5">
              <svg class="w-6 h-6 text-[#00c853]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>
            </div>
            <h3 class="text-white font-bold text-lg mb-3">Powerful Screener</h3>
            <p class="text-[#888] text-sm leading-relaxed">Search and filter across thousands of instruments. Use presets or custom filters to find the right opportunities.</p>
          </div>
          <div class="bg-[#111] border border-[#222] rounded-2xl p-8 hover:border-[#00c853]/30 transition-all duration-300">
            <div class="w-12 h-12 rounded-xl bg-[#00c853]/10 flex items-center justify-center mb-5">
              <svg class="w-6 h-6 text-[#00c853]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/></svg>
            </div>
            <h3 class="text-white font-bold text-lg mb-3">Professional Charts</h3>
            <p class="text-[#888] text-sm leading-relaxed">TradingView-powered charts with 1d to 1y ranges. Technical analysis tools at your fingertips.</p>
          </div>
          <div class="bg-[#111] border border-[#222] rounded-2xl p-8 hover:border-[#00c853]/30 transition-all duration-300">
            <div class="w-12 h-12 rounded-xl bg-[#00c853]/10 flex items-center justify-center mb-5">
              <svg class="w-6 h-6 text-[#00c853]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg>
            </div>
            <h3 class="text-white font-bold text-lg mb-3">Financial News</h3>
            <p class="text-[#888] text-sm leading-relaxed">Stay informed with integrated news feed per instrument. Market-moving stories right where you need them.</p>
          </div>
        </div>
      </div>
    </section>

    <section id="tech" class="py-32 px-6 bg-[#060606]">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-20">
          <p class="text-[#00c853] text-sm font-mono tracking-widest mb-4">TECHNOLOGY</p>
          <h2 class="text-4xl md:text-5xl font-bold text-white">Built for Performance</h2>
        </div>
        <div class="flex flex-wrap justify-center gap-4">
          <span class="px-6 py-3 bg-[#111] border border-[#222] rounded-full text-[#ccc] text-sm">Nuxt 3</span>
          <span class="px-6 py-3 bg-[#111] border border-[#222] rounded-full text-[#ccc] text-sm">Vue 3</span>
          <span class="px-6 py-3 bg-[#111] border border-[#222] rounded-full text-[#ccc] text-sm">TypeScript</span>
          <span class="px-6 py-3 bg-[#111] border border-[#222] rounded-full text-[#ccc] text-sm">Tailwind CSS</span>
          <span class="px-6 py-3 bg-[#111] border border-[#222] rounded-full text-[#ccc] text-sm">TradingView Charts</span>
          <span class="px-6 py-3 bg-[#111] border border-[#222] rounded-full text-[#ccc] text-sm">Yahoo Finance API</span>
          <span class="px-6 py-3 bg-[#111] border border-[#222] rounded-full text-[#ccc] text-sm">Cloudflare Pages</span>
          <span class="px-6 py-3 bg-[#111] border border-[#222] rounded-full text-[#ccc] text-sm">Nitro Server</span>
        </div>
      </div>
    </section>

    <footer class="py-16 px-6 border-t border-[#1a1a1a]">
      <div class="max-w-6xl mx-auto text-center">
        <span class="text-[#00c853] font-bold text-lg tracking-wider">KALMATE⌘</span>
        <p class="text-[#555] text-sm mt-4">Real-time financial data at your fingertips.</p>
        <div class="flex justify-center gap-6 mt-8 text-xs text-[#555]">
          <span>Data: Yahoo Finance</span>
          <span>Deploy: Cloudflare Pages</span>
        </div>
      </div>
    </footer>
  </div>
</template>
