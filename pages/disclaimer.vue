<template>
  <div class="min-h-screen bg-[#0a0a0a]">
    <header class="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-[#1a1a1a]">
      <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <NuxtLink to="/" class="text-[#00c853] font-bold text-xl tracking-wider">KALMATE⌘</NuxtLink>
        <div class="flex items-center gap-6">
          <NuxtLink to="/terminal" class="text-[#ccc] hover:text-white transition-colors text-sm">Terminal</NuxtLink>
          <NuxtLink to="/about" class="text-[#ccc] hover:text-white transition-colors text-sm">About</NuxtLink>
          <NuxtLink to="/contact" class="text-[#ccc] hover:text-white transition-colors text-sm">Contact</NuxtLink>
        </div>
      </div>
    </header>

    <main class="max-w-3xl mx-auto px-6 pt-32 pb-24">
      <h1 class="text-4xl md:text-5xl font-bold text-white mb-6">Disclaimer</h1>
      <p class="text-[#888] text-sm mb-8">Last updated: June 2026</p>

      <section class="mb-8">
        <h2 class="text-2xl font-bold text-white mb-4">No Financial Advice</h2>
        <p class="text-[#ccc] leading-relaxed mb-4">
          The information provided on Kalmate is for informational and educational purposes only. It does not constitute financial advice, investment advice, trading advice, or any other type of advice.
        </p>
        <p class="text-[#ccc] leading-relaxed">
          You should not treat any content on this site as a recommendation to buy, sell, or hold any security or financial instrument.
        </p>
      </section>

      <section class="mb-8">
        <h2 class="text-2xl font-bold text-white mb-4">Data Accuracy</h2>
        <p class="text-[#ccc] leading-relaxed">
          Market data displayed on Kalmate is provided by third-party sources (Yahoo Finance) and may be delayed. We do not guarantee the accuracy, completeness, or timeliness of the data. Do not use this data for trading decisions without verifying it with your broker or data provider.
        </p>
      </section>

      <section class="mb-8">
        <h2 class="text-2xl font-bold text-white mb-4">No Guarantee</h2>
        <p class="text-[#ccc] leading-relaxed">
          Kalmate is provided "as is" without any representations or warranties, express or implied. We make no representations or warranties regarding the availability, reliability, or accuracy of the service.
        </p>
      </section>

      <section class="mb-8">
        <h2 class="text-2xl font-bold text-white mb-4">Investment Risk</h2>
        <p class="text-[#ccc] leading-relaxed">
          Investing in financial markets involves substantial risk of loss. Past performance is not indicative of future results. You should consult a qualified financial advisor before making any investment decisions.
        </p>
      </section>

      <section class="mb-8">
        <h2 class="text-2xl font-bold text-white mb-4">Third-Party Links</h2>
        <p class="text-[#ccc] leading-relaxed">
          Kalmate may contain links to third-party websites or services. We are not responsible for the content, privacy practices, or availability of these external sites.
        </p>
      </section>

      <section class="mb-8">
        <h2 class="text-2xl font-bold text-white mb-4">Advertising</h2>
        <p class="text-[#ccc] leading-relaxed">
          Kalmate displays advertisements via Google AdSense. We do not endorse any products or services advertised on this site.
        </p>
      </section>

      <section>
        <h2 class="text-2xl font-bold text-white mb-4">Contact</h2>
        <p class="text-[#ccc] leading-relaxed">
          If you have questions about this disclaimer, contact:
          <a href="mailto:contact@kalmate.pages.dev" class="text-[#00c853] hover:underline">contact@kalmate.pages.dev</a>
        </p>
      </section>
    </main>

    <footer class="py-12 px-6 border-t border-[#1a1a1a]">
      <div class="max-w-6xl mx-auto text-center">
        <span class="text-[#00c853] font-bold text-lg tracking-wider">KALMATE⌘</span>
        <div class="flex justify-center gap-6 mt-6 text-xs text-[#888]">
          <NuxtLink to="/about" class="hover:text-white transition-colors">About</NuxtLink>
          <NuxtLink to="/contact" class="hover:text-white transition-colors">Contact</NuxtLink>
          <NuxtLink to="/privacy" class="hover:text-white transition-colors">Privacy</NuxtLink>
          <NuxtLink to="/terms" class="hover:text-white transition-colors">Terms</NuxtLink>
          <NuxtLink to="/disclaimer" class="hover:text-white transition-colors">Disclaimer</NuxtLink>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Disclaimer — Kalmate',
  meta: [
    { name: 'description', content: 'Kalmate disclaimer. The information on this site is for informational purposes only and does not constitute financial advice.' },
  ],
})
</script>
