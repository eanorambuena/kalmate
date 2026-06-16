<template>
  <div class="h-[calc(100vh-120px)] w-full relative flex">
    <div class="w-52 flex-shrink-0 bg-[#0d0d0d] border-r border-[#222] overflow-y-auto z-10 flex flex-col">
      <div class="p-2 space-y-2">
        <div>
          <div class="text-[10px]">Input</div>
          <div class="space-y-0.5">
            <button
              v-for="n in inputNodes" :key="n.type"
              class="w-full px-2.5 py-1.5 rounded text-[10px] font-bold text-left transition-colors flex items-center gap-2"
              :style="{ background: n.color + '15', color: n.color, border: '1px solid ' + n.color + '25' }"
              @click="addNode(n.type)"
            >
              <span class="w-1.5 h-1.5 rounded-full flex-shrink-0" :style="{ background: n.color }" />
              {{ n.label }}
            </button>
          </div>
        </div>
        <div>
          <div class="text-[10px]">Process</div>
          <div class="space-y-0.5">
            <button
              v-for="n in processNodes" :key="n.type"
              class="w-full px-2.5 py-1.5 rounded text-[10px] font-bold text-left transition-colors flex items-center gap-2"
              :style="{ background: n.color + '15', color: n.color, border: '1px solid ' + n.color + '25' }"
              @click="addNode(n.type)"
            >
              <span class="w-1.5 h-1.5 rounded-full flex-shrink-0" :style="{ background: n.color }" />
              {{ n.label }}
            </button>
          </div>
        </div>
        <div>
          <div class="text-[10px]">Output</div>
          <div class="space-y-0.5">
            <button
              v-for="n in outputNodes" :key="n.type"
              class="w-full px-2.5 py-1.5 rounded text-[10px] font-bold text-left transition-colors flex items-center gap-2"
              :style="{ background: n.color + '15', color: n.color, border: '1px solid ' + n.color + '25' }"
              @click="addNode(n.type)"
            >
              <span class="w-1.5 h-1.5 rounded-full flex-shrink-0" :style="{ background: n.color }" />
              {{ n.label }}
            </button>
          </div>
        </div>
        <div>
          <div class="text-[10px] font-mono text-[#ff69b4] tracking-wider px-2 mb-1 uppercase flex items-center gap-1">
            Pro
            <svg v-if="!isPro" class="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z"/></svg>
          </div>
          <div class="space-y-0.5">
            <button
              v-for="n in proNodes" :key="n.type"
              class="w-full px-2.5 py-1.5 rounded text-[10px] font-bold text-left transition-colors flex items-center gap-2"
              :style="{ background: isPro ? n.color + '15' : '#111', color: isPro ? n.color : '#555', border: '1px solid ' + (isPro ? n.color + '25' : '#222') }"
              :disabled="!isPro"
              @click="isPro ? addNode(n.type) : showProModal = true"
            >
              <span class="w-1.5 h-1.5 rounded-full flex-shrink-0" :style="{ background: isPro ? n.color : '#444' }" />
              {{ n.label }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="flex-1 relative">
      <div class="absolute top-2 right-2 z-10 flex items-center gap-1.5 bg-[#0d0d0d]/80 backdrop-blur-sm border border-[#222] rounded-lg px-2 py-1.5">
        <button
          class="px-2 py-1 rounded text-[10px] font-bold transition-all"
          :class="eraserMode ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-[#1a1a1a] text-[#bbb] hover:text-white border border-transparent'"
          @click="eraserMode = !eraserMode"
          title="Eraser mode: click edges to delete"
        >
          🗑
        </button>
        <button
          class="px-2 py-1 bg-[#1a1a1a] text-[#bbb] text-[10px] font-bold rounded hover:text-white transition-colors border border-transparent"
          @click="clearAll"
        >
          Clear
        </button>
        <button
          class="px-2 py-1 bg-[#1a1a1a] text-[#bbb] text-[10px] font-bold rounded hover:text-white transition-colors border border-transparent"
          @click="$emit('help')"
          title="Show tutorial"
        >
          ?
        </button>

        <div class="w-px h-4 bg-[#333] mx-1" />

        <button
          class="px-2 py-1 rounded text-[10px] font-bold transition-colors"
          :class="autorun ? 'bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/40' : 'bg-[#1a1a1a] text-[#bbb] border border-transparent hover:text-white'"
          @click="autorun = !autorun"
        >
          {{ autorun ? '⏵ Auto' : '⏸ Auto' }}
        </button>
        <button
          class="px-3 py-1 rounded text-[10px] font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          :class="autorun ? 'bg-[#222] text-[#bbb]' : 'bg-[#00c853] text-black hover:bg-[#00e863]'"
          :disabled="nodes.length === 0 || running || autorun"
          @click="runPipeline"
        >
          ▶ Run
        </button>

        <div class="w-px h-4 bg-[#333] mx-1" />

        <button
          class="px-2 py-1 rounded text-[10px] font-bold transition-colors"
          :class="showResults ? 'bg-[#2979ff]/20 text-[#2979ff] border border-[#2979ff]/40' : 'bg-[#1a1a1a] text-[#bbb] border border-transparent hover:text-white'"
          @click="showResults = !showResults"
          title="Toggle results panel"
        >
          📊
        </button>
      </div>

      <div ref="flowContainer" class="w-full h-full" :class="{ 'eraser-active': eraserMode }" @click="onCanvasClick">
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
        v-if="showResults && results && Object.keys(results).length > 0"
        class="absolute bottom-3 right-3 z-10 bg-[#111] border border-[#333] rounded-xl p-3 max-w-xs text-[10px]"
      >
        <p class="text-[#00c853] font-bold mb-1">Results</p>
        <div v-for="(val, key) in results" :key="key" class="mb-1">
          <span class="text-[#bbb]">{{ key }}:</span>
          <span class="text-white ml-1">{{ formatResult(val) }}</span>
        </div>
      </div>

      <div class="absolute bottom-3 left-3 z-10 flex gap-3 text-[10px] text-[#bbb] font-mono bg-[#111]/80 border border-[#222] rounded-lg px-3 py-1.5">
        <span>🖱 Arrastra de salida a entrada para conectar</span>
        <span>🖱 Click en flecha para borrar</span>
      </div>
    </div>

    <ProModal v-if="showProModal" @close="showProModal = false" />
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
import ProModal from './ProModal.vue'

const nodeTypes = { custom: CustomNode, chart: ChartNode }
const flowContainer = ref<HTMLElement | null>(null)

const emit = defineEmits<{ help: [] }>()

const nodes = ref<any[]>([])
const edges = ref<any[]>([])
const running = ref(false)
const autorun = ref(true)
const results = ref({})
const isPro = ref(false)
const eraserMode = ref(false)
const showProModal = ref(false)
const showResults = ref(true)
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
      if (p.autorun !== undefined) autorun.value = p.autorun
    } catch {}
  }
})

