<script setup lang="ts">
import { canonicalUrl } from '../../utils/seo'
import PipelineEditor from '../../components/pipeline/PipelineEditor.vue'
import PipelineTutorial from '../../components/pipeline/PipelineTutorial.vue'

const { t } = useI18n()

const canonical = canonicalUrl('/terminal/pipeline')

useHead({
  title: computed(() => t('terminal.heading.pipeline')),
  meta: [
    { name: 'description', content: computed(() => t('pipeline.editor.instructions.connect')) },
    { name: 'keywords', content: 'kalmate pipeline, financial pipeline, visual node editor, data pipeline finance, drag and drop trading, technical indicators, SMA, EMA, Kalman filter, no-code finance' },
    { property: 'og:title', content: computed(() => t('terminal.heading.pipeline')) },
    { property: 'og:description', content: computed(() => t('pipeline.editor.instructions.connect')) },
    { property: 'og:url', content: canonical },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: computed(() => t('terminal.heading.pipeline')) },
    { name: 'twitter:description', content: computed(() => t('pipeline.editor.instructions.connect')) },
  ],
  link: [{ rel: 'canonical', href: canonical }],
})

const tutorialKey = ref(0)

function showTutorial() {
  if (import.meta.client) localStorage.removeItem('kalmate-pipeline-tutorial')
  tutorialKey.value++
}
</script>

<style>
main#main-content {
  max-width: none !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
}
</style>

<template>
  <ClientOnly>
    <PipelineEditor @help="showTutorial" />
    <PipelineTutorial :key="tutorialKey" />
    <template #fallback>
      <div class="flex items-center justify-center h-96">
        <p class="text-[#888] text-sm">{{ $t('common.loading') }}</p>
      </div>
    </template>
  </ClientOnly>
</template>
