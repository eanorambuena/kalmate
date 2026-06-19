<template>
  <div class="min-h-screen bg-[#0a0a0a]">
    <Header />

    <main class="max-w-3xl mx-auto px-6 pt-24 pb-24">
      <h1 class="text-4xl md:text-5xl font-bold text-white mb-6">{{ $t('staticPages.about.title') }}</h1>
      <p class="text-[#ccc] text-lg leading-relaxed mb-8">
        {{ $t('staticPages.about.lead') }}
      </p>

      <section class="mb-12">
        <h2 class="text-2xl font-bold text-white mb-4">{{ $t('staticPages.about.why') }}</h2>
        <p class="text-[#ccc] leading-relaxed mb-4">
          {{ $t('staticPages.about.whyText') }}
        </p>
        <p class="text-[#ccc] leading-relaxed">
          {{ $t('staticPages.about.whyText2') }}
        </p>
      </section>

      <section class="mb-12">
        <h2 class="text-2xl font-bold text-white mb-4">{{ $t('staticPages.about.features') }}</h2>
        <ul class="space-y-3 text-[#ccc]">
          <li v-for="item in featureItems" :key="item.label" class="flex items-start gap-3">
            <span class="text-[#00c853] mt-1">&#10003;</span>
            <span><strong class="text-white">{{ item.label }}</strong> — {{ item.desc }}</span>
          </li>
        </ul>
      </section>

      <section class="mb-12">
        <h2 class="text-2xl font-bold text-white mb-4">{{ $t('staticPages.about.openSource') }}</h2>
        <p class="text-[#ccc] leading-relaxed">
          {{ $t('staticPages.about.openSourceText') }}
        </p>
      </section>

      <section>
        <h2 class="text-2xl font-bold text-white mb-4">{{ $t('staticPages.about.creator') }}</h2>
        <p class="text-[#ccc] leading-relaxed">
          {{ $t('staticPages.about.builtBy') }} <a href="https://eanorambuena.github.io" target="_blank" rel="noopener noreferrer" class="text-[#00c853] hover:underline">{{ $t('staticPages.about.creatorName') }}</a>.
        </p>
      </section>
    </main>

    <AppFooter />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'landing' })

const { t } = useI18n()

const featureItems = computed(() => t('staticPages.about.featureItems'))

useHead({
  title: computed(() => t('staticPages.about.title')),
  meta: [
    { name: 'description', content: computed(() => t('staticPages.about.lead')) },
    { name: 'keywords', content: 'kalmate, about kalmate, open source financial terminal, free market data, financial data pipeline, emmanuel norambuena' },
  ],
})
</script>
