<template>
  <div class="min-h-screen bg-[#0a0a0a]">
    <Header />

    <main class="max-w-3xl mx-auto px-6 pt-24 pb-24">
      <h1 class="text-4xl md:text-5xl font-bold text-white mb-6">Contact Us</h1>
      <p class="text-[#ccc] text-lg leading-relaxed mb-12">
        Have a question, suggestion, or feedback? We'd love to hear from you.
      </p>

      <div class="bg-[#111] border border-[#222] rounded-2xl p-8 mb-8">
        <h2 class="text-xl font-bold text-white mb-4">Email</h2>
        <p class="text-[#ccc] mb-2">Send us an email at:</p>
        <a href="mailto:a25.eanorambuena@gmail.com" class="text-[#00c853] hover:underline text-lg font-medium">a25.eanorambuena@gmail.com</a>
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

    <AppFooter />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'landing' })

useHead({
  title: 'Contact Kalmate — Get in Touch | Financial Terminal Support',
  meta: [
    { name: 'description', content: 'Contact the Kalmate team. Send us an email at a25.eanorambuena@gmail.com or open an issue on GitHub for support with the financial terminal.' },
    { name: 'keywords', content: 'contact kalmate, financial terminal support, kalmate email, kalmate github' },
  ],
})
</script>
