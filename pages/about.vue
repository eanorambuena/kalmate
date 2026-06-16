<template>
  <div class="min-h-screen bg-[#0a0a0a]">
    <header class="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-[#1a1a1a]">
      <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <NuxtLink to="/" class="text-[#00c853] font-bold text-xl tracking-wider">KALMATE⌘</NuxtLink>
        <div class="flex items-center gap-6">
          <NuxtLink to="/terminal" class="text-[#ccc] hover:text-white transition-colors text-sm">Terminal</NuxtLink>
          <NuxtLink to="/about" class="text-white text-sm">About</NuxtLink>
          <NuxtLink to="/contact" class="text-[#ccc] hover:text-white transition-colors text-sm">Contact</NuxtLink>
        </div>
      </div>
    </header>

    <main class="max-w-3xl mx-auto px-6 pt-32 pb-24">
      <h1 class="text-4xl md:text-5xl font-bold text-white mb-6">About Kalmate</h1>
      <p class="text-[#ccc] text-lg leading-relaxed mb-8">
        Kalmate is a free, Bloomberg-style financial terminal built for modern web. It provides real-time market data, professional charts, portfolio tracking, and advanced tools — all at zero cost.
      </p>

      <section class="mb-12">
        <h2 class="text-2xl font-bold text-white mb-4">Why Kalmate?</h2>
        <p class="text-[#ccc] leading-relaxed mb-4">
          Financial data tools are expensive. Bloomberg Terminal costs thousands per year. We built Kalmate to democratize access to real-time market intelligence — completely free, no sign-up required.
        </p>
        <p class="text-[#ccc] leading-relaxed">
          Powered by Yahoo Finance and TradingView charts, Kalmate delivers professional-grade market analysis directly in your browser.
        </p>
      </section>

      <section class="mb-12">
        <h2 class="text-2xl font-bold text-white mb-4">Features</h2>
        <ul class="space-y-3 text-[#ccc]">
          <li class="flex items-start gap-3">
            <span class="text-[#00c853] mt-1">&#10003;</span>
            <span><strong class="text-white">Real-time Data</strong> — Equities, forex, bonds, commodities, and crypto</span>
          </li>
          <li class="flex items-start gap-3">
            <span class="text-[#00c853] mt-1">&#10003;</span>
            <span><strong class="text-white">Professional Charts</strong> — TradingView-powered with full technical analysis</span>
          </li>
          <li class="flex items-start gap-3">
            <span class="text-[#00c853] mt-1">&#10003;</span>
            <span><strong class="text-white">Portfolio Tracking</strong> — Monitor holdings with real-time P&amp;L</span>
          </li>
          <li class="flex items-start gap-3">
            <span class="text-[#00c853] mt-1">&#10003;</span>
            <span><strong class="text-white">Smart Screener</strong> — Find opportunities across thousands of instruments</span>
          </li>
          <li class="flex items-start gap-3">
            <span class="text-[#00c853] mt-1">&#10003;</span>
            <span><strong class="text-white">Data Pipeline</strong> — Build custom analysis workflows with visual nodes</span>
          </li>
        </ul>
      </section>

      <section class="mb-12">
        <h2 class="text-2xl font-bold text-white mb-4">Open Source</h2>
        <p class="text-[#ccc] leading-relaxed">
          Kalmate is open source and free forever. You can contribute, report issues, or fork the project on GitHub.
        </p>
      </section>

      <section>
        <h2 class="text-2xl font-bold text-white mb-4">Creator</h2>
        <p class="text-[#ccc] leading-relaxed">
          Built by <a href="https://eanorambuena.github.io" target="_blank" rel="noopener noreferrer" class="text-[#00c853] hover:underline">Emmanuel Norambuena</a>.
        </p>
      </section>
    </main>

    <footer class="py-12 px-6 border-t border-[#1a1a1a]">
      <div class="max-w-6xl mx-auto text-center">
        <span class="text-[#00c853] font-bold text-lg tracking-wider">KALMATE⌘</span>
        <p class="text-[#888] text-sm mt-4">Real-time financial data at your fingertips.</p>
        <div class="flex justify-center gap-6 mt-6 text-xs text-[#888]">
          <NuxtLink to="/about" class="hover:text-white transition-colors">About</NuxtLink>
          <NuxtLink to="/contact" class="hover:text-white transition-colors">Contact</NuxtLink>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'About Kalmate — Free Financial Terminal',
  meta: [
    { name: 'description', content: 'Learn about Kalmate, the free Bloomberg-style financial terminal with real-time market data, professional charts, and portfolio tracking.' },
  ],
})
</script>
