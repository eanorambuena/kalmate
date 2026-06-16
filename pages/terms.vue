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
      <h1 class="text-4xl md:text-5xl font-bold text-white mb-6">Terms of Service</h1>
      <p class="text-[#888] text-sm mb-8">Last updated: June 2026</p>

      <section class="mb-8">
        <h2 class="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
        <p class="text-[#ccc] leading-relaxed">
          By using Kalmate, you agree to these Terms of Service. If you do not agree, do not use the service.
        </p>
      </section>

      <section class="mb-8">
        <h2 class="text-2xl font-bold text-white mb-4">2. Service Description</h2>
        <p class="text-[#ccc] leading-relaxed">
          Kalmate is a free financial data visualization tool that provides real-time market data from public APIs. The service is provided "as is" without any warranty.
        </p>
      </section>

      <section class="mb-8">
        <h2 class="text-2xl font-bold text-white mb-4">3. No Financial Advice</h2>
        <p class="text-[#ccc] leading-relaxed">
          Kalmate does not provide financial advice, investment recommendations, or trading signals. All data is for informational and educational purposes only. Always consult a qualified financial advisor before making investment decisions.
        </p>
      </section>

      <section class="mb-8">
        <h2 class="text-2xl font-bold text-white mb-4">4. Data Accuracy</h2>
        <p class="text-[#ccc] leading-relaxed">
          While we strive to provide accurate and timely data, we make no guarantees about the accuracy, completeness, or timeliness of the information displayed. Data may be delayed and should not be used for trading decisions.
        </p>
      </section>

      <section class="mb-8">
        <h2 class="text-2xl font-bold text-white mb-4">5. User Responsibilities</h2>
        <p class="text-[#ccc] leading-relaxed">
          You agree not to misuse the service, including attempting to disrupt, overload, or gain unauthorized access to our systems.
        </p>
      </section>

      <section class="mb-8">
        <h2 class="text-2xl font-bold text-white mb-4">6. Limitation of Liability</h2>
        <p class="text-[#ccc] leading-relaxed">
          Kalmate and its creators shall not be liable for any damages arising from the use or inability to use the service.
        </p>
      </section>

      <section class="mb-8">
        <h2 class="text-2xl font-bold text-white mb-4">7. Changes to Terms</h2>
        <p class="text-[#ccc] leading-relaxed">
          We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.
        </p>
      </section>

      <section class="mb-8">
        <h2 class="text-2xl font-bold text-white mb-4">8. Contact</h2>
        <p class="text-[#ccc] leading-relaxed">
          For questions about these terms, contact:
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
  title: 'Terms of Service — Kalmate | Terms & Conditions',
  meta: [
    { name: 'description', content: 'Kalmate Terms of Service governing the use of the free open-source financial terminal, data pipeline, and portfolio tracking tools.' },
    { name: 'keywords', content: 'kalmate terms, terms of service, financial terminal terms, open source terms' },
  ],
})
</script>
