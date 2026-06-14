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
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
        "author": { "@type": "Person", "name": "Emmanuel Norambuena", "url": "https://eanorambuena.github.io" }
      })
    }
  ]
})

const { el: featuresEl, visible: featuresVisible } = useScrollReveal(0.1, 100)
const { el: techEl, visible: techVisible } = useScrollReveal(0.2, 200)

import AdBanner from '../components/AdBanner.vue'
import { monetization as m } from '../utils/monetization'

const features = [
  { icon: '<svg class="w-6 h-6 text-[#00c853]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>', title: 'Market Dashboard', desc: 'Real-time quotes for equities, forex, bonds, commodities, and crypto. Organized by category with instant search.' },
  { icon: '<svg class="w-6 h-6 text-[#00c853]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>', title: 'Portfolio Tracking', desc: 'Track your holdings with real-time P&L. Add positions, monitor performance, and make informed decisions.' },
  { icon: '<svg class="w-6 h-6 text-[#00c853]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>', title: 'Smart Alerts', desc: 'Set price alerts above/below thresholds. Real-time polling with browser notifications so you never miss a move.' },
  { icon: '<svg class="w-6 h-6 text-[#00c853]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>', title: 'Powerful Screener', desc: 'Search and filter across thousands of instruments. Use presets or custom filters to find the right opportunities.' },
  { icon: '<svg class="w-6 h-6 text-[#00c853]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/></svg>', title: 'Professional Charts', desc: 'TradingView-powered charts with 1d to 1y ranges. Technical analysis tools at your fingertips.' },
  { icon: '<svg class="w-6 h-6 text-[#00c853]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg>', title: 'Financial News', desc: 'Stay informed with integrated news feed per instrument. Market-moving stories right where you need them.' },
]

const tech = ['Nuxt 3', 'Vue 3', 'TypeScript', 'Tailwind CSS', 'TradingView Charts', 'Yahoo Finance API', 'Cloudflare Pages', 'Nitro Server']

const titleWords = 'Financial Intelligence at Your Fingertips'.split(' ')
</script>

