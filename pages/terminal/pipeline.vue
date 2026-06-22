<script setup lang="ts">
import { canonicalUrl } from '../../utils/seo'
import PipelineEditor from '../../components/pipeline/PipelineEditor.vue'
import PipelineTutorial from '../../components/pipeline/PipelineTutorial.vue'

const canonical = canonicalUrl('/terminal/pipeline')

useHead({
  title: 'Data Pipeline & Visual Node Editor | Kalmate',
  meta: [
    { name: 'description', content: 'Build visual financial data pipelines with Kalmate\'s node editor. Connect indicators like SMA, EMA, Kalman filters, and portfolio inputs in a drag-and-drop interface. No coding required.' },
    { name: 'keywords', content: 'kalmate pipeline, financial pipeline, visual node editor, data pipeline finance, drag and drop trading, technical indicators, SMA, EMA, Kalman filter, no-code finance' },
    { property: 'og:title', content: 'Data Pipeline & Visual Node Editor | Kalmate' },
    { property: 'og:description', content: 'Build visual financial data pipelines with Kalmate\'s node editor. Connect indicators like SMA, EMA, Kalman filters, and portfolio inputs in a drag-and-drop interface.' },
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
      <div class="max-w-3xl mx-auto px-6 py-24 text-center">
        <h1 class="text-3xl font-bold text-white mb-4">Visual Pipeline Editor</h1>
        <p class="text-[#ccc] mb-6">Drag and drop nodes to build custom data pipelines. Connect Symbol Input → Kalman Filter → Chart Output for live price smoothing, or combine RSI, SMA, and Alert nodes for automated trading signals.</p>
        <div class="flex flex-wrap justify-center gap-2 text-sm text-[#888]">
          <span class="bg-[#111] px-3 py-1 rounded">Symbol Input</span>
          <span class="text-[#555]">→</span>
          <span class="bg-[#111] px-3 py-1 rounded">Kalman Filter</span>
          <span class="text-[#555]">→</span>
          <span class="bg-[#111] px-3 py-1 rounded">Chart Output</span>
        </div>
        <p class="text-[#888] text-xs mt-6">Loading editor...</p>
      </div>
    </template>
  </ClientOnly>
</template>
