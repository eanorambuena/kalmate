<template>
  <div class="absolute inset-0 z-20 pointer-events-none">
    <div class="absolute top-3 right-3 w-80 bg-[#111] border border-[#333] rounded-xl p-3 pointer-events-auto shadow-2xl">
      <div class="flex items-center justify-between mb-2">
        <span class="text-[10px] font-bold text-[#00c853] uppercase tracking-wider flex items-center gap-1">
          <div class="w-1.5 h-1.5 rounded-full" :class="modelReady ? 'bg-[#00c853]' : 'bg-[#666]'" />
          AI Pipeline
          <span v-if="!modelReady" class="text-[#666] font-normal">(local)</span>
        </span>
        <button class="text-[#bbb] hover:text-white text-[9px]" @click="$emit('close')" title="Close">✕</button>
      </div>

      <div v-if="generating" class="mb-2 text-[9px] text-[#666] flex items-center gap-1">
        <span class="animate-pulse">Generando pipeline...</span>
      </div>

      <div class="flex gap-1 mb-2">
        <input
          v-model="query"
          type="text"
          placeholder="Ej: grafica AAPL con velas y SMA20"
          class="flex-1 bg-[#222] border border-[#444] rounded px-2 py-1.5 text-white text-[10px] font-mono outline-none focus:border-[#00c853]"
          @keydown.enter="doGenerate"
          :disabled="generating"
        />
        <button
          class="bg-[#00c853] hover:bg-[#00e676] text-black text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
          :disabled="generating || !query.trim()"
          @click="doGenerate"
        >
          <Zap class="w-3 h-3" v-if="!generating" />
          <span v-else class="animate-pulse">...</span>
        </button>
      </div>

      <div v-if="error" class="text-[#ff1744] text-[9px] mb-1">{{ error }}</div>

      <div v-if="result" class="text-[#00c853] text-[9px] mb-1">
        Plan generado: {{ result.nodes.length }} nodos, {{ result.edges.length }} conexiones
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAIPipeline } from '~/composables/useAIPipeline'
import { Zap } from '@lucide/vue'

const emit = defineEmits<{
  apply: [plan: { nodes: any[]; edges: any[] }]
  close: []
}>()

const { loadModel, generate, loaded } = useAIPipeline()

const query = ref('')
const generating = ref(false)
const error = ref('')
const modelReady = ref(false)
const result = ref<{ nodes: any[]; edges: any[] } | null>(null)

onMounted(() => {
  loadModel().then(() => { modelReady.value = loaded() }).catch(() => {})
})

async function doGenerate() {
  if (!query.value.trim()) return
  generating.value = true
  error.value = ''
  result.value = null
  const plan = await generate(query.value)
  if ('error' in plan) {
    error.value = plan.error
  } else {
    result.value = plan
    emit('apply', plan)
  }
  generating.value = false
}
</script>
