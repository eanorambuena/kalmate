<template>
  <div class="min-h-screen bg-[#0a0a0a]">
    <Header />

    <main class="max-w-3xl mx-auto px-6 pt-24 pb-24">
      <h1 class="text-4xl md:text-5xl font-bold text-white mb-6">{{ $t('staticPages.terms.title') }}</h1>
      <p class="text-[#888] text-sm mb-8">{{ $t('staticPages.terms.updated') }}</p>

      <section v-for="section in sections" :key="section.title" class="mb-8">
        <h2 class="text-2xl font-bold text-white mb-4">{{ section.title }}</h2>
        <p class="text-[#ccc] leading-relaxed">
          {{ section.text }}
          <a v-if="section.isContact" href="mailto:a25.eanorambuena@gmail.com" class="text-[#00c853] hover:underline">a25.eanorambuena@gmail.com</a>
        </p>
      </section>
    </main>

    <AppFooter />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'landing' })

const { t } = useI18n()

const sections = computed(() => t('staticPages.terms.sections'))

useHead({
  title: computed(() => t('staticPages.terms.title')),
  meta: [
    { name: 'description', content: computed(() => t('staticPages.terms.updated')) },
    { name: 'keywords', content: 'kalmate terms, terms of service, financial terminal terms, open source terms' },
  ],
})
</script>
