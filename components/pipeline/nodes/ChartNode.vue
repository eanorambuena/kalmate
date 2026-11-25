<template>
  <div class="group relative w-[360px] bg-[#111] border border-[#333] rounded-xl p-3 cursor-grab active:cursor-grabbing">
    <button
      type="button"
      class="nodrag absolute top-1.5 right-1.5 z-10 w-4 h-4 flex items-center justify-center rounded text-[#888] hover:text-white hover:bg-[#333] text-xs leading-none opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
      title="Remove node"
      aria-label="Remove node"
      @click.stop="removeSelf"
    >×</button>

    <div class="flex items-center gap-2 mb-1.5 pr-5">
      <div class="w-2 h-2 rounded-full flex-shrink-0" :style="{ backgroundColor: '#ff69b4' }" />
      <span class="text-[10px] font-bold text-[#aaa] uppercase tracking-wider">Output</span>
    </div>
    <p v-if="!editing" class="nodrag text-white text-xs font-medium mb-2 cursor-pointer hover:text-[#00c853] truncate" :title="displayLabel" @click="startEdit">{{ displayLabel }}</p>
    <input
      v-else
      ref="inputEl"
      v-model="editLabel"
      class="nodrag bg-[#1a1a1a] border border-[#444] rounded px-1 py-0.5 text-xs text-white w-full mb-2 outline-none"
      @blur="saveLabel"
      @keydown.enter="saveLabel"
      @keydown.escape="cancelLabel"
    />

    <PipelineChart v-if="lines.length" :lines="lines" height="230px" :aria-label="`${displayLabel}: ${lines.length} series`">
      <template #actions>
        <button
          type="button"
          class="nodrag px-1.5 py-0.5 rounded text-[10px] font-medium text-[#888] hover:text-white"
          title="Open full screen"
          aria-label="Expand chart"
          @click="expanded = true"
        >⤢</button>
      </template>
    </PipelineChart>
    <div v-else class="h-[120px] flex items-center justify-center text-center text-[#aaa] text-[10px] px-2">
      {{ result?.error || 'Connect a series and run the pipeline to see the chart' }}
    </div>

    <ChartExpand :open="expanded" :title="displayLabel" :lines="lines" @close="expanded = false" />

    <div class="flex flex-col gap-1 mt-2">
      <div v-for="inp in inputs" :key="inp.id" class="flex items-center gap-1 relative pl-3">
        <Handle type="target" :position="Position.Left" :id="inp.id" class="w-2 h-2 !bg-[#2979ff] !border-0" :style="{ position: 'absolute', left: '0px', top: '50%' }" />
        <Handle type="source" :position="Position.Left" :id="'left:' + inp.id" class="w-2 h-2 !bg-[#2979ff] !border-0 !opacity-0" :style="{ position: 'absolute', left: '0px', top: '50%' }" />
        <span class="w-2 h-2 rounded-sm" :style="{ backgroundColor: HANDLE_COLORS[inp.id] }" />
        <span class="text-[9px] text-[#aaa]">{{ connectedLabel(inp.id) ?? inp.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import { computed, ref, nextTick } from 'vue'
import { nodeDefinitions } from '../../../utils/pipeline/nodeDefinitions'
import PipelineChart, { type ChartLine } from '../PipelineChart.vue'
import ChartExpand from '../ChartExpand.vue'

const props = defineProps({
  id: { type: String, required: true },
  data: { type: Object, default: () => ({}) },
})

const { removeNodes } = useVueFlow()

const def = nodeDefinitions.find(n => n.type === 'chartOutput')
const inputs = def?.inputs ?? []
const displayLabel = computed(() => props.data?.label || 'Chart')

const editing = ref(false)
const editLabel = ref('')
const inputEl = ref<HTMLInputElement>()
const expanded = ref(false)

function startEdit() {
  editLabel.value = displayLabel.value
  editing.value = true
  nextTick(() => inputEl.value?.focus())
}

function saveLabel() {
  if (editLabel.value.trim()) props.data.label = editLabel.value.trim()
  editing.value = false
}

function cancelLabel() {
  editing.value = false
}

function removeSelf() {
  removeNodes([props.id], true)
}

const HANDLE_COLORS: Record<string, string> = {
  mainSeries: '#00c853',
  overlayA: '#2979ff',
  overlayB: '#aa00ff',
  overlayC: '#ff6d00',
}

const result = computed<any>(() => props.data?.result)

const lines = computed<ChartLine[]>(() => {
  const raw = result.value?.series
  if (!Array.isArray(raw)) return []
  return raw
    .filter((s: any) => Array.isArray(s?.points) && s.points.length)
    .map((s: any, i: number) => ({
      key: String(s.handle ?? i),
      label: String(s.label ?? s.handle ?? `Series ${i + 1}`),
      unit: s.unit ?? 'price',
      color: HANDLE_COLORS[s.handle] ?? '#ffd600',
      points: s.points,
    }))
})

function connectedLabel(handle: string): string | null {
  return lines.value.find(l => l.key === handle)?.label ?? null
}
</script>
