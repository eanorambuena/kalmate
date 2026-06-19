<template>
  <div class="min-h-screen bg-[#0a0a0a]">
    <Header />

    <main class="max-w-4xl mx-auto px-6 pt-24 pb-24">
      <h1 class="text-4xl md:text-5xl font-bold text-white mb-4">{{ $t('staticPages.blog.title') }}</h1>
      <p class="text-[#888] text-lg mb-12">{{ $t('staticPages.blog.subtext') }}</p>

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
            {{ $t('staticPages.blog.readMore') }}
          </NuxtLink>
        </article>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'landing' })

const { t } = useI18n()

const rawPosts = computed(() => t('staticPages.blog.posts'))

const posts = computed(() => [
  {
    slug: 'what-is-a-financial-terminal',
    title: rawPosts.value.terminal.title,
    excerpt: rawPosts.value.terminal.excerpt,
    date: rawPosts.value.terminal.date,
    category: t('staticPages.blog.categories.education'),
  },
  {
    slug: 'understanding-market-indicators',
    title: rawPosts.value.indicators.title,
    excerpt: rawPosts.value.indicators.excerpt,
    date: rawPosts.value.indicators.date,
    category: t('staticPages.blog.categories.tutorial'),
  },
  {
    slug: 'build-diversified-portfolio',
    title: rawPosts.value.portfolio.title,
    excerpt: rawPosts.value.portfolio.excerpt,
    date: rawPosts.value.portfolio.date,
    category: t('staticPages.blog.categories.education'),
  },
])

useHead({
  title: computed(() => t('staticPages.blog.title')),
  meta: [
    { name: 'description', content: computed(() => t('staticPages.blog.subtext')) },
    { name: 'keywords', content: 'kalmate blog, financial education, market insights, trading tutorials, technical indicators, portfolio management, SMA, EMA, Kalman filter' },
  ],
})
</script>
