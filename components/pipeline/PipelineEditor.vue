<template>
  <div class="h-[calc(100vh-120px)] relative">
    <div class="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5">
      <div class="flex items-center gap-1 text-[10px] text-[#555] mr-1 font-mono">FREE</div>
      <button
        v-for="n in freeNodes" :key="n.type"
        class="px-2.5 py-1.5 rounded text-[10px] font-bold transition-colors"
        :style="{ background: n.color + '20', color: n.color, border: '1px solid ' + n.color + '40' }"
        @click="addNode(n.type)"
      >
        + {{ n.label }}
      </button>

      <div class="w-px h-6 bg-[#333] mx-1 self-center" />

      <div class="flex items-center gap-1 text-[10px] text-[#ff69b4] mr-1 font-mono">PRO</div>
      <button
        v-for="n in proNodes" :key="n.type"
        class="px-2.5 py-1.5 rounded text-[10px] font-bold transition-colors flex items-center gap-1"
        :style="{ background: isPro ? n.color + '20' : '#222', color: isPro ? n.color : '#555', border: '1px solid ' + (isPro ? n.color + '40' : '#333') }"
        :disabled="!isPro"
        @click="isPro ? addNode(n.type) : goPricing()"
      >
        <svg v-if="!isPro" class="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z"/></svg>
        {{ n.label }}
      </button>

      <div class="w-px h-6 bg-[#333] mx-2 self-center" />

      <button
        class="px-3 py-1.5 bg-[#2979ff] text-white text-[10px] font-bold rounded hover:bg-[#4a9aff] transition-colors"
        :disabled="running"
        @click="runPipeline"
      >
        {{ running ? 'Running...' : 'Run' }}
      </button>
      <button
        class="px-3 py-1.5 bg-[#333] text-[#aaa] text-[10px] font-bold rounded hover:text-white transition-colors"
        @click="clearAll"
      >
        Clear
      </button>
      <button
        class="px-2.5 py-1.5 bg-[#222] text-[#555] text-[10px] font-bold rounded hover:text-white transition-colors"
        @click="$emit('help')"
        title="Show tutorial"
      >
        ?
      </button>
    </div>

    <div class="vue-flow-bg h-full">
      <VueFlow
        v-model:nodes="nodes"
        v-model:edges="edges"
        :default-viewport="{ x: 100, y: 100, zoom: 0.9 }"
        fit-view-on-init
        :node-types="nodeTypes"
        @connect="onConnect"
        @edge-context-menu="onEdgeContextMenu"
      >
        <Background :gap="20" pattern-color="#2a2a2a" />
        <Controls position="bottom-right" />
      </VueFlow>
    </div>

    <div
      v-if="results && Object.keys(results).length > 0"
      class="absolute bottom-3 right-3 z-10 bg-[#111] border border-[#333] rounded-xl p-3 max-w-xs text-[10px]"
    >
      <p class="text-[#00c853] font-bold mb-1">Results</p>
      <div v-for="(val, key) in results" :key="key" class="mb-1">
        <span class="text-[#555]">{{ key }}:</span>
        <span class="text-white ml-1">{{ formatResult(val) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { VueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { nodeDefinitions } from '../../utils/pipeline/nodeDefinitions'
import { executePipeline } from '../../utils/pipeline/runner'
import CustomNode from './nodes/CustomNode.vue'

const nodeTypes = { custom: CustomNode }

const emit = defineEmits<{ help: [] }>()

const nodes = ref<any[]>([])
const edges = ref<any[]>([])
const running = ref(false)
const results = ref({})
const isPro = ref(false)
let nodeCounter = 0

onMounted(() => {
  isPro.value = (localStorage.getItem('kalmate-plan') || 'free') === 'pro'
})

const freeNodes = computed(() => nodeDefinitions.filter(n => !n.pro))
const proNodes = computed(() => nodeDefinitions.filter(n => n.pro))

function addNode(type: string) {
  const def = nodeDefinitions.find(n => n.type === type)
  if (!def) return
  nodeCounter++
  const id = `${type}-${nodeCounter}`
  nodes.value = [...nodes.value, {
    id,
    type: 'custom',
    position: { x: 100 + nodeCounter * 40, y: 100 + nodeCounter * 60 },
    data: { ...def.defaultData, label: `${def.label} ${nodeCounter}`, type, pro: def.pro },
  }]
}

function goPricing() {
  window.location.href = '/terminal/pricing'
}

function onConnect(connection: any) {
  edges.value = [...edges.value, {
    ...connection,
    id: `e-${connection.source}-${connection.target}`,
    style: { stroke: '#555', strokeWidth: 2 },
  }]
}

function onEdgeContextMenu(edge: any) {
  edges.value = edges.value.filter(e => e.id !== edge.id)
}

function formatResult(val: any): string {
  if (!val) return '-'
  if (typeof val === 'number') return val.toFixed(2)
  if (val.price) return '$' + val.price.toFixed(2)
  if (val.signal === 1) return 'Overpriced'
  if (val.signal === -1) return 'Underpriced'
  return 'OK'
}

async function runPipeline() {
  running.value = true
  results.value = {}
  try {
    const spec = {
      nodes: nodes.value.map((n: any) => ({
        id: n.id,
        type: n.data?.type || n.type,
        position: n.position,
        data: n.data || {},
      })),
      edges: edges.value.map((e: any) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
      })),
    }
    const res = await executePipeline(spec)
    results.value = res
    nodes.value = nodes.value.map((n: any) => ({
      ...n,
      data: { ...n.data, result: res[n.id] || n.data.result },
    }))
  } catch (e) {
    console.error(e)
  }
  running.value = false
}

function clearAll() {
  nodes.value = []
  edges.value = []
  results.value = {}
}
</script>

<style>
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';
@import '@vue-flow/controls/dist/style.css';

.vue-flow {
  background: #0a0a0a;
}
.vue-flow__node {
  cursor: grab;
}
.vue-flow__node:active {
  cursor: grabbing;
}
.vue-flow__edge-path {
  stroke: #555 !important;
  stroke-width: 2 !important;
}
.vue-flow__connection-path {
  stroke: #00c853 !important;
  stroke-width: 2 !important;
}
.vue-flow__controls-button {
  background: #1a1a1a !important;
  border-color: #333 !important;
  fill: #888 !important;
}
.vue-flow__controls-button:hover {
  background: #2a2a2a !important;
}
</style>
