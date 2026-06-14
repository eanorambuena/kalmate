<script setup lang="ts">
import PipelineEditor from '../../components/pipeline/PipelineEditor.vue'
import PipelineTutorial from '../../components/pipeline/PipelineTutorial.vue'
</script>

<template>
  <ClientOnly>
    <PipelineEditor />
    <PipelineTutorial />
    <template #fallback>
      <div class="flex items-center justify-center h-96">
        <p class="text-[#555] text-sm">Loading editor...</p>
      </div>
    </template>
  </ClientOnly>
</template>
