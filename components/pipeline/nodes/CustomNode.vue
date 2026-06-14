<template>
  <div class="bg-[#111] border border-[#333] rounded-xl p-3 min-w-[180px] cursor-grab active:cursor-grabbing relative" :style="{ borderLeft: '3px solid ' + color }">
    <span v-if="props.data?.pro" class="absolute -top-2 -right-2 bg-[#ff69b4] text-black text-[7px] font-bold px-1.5 py-0.5 rounded">PRO</span>

    <div class="flex items-center gap-2 mb-1">
      <div class="w-2 h-2 rounded-full" :style="{ backgroundColor: color }" />
      <span class="text-[9px] font-bold text-[#555] uppercase tracking-wider">{{ def.category }}</span>
    </div>

    <p class="text-white text-xs font-medium mb-0.5">{{ label }}</p>
    <p class="text-[#555] text-[8px] mb-2">{{ def.description }}</p>

    <div v-if="def.type === 'symbolInput'" class="mb-2">
      <input
        v-model="data.symbol"
        class="w-full bg-[#222] border border-[#444] rounded px-2 py-1 text-white text-[10px] font-mono outline-none focus:border-[#00c853]"
        placeholder="AAPL"
      />
    </div>

    <div class="flex items-start justify-between gap-2 mb-1">
      <div v-for="(inp, i) in def.inputs" :key="'in-' + i" class="flex items-center gap-1">
        <Handle type="target" :position="Position.Left" :id="inp.id" class="w-2 h-2 !bg-[#2979ff] !border-0" />
        <span class="text-[7px] text-[#555]">{{ inp.label }}</span>
      </div>
      <div v-for="(out, i) in def.outputs" :key="'out-' + i" class="flex items-center gap-1">
        <span class="text-[7px] text-[#555]">{{ out.label }}</span>
        <Handle type="source" :position="Position.Right" :id="out.id" class="w-2 h-2 !bg-[#00c853] !border-0" />
      </div>
    </div>

    <div v-if="result" class="mt-1 pt-1 border-t border-[#2a2a2a]">
      <NodeBody :label="def.label" :color="color" :data="result" />
    </div>
  </div>
</template>

<script setup>
import { Handle, Position } from '@vue-flow/core'
import { nodeDefinitions } from '../../../utils/pipeline/nodeDefinitions'
import NodeBody from '../NodeBody.vue'

const props = defineProps({
  id: { type: String, required: true },
  data: { type: Object, default: () => ({}) },
})

const def = computed(() => nodeDefinitions.find(n => n.type === props.data.type) || nodeDefinitions[0])
const label = computed(() => props.data.label || def.value.label)
const color = computed(() => def.value.color)
const result = computed(() => props.data.result)
</script>