function saveState() {
  localStorage.setItem('kalmate-pipeline', JSON.stringify({
    nodes: nodes.value,
    edges: edges.value,
    results: results.value,
    counter: nodeCounter,
    autorun: autorun.value,
  }))
}

watch([nodes, edges], () => { saveState() }, { deep: true })

function syncPortfolioInputs() {
  for (const node of nodes.value) {
    if (node.data?.type === 'portfolioInput') {
      const connectedCount = edges.value.filter(e => e.target === node.id).length
      const neededInputs = Math.max(2, connectedCount + 1)
      const currentWeights = node.data.weights || [1, 1]
      if (currentWeights.length < neededInputs) {
        const toAdd = neededInputs - currentWeights.length
        for (let i = 0; i < toAdd; i++) {
          currentWeights.push(1)
        }
        node.data.weights = [...currentWeights]
      }
    }
  }
}

let autoRunTimer: any = null
function scheduleAutoRun() {
  if (!autorun.value) return
  if (edges.value.length > 0 && nodes.value.some(n => n.data?.type === 'priceFeed' || n.data?.type === 'kalmanFilter')) {
    clearTimeout(autoRunTimer)
    autoRunTimer = setTimeout(() => runPipeline(), 300)
  }
}

watch(edges, () => {
  scheduleAutoRun()
  syncPortfolioInputs()
}, { deep: true })

watch(nodes, () => {
  syncPortfolioInputs()
  scheduleAutoRun()
}, { deep: true })

watch(autorun, () => {
  saveState()
  if (autorun.value) scheduleAutoRun()
})

const inputNodes = computed(() => nodeDefinitions.filter(n => n.category === 'input' && !n.pro))
const processNodes = computed(() => nodeDefinitions.filter(n => n.category === 'process' && !n.pro))
const outputNodes = computed(() => nodeDefinitions.filter(n => n.category === 'output' && !n.pro))
const proNodes = computed(() => nodeDefinitions.filter(n => n.pro))

function addNode(type: string) {
  const def = nodeDefinitions.find(n => n.type === type)
  if (!def) return
  nodeCounter++
  const id = `${type}-${nodeCounter}`
  const nodeType = type === 'chartOutput' ? 'chart' : 'custom'
  let x = 200 + nodeCounter * 30
  let y = 200 + nodeCounter * 40
  if (flowContainer.value) {
    const rect = flowContainer.value.getBoundingClientRect()
    x = (rect.width / 2 - 200) / 0.55 + nodeCounter * 15
    y = (rect.height / 2 - 200) / 0.55 + nodeCounter * 20
  }
  nodes.value = [...nodes.value, {
    id,
    type: nodeType,
    position: { x, y },
    data: { ...def.defaultData, label: `${def.label} ${nodeCounter}`, type, pro: def.pro },
  }]
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
  if (typeof val.price === 'number') return '$' + val.price.toFixed(2)
  if (typeof val.source === 'number') return '$' + val.source.toFixed(2)
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
