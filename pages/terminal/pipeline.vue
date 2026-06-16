<script setup lang="ts">
import { canonicalUrl } from '../../utils/seo'
import PipelineEditor from '../../components/pipeline/PipelineEditor.vue'
import PipelineTutorial from '../../components/pipeline/PipelineTutorial.vue'

const canonical = canonicalUrl('/terminal/pipeline')

useHead({
  title: 'Pipeline | Kalmate',
  meta: [
    { name: 'description', content: 'Build and run visual trading pipelines in Kalmate.' },
    { property: 'og:title', content: 'Pipeline | Kalmate' },
    { property: 'og:description', content: 'Build and run visual trading pipelines in Kalmate.' },
    { property: 'og:url', content: canonical },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Pipeline | Kalmate' },
    { name: 'twitter:description', content: 'Build and run visual trading pipelines in Kalmate.' },
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
        <p class="text-[#888] text-sm">Loading editor...</p>
      </div>
    </template>
  </ClientOnly>
</template>
