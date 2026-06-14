<script setup lang="ts">
import PipelineEditor from '../../components/pipeline/PipelineEditor.vue'
import PipelineTutorial from '../../components/pipeline/PipelineTutorial.vue'

const tutorialKey = ref(0)

function showTutorial() {
  if (import.meta.client) localStorage.removeItem('kalmate-pipeline-tutorial')
  tutorialKey.value++
}
</script>

<template>
  <div class="-mx-4 -mt-4">
    <ClientOnly>
      <PipelineEditor @help="showTutorial" />
      <PipelineTutorial :key="tutorialKey" />
      <template #fallback>
        <div class="flex items-center justify-center h-96">
          <p class="text-[#555] text-sm">Loading editor...</p>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>
