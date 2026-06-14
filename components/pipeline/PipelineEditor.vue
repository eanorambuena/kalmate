<template>
  <div class="h-[calc(100vh-120px)] w-full relative">
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
      <button
        class="px-2.5 py-1.5 rounded text-[10px] font-bold transition-all"
        :class="eraserMode ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-[#222] text-[#555] hover:text-white'"
        @click="eraserMode = !eraserMode"
        title="Eraser mode: click edges to delete"
      >
        🗑
      </button>
    </div>

    <div class="w-full h-full" :class="{ 'eraser-active': eraserMode }" @click="onCanvasClick">
      <VueFlow
        v-model:nodes="nodes"
        v-model:edges="edges"
        :default-viewport="{ x: 200, y: 200, zoom: 0.55 }"
        fit-view-on-init
        :node-types="nodeTypes"
        @connect="onConnect"
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

    <div class="absolute bottom-3 left-3 z-10 flex gap-3 text-[9px] text-[#555] font-mono bg-[#111]/80 border border-[#222] rounded-lg px-3 py-1.5">
      <span>🖱 Arrastra de salida a entrada para conectar</span>
      <span>🖱 Click en flecha para borrar</span>
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
import ChartNode from './nodes/ChartNode.vue'

const nodeTypes = { custom: CustomNode, chart: ChartNode }

const emit = defineEmits<{ help: [] }>()

const nodes = ref<any[]>([])
const edges = ref<any[]>([])
const running = ref(false)
const results = ref({})
const isPro = ref(false)
const eraserMode = ref(false)
let nodeCounter = 0

onMounted(() => {
  isPro.value = (localStorage.getItem('kalmate-plan') || 'free') === 'pro'
  const saved = localStorage.getItem('kalmate-pipeline')
  if (saved) {
    try {
      const p = JSON.parse(saved)
      nodes.value = p.nodes || []
      edges.value = p.edges || []
      results.value = p.results || {}
      nodeCounter = p.counter || 0
    } catch {}
  }
})

function saveState() {
  localStorage.setItem('kalmate-pipeline', JSON.stringify({
    nodes: nodes.value,
    edges: edges.value,
    results: results.value,
    counter: nodeCounter,
  }))
}

watch([nodes, edges], () => { saveState() }, { deep: true })

let autoRunTimer: any = null
watch(edges, () => {
  if (edges.value.length > 0 && nodes.value.some(n => n.data?.type === 'priceFeed' || n.data?.type === 'kalmanFilter')) {
    clearTimeout(autoRunTimer)
    autoRunTimer = setTimeout(() => runPipeline(), 300)
  }
}, { deep: true })

const freeNodes = computed(() => nodeDefinitions.filter(n => !n.pro))
const proNodes = computed(() => nodeDefinitions.filter(n => n.pro))

function addNode(type: string) {
  const def = nodeDefinitions.find(n => n.type === type)
  if (!def) return
  nodeCounter++
  const id = `${type}-${nodeCounter}`
  const nodeType = type === 'chartOutput' ? 'chart' : 'custom'
  nodes.value = [...nodes.value, {
    id,
    type: nodeType,
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

function onCanvasClick(e: MouseEvent) {
  if (!eraserMode.value) return
  const target = e.target as HTMLElement
  const edgeEl = target.closest('.vue-flow__edge')
  if (edgeEl) {
    const edgeId = edgeEl.getAttribute('data-id')
    if (edgeId) edges.value = edges.value.filter(ed => ed.id !== edgeId)
    return
  }
  const nodeEl = target.closest('.vue-flow__node')
  if (nodeEl) {
    const nodeId = nodeEl.getAttribute('data-id')
    if (nodeId) {
      nodes.value = nodes.value.filter(n => n.id !== nodeId)
      edges.value = edges.value.filter(e => e.source !== nodeId && e.target !== nodeId)
    }
  }
}

function formatResult(val: any): string {
  if (!val) return '-'
  if (val.error) return 'Error: ' + val.error
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
  localStorage.removeItem('kalmate-pipeline')
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
.eraser-active,
.eraser-active .vue-flow__pane {
  cursor: not-allowed !important;
}
.eraser-active .vue-flow__edge,
.eraser-active .vue-flow__node {
  cursor: pointer !important;
}
.eraser-active .vue-flow__edge-path {
  pointer-events: stroke;
}
</style>