<template>
  <div class="min-h-screen bg-[#0a0a0a]">
    <header class="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-[#1a1a1a]">
      <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <span class="text-[#00c853] font-bold text-xl tracking-wider">KALMATE⌘</span>
        <div class="flex items-center gap-6">
          <a href="/terminal" class="text-[#888] hover:text-white transition-colors text-sm">Terminal</a>
          <a href="#features" class="text-[#888] hover:text-white transition-colors text-sm">Features</a>
          <a href="#tech" class="text-[#888] hover:text-white transition-colors text-sm">Tech</a>
        </div>
      </div>
    </header>

    <section class="min-h-screen flex items-center relative overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-br from-[#00c853]/5 via-transparent to-[#2979ff]/5" />
      <div class="max-w-6xl mx-auto px-6 relative z-10">
        <div class="max-w-3xl">
          <div class="text-[#00c853] text-sm font-mono tracking-widest mb-6 animate-fade-in-down">REAL-TIME MARKET DATA</div>
          <h1 class="text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
            <span v-for="(word, i) in titleWords" :key="i"
              class="inline-block mr-[0.3em] animate-word-stagger"
              :class="{ 'bg-clip-text text-transparent bg-gradient-to-r from-[#00c853] to-[#2979ff]': i >= 3 }"
              :style="{ animationDelay: `${i * 0.1}s` }"
            >{{ word }}</span>
          </h1>
          <p class="text-[#aaa] text-lg md:text-xl leading-relaxed mb-8 max-w-xl animate-fade-in-up" style="animation-delay: 0.5s">
            Free Bloomberg-style terminal powered by Yahoo Finance. Track equities, forex, bonds, commodities, and crypto with real-time data and professional-grade charts.
          </p>
          <div class="flex items-center gap-4 animate-fade-in-up" style="animation-delay: 0.7s">
            <a href="/terminal" class="inline-flex items-center gap-2 bg-[#00c853] text-black font-bold px-8 py-3.5 rounded-lg hover:bg-[#00e060] transition-colors text-sm tracking-wide">
              LAUNCH TERMINAL
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
            </a>
            <a href="/terminal/stock/AAPL" class="inline-flex items-center gap-2 border border-[#333] text-[#ccc] px-8 py-3.5 rounded-lg hover:border-[#555] transition-colors text-sm">
              VIEW SAMPLE
            </a>
          </div>
        </div>
      </div>
      <div class="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-[#00c853]/10 rounded-full blur-3xl pointer-events-none animate-pulse-slow" />
    </section>

    <section id="features" class="py-32 px-6" :ref="featuresEl">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-20" :class="featuresVisible ? 'animate-fade-in-up' : 'opacity-0'">
          <p class="text-[#00c853] text-sm font-mono tracking-widest mb-4">FEATURES</p>
          <h2 class="text-4xl md:text-5xl font-bold text-white">Professional Tools, Zero Cost</h2>
          <p class="text-[#aaa] mt-4 max-w-lg mx-auto">Everything you need to track and analyze financial markets, completely free.</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div v-for="(f, i) in features" :key="f.title"
            class="bg-[#111] border border-[#222] rounded-2xl p-8 hover:border-[#00c853]/30 transition-all duration-300"
            :class="featuresVisible ? 'animate-fade-in-up' : 'opacity-0'"
            :style="{ animationDelay: `${0.1 + i * 0.1}s` }"
          >
            <div class="w-12 h-12 rounded-xl bg-[#00c853]/10 flex items-center justify-center mb-5" v-html="f.icon" />
            <h3 class="text-white font-bold text-lg mb-3">{{ f.title }}</h3>
            <p class="text-[#888] text-sm leading-relaxed">{{ f.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <section id="tech" class="py-32 px-6 bg-[#060606]" :ref="techEl">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-20" :class="techVisible ? 'animate-fade-in-up' : 'opacity-0'">
          <p class="text-[#00c853] text-sm font-mono tracking-widest mb-4">TECHNOLOGY</p>
          <h2 class="text-4xl md:text-5xl font-bold text-white">Built for Performance</h2>
        </div>
        <div class="flex flex-wrap justify-center gap-4">
          <span v-for="(t, i) in tech" :key="t"
            class="px-6 py-3 bg-[#111] border border-[#222] rounded-full text-[#ccc] text-sm"
            :class="techVisible ? 'animate-fade-in-up' : 'opacity-0'"
            :style="{ animationDelay: `${i * 0.08}s` }"
          >{{ t }}</span>
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
        <AdBanner ad-unit-id="1234567890" />

        <div class="mt-8 pt-8 border-t border-[#1a1a1a]">
          <p class="text-[#555] text-xs mb-3">Kalmate is free and open source.</p>
          <div class="flex flex-wrap items-center justify-center gap-3">
            <a
              v-if="m.githubSponsors.enabled"
              :href="m.githubSponsors.url"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 px-5 py-2.5 bg-[#ff69b4]/10 text-[#ff69b4] border border-[#ff69b4]/20 rounded-lg text-sm font-medium hover:bg-[#ff69b4]/20 transition-all"
            >
              <svg class="w-4 h-4" viewBox="0 0 16 16" fill="currentColor"><path d="m8 14.25-.345.666a.75.75 0 0 0 .69 0l-.345-.666Zm0 0 .345.666a.75.75 0 0 1-.69 0L8 14.25ZM4.268 2.47a3.72 3.72 0 0 0-3.31 1.34c-1.27 1.7-1 4.04.64 5.78l.02.02.02.02L8 14.25l6.37-4.62.02-.02.02-.02c1.64-1.74 1.91-4.08.64-5.78a3.72 3.72 0 0 0-3.31-1.34 4.9 4.9 0 0 0-3.3 1.73L8 4.69l-.44-.49a4.9 4.9 0 0 0-3.3-1.73h.02Z"/></svg>
              Sponsor on GitHub
            </a>
            <a
              v-if="m.tradingView.enabled"
              :href="m.tradingView.url"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1a1a1a] text-[#ccc] border border-[#333] rounded-lg text-sm font-medium hover:bg-[#2a2a2a] transition-all"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-4-4 1.41-1.41L11 14.17l5.59-5.59L18 10l-7 7z"/></svg>
              Trade on TradingView
            </a>
            <a
              v-if="m.interactiveBrokers.enabled"
              :href="m.interactiveBrokers.url"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1a1a1a] text-[#ccc] border border-[#333] rounded-lg text-sm font-medium hover:bg-[#2a2a2a] transition-all"
            >
              Open IBKR Account
            </a>
            <a
              v-if="m.coinbase.enabled"
              :href="m.coinbase.url"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1a1a1a] text-[#ccc] border border-[#333] rounded-lg text-sm font-medium hover:bg-[#2a2a2a] transition-all"
            >
              Buy Crypto on Coinbase
            </a>
            <a
              v-if="m.binance.enabled"
              :href="m.binance.url"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1a1a1a] text-[#ccc] border border-[#333] rounded-lg text-sm font-medium hover:bg-[#2a2a2a] transition-all"
            >
              Trade on Binance
            </a>
            <a
              v-if="m.buda.enabled"
              :href="m.buda.url"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00c853]/10 text-[#00c853] border border-[#00c853]/20 rounded-lg text-sm font-medium hover:bg-[#00c853]/20 transition-all"
            >
              {{ m.buda.label }}
            </a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
@keyframes word-stagger {
  from { opacity: 0; filter: blur(4px); transform: translateY(10px); }
  to { opacity: 1; filter: blur(0px); transform: translateY(0); }
}
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fade-in-down {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes pulse-slow {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}
.animate-word-stagger {
  animation: word-stagger 0.35s ease-out both;
}
.animate-fade-in-up {
  animation: fade-in-up 0.7s ease-out both;
}
.animate-fade-in-down {
  animation: fade-in-down 0.7s ease-out both;
}
.animate-pulse-slow {
  animation: pulse-slow 4s ease-in-out infinite;
}
</style>
