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
      <h1 class="text-4xl md:text-5xl font-bold text-white mb-6">Privacy Policy</h1>
      <p class="text-[#888] text-sm mb-8">Last updated: June 2026</p>

      <section class="mb-8">
        <h2 class="text-2xl font-bold text-white mb-4">1. Information We Collect</h2>
        <p class="text-[#ccc] leading-relaxed mb-4">
          Kalmate does not require user registration or accounts. We do not collect personal information such as names, email addresses, or payment data.
        </p>
        <p class="text-[#ccc] leading-relaxed">
          We may collect anonymous usage data through third-party services to improve our service.
        </p>
      </section>

      <section class="mb-8">
        <h2 class="text-2xl font-bold text-white mb-4">2. Cookies</h2>
        <p class="text-[#ccc] leading-relaxed mb-4">
          Kalmate uses cookies and similar technologies for the following purposes:
        </p>
        <ul class="list-disc pl-6 text-[#ccc] space-y-2">
          <li><strong class="text-white">Advertising:</strong> Google AdSense uses cookies to serve personalized ads based on your browsing activity.</li>
          <li><strong class="text-white">Analytics:</strong> We may use analytics services to understand how users interact with the site.</li>
          <li><strong class="text-white">Functional:</strong> Local storage is used to save your portfolio data (stored locally in your browser, not on our servers).</li>
        </ul>
      </section>

      <section class="mb-8">
        <h2 class="text-2xl font-bold text-white mb-4">3. Google AdSense</h2>
        <p class="text-[#ccc] leading-relaxed mb-4">
          We use Google AdSense to display advertisements. Google uses cookies to serve ads based on users' visits to this site and other websites.
        </p>
        <p class="text-[#ccc] leading-relaxed mb-4">
          You can opt out of personalized advertising by visiting <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" class="text-[#00c853] hover:underline">Google Ads Settings</a>.
        </p>
        <p class="text-[#ccc] leading-relaxed">
          As a third-party vendor, Google uses cookies to serve ads on our site. Google's use of the DART cookie enables it to serve ads based on your visits to this site and other sites on the Internet.
        </p>
      </section>

      <section class="mb-8">
        <h2 class="text-2xl font-bold text-white mb-4">4. Third-Party Services</h2>
        <p class="text-[#ccc] leading-relaxed">
          Kalmate integrates with the following third-party services:
        </p>
        <ul class="list-disc pl-6 text-[#ccc] space-y-2 mt-4">
          <li><strong class="text-white">Yahoo Finance</strong> — real-time market data</li>
          <li><strong class="text-white">TradingView</strong> — charts and technical analysis</li>
          <li><strong class="text-white">Google AdSense</strong> — advertising</li>
          <li><strong class="text-white">Cloudflare Pages</strong> — hosting and CDN</li>
        </ul>
      </section>

      <section class="mb-8">
        <h2 class="text-2xl font-bold text-white mb-4">5. Data Storage</h2>
        <p class="text-[#ccc] leading-relaxed">
          Portfolio positions, alerts, and pipeline configurations are stored locally in your browser using localStorage. We do not transmit or store this data on our servers.
        </p>
      </section>

      <section class="mb-8">
        <h2 class="text-2xl font-bold text-white mb-4">6. Your Rights</h2>
        <p class="text-[#ccc] leading-relaxed">
          Depending on your jurisdiction, you may have the right to access, correct, delete, or port your data. Since we do not store personal data on our servers, most of these rights are managed through your browser settings.
        </p>
      </section>

      <section class="mb-8">
        <h2 class="text-2xl font-bold text-white mb-4">7. Contact</h2>
        <p class="text-[#ccc] leading-relaxed">
          If you have questions about this Privacy Policy, contact us at:
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
  title: 'Privacy Policy — Kalmate',
  meta: [
    { name: 'description', content: 'Kalmate Privacy Policy. Learn how we handle cookies, data, and Google AdSense on our financial terminal.' },
  ],
})
</script>
