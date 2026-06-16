<template>
  <div class="min-h-screen bg-[#0a0a0a]">
    <header class="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-[#1a1a1a]">
      <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <NuxtLink to="/" class="text-[#00c853] font-bold text-xl tracking-wider">KALMATE⌘</NuxtLink>
        <div class="flex items-center gap-6">
          <NuxtLink to="/terminal" class="text-[#ccc] hover:text-white transition-colors text-sm">Terminal</NuxtLink>
          <NuxtLink to="/blog" class="text-white text-sm">Blog</NuxtLink>
          <NuxtLink to="/about" class="text-[#ccc] hover:text-white transition-colors text-sm">About</NuxtLink>
          <NuxtLink to="/contact" class="text-[#ccc] hover:text-white transition-colors text-sm">Contact</NuxtLink>
        </div>
      </div>
    </header>

    <main class="max-w-4xl mx-auto px-6 pt-32 pb-24">
      <h1 class="text-4xl md:text-5xl font-bold text-white mb-4">Blog</h1>
      <p class="text-[#888] text-lg mb-12">Market insights, tutorials, and financial education.</p>

      <div class="space-y-8">
        <article v-for="post in posts" :key="post.slug" class="bg-[#111] border border-[#222] rounded-2xl p-8 hover:border-[#00c853]/30 transition-all">
          <div class="flex items-center gap-3 text-xs text-[#888] mb-3">
            <span>{{ post.date }}</span>
            <span class="w-1 h-1 rounded-full bg-[#555]" />
            <span class="text-[#00c853]">{{ post.category }}</span>
          </div>
          <h2 class="text-2xl font-bold text-white mb-3">
            <NuxtLink :to="`/blog/${post.slug}`" class="hover:text-[#00c853] transition-colors">
              {{ post.title }}
            </NuxtLink>
          </h2>
          <p class="text-[#ccc] leading-relaxed mb-4">{{ post.excerpt }}</p>
          <NuxtLink :to="`/blog/${post.slug}`" class="text-[#00c853] text-sm font-medium hover:underline">
            Read more →
          </NuxtLink>
        </article>
      </div>
    </main>

    <footer class="py-12 px-6 border-t border-[#1a1a1a]">
      <div class="max-w-6xl mx-auto text-center">
        <span class="text-[#00c853] font-bold text-lg tracking-wider">KALMATE⌘</span>
        <p class="text-[#888] text-sm mt-4">Real-time financial data at your fingertips.</p>
        <div class="flex justify-center gap-4 mt-6 text-xs text-[#888]">
          <NuxtLink to="/about" class="hover:text-white transition-colors">About</NuxtLink>
          <NuxtLink to="/contact" class="hover:text-white transition-colors">Contact</NuxtLink>
          <NuxtLink to="/blog" class="hover:text-white transition-colors">Blog</NuxtLink>
          <NuxtLink to="/privacy" class="hover:text-white transition-colors">Privacy</NuxtLink>
          <NuxtLink to="/terms" class="hover:text-white transition-colors">Terms</NuxtLink>
          <NuxtLink to="/disclaimer" class="hover:text-white transition-colors">Disclaimer</NuxtLink>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const posts = [
  {
    slug: 'what-is-a-financial-terminal',
    title: 'What Is a Financial Terminal and Why Do You Need One?',
    excerpt: 'Financial terminals provide real-time market data, analytics, and trading tools. Learn how Kalmate brings these capabilities for free.',
    date: 'June 15, 2026',
    category: 'Education',
  },
  {
    slug: 'understanding-market-indicators',
    title: 'Understanding Market Indicators: SMA, EMA, and Kalman Filters',
    excerpt: 'A beginner-friendly guide to technical indicators and how they help you analyze market trends and make informed decisions.',
    date: 'June 10, 2026',
    category: 'Tutorial',
  },
  {
    slug: 'build-diversified-portfolio',
    title: 'How to Build a Diversified Portfolio in 2026',
    excerpt: 'Learn the principles of portfolio diversification across equities, bonds, commodities, and crypto using free tools.',
    date: 'June 5, 2026',
    category: 'Education',
  },
]

useHead({
  title: 'Blog — Kalmate | Financial Education & Market Insights',
  meta: [
    { name: 'description', content: 'Market insights, tutorials, and financial education from Kalmate. Learn about technical indicators like SMA, EMA, Kalman filters, portfolio diversification, and financial terminals.' },
    { name: 'keywords', content: 'kalmate blog, financial education, market insights, trading tutorials, technical indicators, portfolio management, SMA, EMA, Kalman filter' },
  ],
})
</script>
