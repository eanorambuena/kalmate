<template>
  <div class="min-h-screen bg-[#0a0a0a]">
    <Header />

    <main class="max-w-4xl mx-auto px-6 pt-24 pb-24">
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

    <AppFooter />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'landing' })

const allPosts = [
  {
    slug: 'what-is-a-financial-terminal',
    title: 'What Is a Financial Terminal and Why Do You Need One?',
    excerpt: 'Bloomberg costs $24K/year. Kalmate is free. Compare costs, explore 29 symbols across 6 asset classes, and see real-time AAPL data in action.',
    date: 'June 15, 2026',
    category: 'Education',
  },
  {
    slug: 'understanding-market-indicators',
    title: 'Understanding Market Indicators: SMA, EMA, and Kalman Filters',
    excerpt: 'See SMA(3) vs EMA(3) calculated step by step with real numbers. Learn when to use each indicator and try them live in Kalmate\'s Pipeline.',
    date: 'June 10, 2026',
    category: 'Tutorial',
  },
  {
    slug: 'build-diversified-portfolio',
    title: 'How to Build a Diversified Portfolio in 2026',
    excerpt: 'Step-by-step guide with real symbols: SPY, QQQ, ^TNX, GC=F, BTC-USD. Track your diversified portfolio live in Kalmate\'s free Portfolio Tracker.',
    date: 'June 5, 2026',
    category: 'Education',
  },
  {
    slug: 'first-pipeline-tutorial',
    title: 'Your First Pipeline: Symbol Input → Kalman Filter → Chart Output',
    excerpt: 'Step-by-step beginner tutorial: build a live price-smoothing pipeline in 5 minutes. Drag nodes, connect them, watch real-time AAPL data flow.',
    date: 'June 21, 2026',
    category: 'Tutorial',
  },
  {
    slug: 'advanced-pipeline-mean-reversion',
    title: 'Advanced Pipeline: Multi-Symbol Mean-Reversion with RSI + SMA',
    excerpt: 'Build a mean-reversion strategy: Multi-Symbol Input → RSI → SMA → Alert Output. Get browser notifications when assets hit oversold levels.',
    date: 'June 28, 2026',
    category: 'Tutorial',
  },
  {
    slug: 'pipeline-nodes-reference',
    title: 'All 18 Pipeline Nodes Explained: When to Use Each',
    excerpt: 'Complete reference: 7 Input nodes, 6 Process nodes (Kalman, SMA, EMA, RSI, Math, Forecast), 5 Output nodes. When to use each with examples.',
    date: 'July 5, 2026',
    category: 'Reference',
  },
]

const now = new Date()
const posts = allPosts
  .filter(p => new Date(p.date) <= now)
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

useHead({
  title: 'Blog — Kalmate | Financial Education & Market Insights',
  meta: [
    { name: 'description', content: 'Market insights, tutorials, and financial education from Kalmate. Learn about technical indicators like SMA, EMA, Kalman filters, portfolio diversification, and financial terminals.' },
    { name: 'keywords', content: 'kalmate blog, financial education, market insights, trading tutorials, technical indicators, portfolio management, SMA, EMA, Kalman filter' },
  ],
})
</script>
