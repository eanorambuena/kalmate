<template>
  <div class="min-h-screen bg-[#0a0a0a]">
    <Header />

    <main class="max-w-3xl mx-auto px-6 pt-24 pb-24">
      <h1 class="text-4xl md:text-5xl font-bold text-white mb-6">{{ $t('staticPages.contact.title') }}</h1>
      <p class="text-[#ccc] text-lg leading-relaxed mb-12">
        {{ $t('staticPages.contact.intro') }}
      </p>

      <div class="bg-[#111] border border-[#222] rounded-2xl p-8 mb-8">
        <h2 class="text-xl font-bold text-white mb-4">{{ $t('staticPages.contact.email') }}</h2>
        <p class="text-[#ccc] mb-2">{{ $t('staticPages.contact.emailText') }}</p>
        <a href="mailto:a25.eanorambuena@gmail.com" class="text-[#00c853] hover:underline text-lg font-medium">a25.eanorambuena@gmail.com</a>
      </div>

      <div class="bg-[#111] border border-[#222] rounded-2xl p-8 mb-8">
        <h2 class="text-xl font-bold text-white mb-4">{{ $t('staticPages.contact.github') }}</h2>
        <p class="text-[#ccc] mb-2">{{ $t('staticPages.contact.githubText') }}</p>
        <a href="https://github.com/eanorambuena/kalmate" target="_blank" rel="noopener noreferrer" class="text-[#00c853] hover:underline text-lg font-medium">github.com/eanorambuena/kalmate</a>
      </div>

      <div class="bg-[#111] border border-[#222] rounded-2xl p-8">
        <h2 class="text-xl font-bold text-white mb-4">{{ $t('staticPages.contact.creator') }}</h2>
        <p class="text-[#ccc] mb-2">{{ $t('staticPages.contact.creatorText') }}</p>
        <a href="https://eanorambuena.github.io" target="_blank" rel="noopener noreferrer" class="text-[#00c853] hover:underline text-lg font-medium">eanorambuena.github.io</a>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'landing' })

const { t } = useI18n()

useHead({
  title: computed(() => t('staticPages.contact.title')),
  meta: [
    { name: 'description', content: computed(() => t('staticPages.contact.intro')) },
    { name: 'keywords', content: 'contact kalmate, financial terminal support, kalmate email, kalmate github' },
  ],
})
</script>
