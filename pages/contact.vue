<template>
  <div class="min-h-screen bg-[#0a0a0a]">
    <header class="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-[#1a1a1a]">
      <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <NuxtLink to="/" class="text-[#00c853] font-bold text-xl tracking-wider">KALMATE⌘</NuxtLink>
        <div class="flex items-center gap-6">
          <NuxtLink to="/terminal" class="text-[#ccc] hover:text-white transition-colors text-sm">Terminal</NuxtLink>
          <NuxtLink to="/about" class="text-[#ccc] hover:text-white transition-colors text-sm">About</NuxtLink>
          <NuxtLink to="/contact" class="text-white text-sm">Contact</NuxtLink>
        </div>
      </div>
    </header>

    <main class="max-w-3xl mx-auto px-6 pt-32 pb-24">
      <h1 class="text-4xl md:text-5xl font-bold text-white mb-6">Contact Us</h1>
      <p class="text-[#ccc] text-lg leading-relaxed mb-12">
        Have a question, suggestion, or feedback? We'd love to hear from you.
      </p>

      <div class="bg-[#111] border border-[#222] rounded-2xl p-8 mb-8">
        <h2 class="text-xl font-bold text-white mb-4">Email</h2>
        <p class="text-[#ccc] mb-2">Send us an email at:</p>
        <a href="mailto:contact@kalmate.pages.dev" class="text-[#00c853] hover:underline text-lg font-medium">contact@kalmate.pages.dev</a>
      </div>

      <div class="bg-[#111] border border-[#222] rounded-2xl p-8 mb-8">
        <h2 class="text-xl font-bold text-white mb-4">GitHub</h2>
        <p class="text-[#ccc] mb-2">Open an issue or contribute on GitHub:</p>
        <a href="https://github.com/eanorambuena/kalmate" target="_blank" rel="noopener noreferrer" class="text-[#00c853] hover:underline text-lg font-medium">github.com/eanorambuena/kalmate</a>
      </div>

      <div class="bg-[#111] border border-[#222] rounded-2xl p-8">
        <h2 class="text-xl font-bold text-white mb-4">Creator</h2>
        <p class="text-[#ccc] mb-2">Built by Emmanuel Norambuena:</p>
        <a href="https://eanorambuena.github.io" target="_blank" rel="noopener noreferrer" class="text-[#00c853] hover:underline text-lg font-medium">eanorambuena.github.io</a>
      </div>
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
  title: 'Contact Kalmate — Get in Touch',
  meta: [
    { name: 'description', content: 'Contact the Kalmate team. Send us an email or open an issue on GitHub.' },
  ],
})
</script>
