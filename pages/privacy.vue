<template>
  <div class="min-h-screen bg-[#0a0a0a]">
    <Header />

    <main class="max-w-3xl mx-auto px-6 pt-24 pb-24">
      <h1 class="text-4xl md:text-5xl font-bold text-white mb-6">{{ $t('staticPages.privacy.title') }}</h1>
      <p class="text-[#888] text-sm mb-8">{{ $t('staticPages.privacy.updated') }}</p>

      <section class="mb-8">
        <h2 class="text-2xl font-bold text-white mb-4">{{ $t('staticPages.privacy.sections.collect.title') }}</h2>
        <p class="text-[#ccc] leading-relaxed mb-4">
          {{ $t('staticPages.privacy.sections.collect.text1') }}
        </p>
        <p class="text-[#ccc] leading-relaxed">
          {{ $t('staticPages.privacy.sections.collect.text2') }}
        </p>
      </section>

      <section class="mb-8">
        <h2 class="text-2xl font-bold text-white mb-4">{{ $t('staticPages.privacy.sections.cookies.title') }}</h2>
        <p class="text-[#ccc] leading-relaxed mb-4">
          {{ $t('staticPages.privacy.sections.cookies.text') }}
        </p>
        <ul class="list-disc pl-6 text-[#ccc] space-y-2">
          <li v-for="type in cookieTypes" :key="type.label">
            <strong class="text-white">{{ type.label }}</strong> {{ type.desc }}
          </li>
        </ul>
      </section>

      <section class="mb-8">
        <h2 class="text-2xl font-bold text-white mb-4">{{ $t('staticPages.privacy.sections.adsense.title') }}</h2>
        <p class="text-[#ccc] leading-relaxed mb-4">
          {{ $t('staticPages.privacy.sections.adsense.text1') }}
        </p>
        <p class="text-[#ccc] leading-relaxed mb-4">
          {{ $t('staticPages.privacy.sections.adsense.text2') }}
          <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" class="text-[#00c853] hover:underline">{{ $t('staticPages.privacy.sections.adsense.googleAdsLink') }}</a>.
        </p>
        <p class="text-[#ccc] leading-relaxed">
          {{ $t('staticPages.privacy.sections.adsense.text3') }}
        </p>
      </section>

      <section class="mb-8">
        <h2 class="text-2xl font-bold text-white mb-4">{{ $t('staticPages.privacy.sections.thirdParty.title') }}</h2>
        <p class="text-[#ccc] leading-relaxed">
          {{ $t('staticPages.privacy.sections.thirdParty.text') }}
        </p>
        <ul class="list-disc pl-6 text-[#ccc] space-y-2 mt-4">
          <li v-for="service in thirdPartyServices" :key="service.name">
            <strong class="text-white">{{ service.name }}</strong> — {{ service.desc }}
          </li>
        </ul>
      </section>

      <section class="mb-8">
        <h2 class="text-2xl font-bold text-white mb-4">{{ $t('staticPages.privacy.sections.storage.title') }}</h2>
        <p class="text-[#ccc] leading-relaxed">
          {{ $t('staticPages.privacy.sections.storage.text') }}
        </p>
      </section>

      <section class="mb-8">
        <h2 class="text-2xl font-bold text-white mb-4">{{ $t('staticPages.privacy.sections.rights.title') }}</h2>
        <p class="text-[#ccc] leading-relaxed">
          {{ $t('staticPages.privacy.sections.rights.text') }}
        </p>
      </section>

      <section class="mb-8">
        <h2 class="text-2xl font-bold text-white mb-4">{{ $t('staticPages.privacy.sections.contact.title') }}</h2>
        <p class="text-[#ccc] leading-relaxed">
          {{ $t('staticPages.privacy.sections.contact.text') }}
          <a href="mailto:a25.eanorambuena@gmail.com" class="text-[#00c853] hover:underline">a25.eanorambuena@gmail.com</a>
        </p>
      </section>
    </main>

    <AppFooter />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'landing' })

const { t } = useI18n()

const cookieTypes = computed(() => t('staticPages.privacy.sections.cookies.types'))
const thirdPartyServices = computed(() => t('staticPages.privacy.sections.thirdParty.services'))

useHead({
  title: computed(() => t('staticPages.privacy.title')),
  meta: [
    { name: 'description', content: computed(() => t('staticPages.privacy.updated')) },
    { name: 'keywords', content: 'kalmate privacy, privacy policy, cookie policy, google adsense, data privacy' },
  ],
})
</script>
