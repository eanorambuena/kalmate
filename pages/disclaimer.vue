<template>
  <div class="min-h-screen bg-[#0a0a0a]">
    <Header />

    <main class="max-w-3xl mx-auto px-6 pt-24 pb-24">
      <h1 class="text-4xl md:text-5xl font-bold text-white mb-6">{{ $t('staticPages.disclaimer.title') }}</h1>
      <p class="text-[#888] text-sm mb-8">{{ $t('staticPages.disclaimer.updated') }}</p>

      <section v-for="section in sections" :key="section.title" class="mb-8">
        <h2 class="text-2xl font-bold text-white mb-4">{{ section.title }}</h2>
        <p v-if="section.text1" class="text-[#ccc] leading-relaxed mb-4">
          {{ section.text1 }}
        </p>
        <p v-if="section.text2" class="text-[#ccc] leading-relaxed">
          {{ section.text2 }}
        </p>
        <p v-if="section.text && !section.text1" class="text-[#ccc] leading-relaxed">
          {{ section.text }}
          <a v-if="section.title === 'Contact'" href="mailto:a25.eanorambuena@gmail.com" class="text-[#00c853] hover:underline">a25.eanorambuena@gmail.com</a>
        </p>
      </section>
    </main>

    <AppFooter />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'landing' })

const { t } = useI18n()

const sections = computed(() => t('staticPages.disclaimer.sections'))

useHead({
  title: computed(() => t('staticPages.disclaimer.title')),
  meta: [
    { name: 'description', content: computed(() => t('staticPages.disclaimer.updated')) },
    { name: 'keywords', content: 'kalmate disclaimer, financial disclaimer, investment disclaimer, market data disclaimer' },
  ],
})
</script>
