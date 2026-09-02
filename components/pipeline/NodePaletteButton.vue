<template>
  <div class="relative">
    <button
      class="w-full px-2.5 py-1.5 rounded text-[10px] font-bold text-left transition-colors flex items-center gap-2"
      :style="{
        background: enabled ? def.color + '15' : '#111',
        color: enabled ? def.color : '#555',
        border: '1px solid ' + (enabled ? def.color + '25' : '#222'),
      }"
      :disabled="!enabled"
      @click="onClick"
      @mouseenter="show = true"
      @mouseleave="show = false"
      @focus="show = true"
      @blur="show = false"
      @keydown.escape="show = false"
    >
      <span class="w-1.5 h-1.5 rounded-full flex-shrink-0" :style="{ background: enabled ? def.color : '#444' }" />
      {{ def.label }}
    </button>

    <div
      v-if="show"
      class="absolute left-full ml-2 top-0 z-50 w-56 bg-[#161616] border border-[#333] rounded-lg p-3 shadow-xl pointer-events-none"
      role="tooltip"
    >
      <p class="text-white font-bold text-[11px] mb-1" :style="{ color: def.color }">{{ def.label }}</p>
      <p class="text-[#bbb] text-[10px] leading-relaxed mb-2">{{ def.description }}</p>

      <div v-if="def.inputs.length > 0" class="mb-1.5">
        <p class="text-[9px] uppercase tracking-wider text-[#888] mb-1">Inputs</p>
        <div class="space-y-1">
          <div v-for="inp in def.inputs" :key="inp.id" class="flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-[#2979ff] flex-shrink-0" />
            <span class="text-[10px] text-[#ccc]">{{ inp.label }}</span>
            <span class="text-[9px] text-[#777] font-mono ml-auto">{{ inp.type }}</span>
          </div>
        </div>
      </div>

      <div v-if="def.outputs.length > 0">
        <p class="text-[9px] uppercase tracking-wider text-[#888] mb-1">Outputs</p>
        <div class="space-y-1">
          <div v-for="out in def.outputs" :key="out.id" class="flex items-center gap-1.5">
            <span class="text-[10px] text-[#ccc]">{{ out.label }}</span>
            <span class="text-[9px] text-[#777] font-mono ml-auto">{{ out.type }}</span>
            <span class="w-1.5 h-1.5 rounded-full bg-[#ff69b4] flex-shrink-0" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { nodeDefinitions } from '../../utils/pipeline/nodeDefinitions'

const props = defineProps<{
  type: string
  enabled?: boolean
}>()

const emit = defineEmits<{ click: [] }>()

const show = ref(false)
const def = computed(() => nodeDefinitions.find(n => n.type === props.type) || nodeDefinitions[0])
const enabled = computed(() => props.enabled !== false)

function onClick() {
  if (enabled.value) emit('click')
}
</script>
