<template>
  <div class="h-[calc(100vh-120px)] w-full relative flex">
    <!-- Sidebar -->
    <div class="w-52 flex-shrink-0 bg-[#0d0d0d] border-r border-[#222] overflow-y-auto z-10 flex flex-col">
      <div class="p-2 space-y-3">
        <div class="relative">
          <Search class="w-3 h-3 text-[#666] absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            v-model="query"
            type="search"
            placeholder="Search nodes"
            aria-label="Search nodes"
            class="w-full bg-[#161616] border border-[#2a2a2a] rounded pl-6 pr-2 py-1.5 text-[10px] text-white placeholder:text-[#666] outline-none focus:border-[#00c853]"
          />
        </div>

        <div v-for="g in groups" :key="g.key">
          <div class="flex items-center gap-1 px-1 mb-1 text-[10px] font-mono uppercase tracking-wider text-[#888]">
            <Lock v-if="g.pro && !isPro" class="w-2.5 h-2.5" />
            <span>{{ g.title }}</span>
          </div>
          <div class="space-y-0.5">
            <button
              v-for="n in g.items" :key="n.type"
              type="button"
              class="w-full px-2.5 py-1.5 rounded text-[10px] font-bold text-left transition-colors flex items-center gap-2"
              :style="buttonStyle(n)"
              :aria-disabled="isLocked(n) ? 'true' : undefined"
              @click="isLocked(n) ? (showProModal = true) : addNode(n.type)"
              @mouseenter="showTip(n, $event)"
              @mouseleave="hideTip"
              @focus="showTip(n, $event)"
              @blur="hideTip"
            >
              <span class="w-1.5 h-1.5 rounded-full flex-shrink-0" :style="{ background: isLocked(n) ? '#444' : n.color }" />
              {{ n.label }}
            </button>
          </div>
        </div>

        <p v-if="groups.length === 0" class="px-1 text-[10px] text-[#666]">No nodes match "{{ query }}".</p>
      </div>
    </div>

    <div class="flex-1 relative">
      <!-- Toolbar -->
      <div class="absolute top-2 right-2 z-10 flex items-center gap-1.5 bg-[#0d0d0d]/80 backdrop-blur-sm border border-[#222] rounded-lg px-2 py-1.5">
        <span
          v-if="nodes.length > 0"
          class="px-1.5 text-[10px] font-mono whitespace-nowrap"
          role="status"
          aria-live="polite"
        >
          <span v-if="running" class="text-[#2979ff]">Running…</span>
          <span v-else-if="lastRunAt" class="text-[#888]">Updated {{ lastRunLabel }}</span>
          <span v-if="errorCount > 0" class="ml-1.5 text-[#ff1744]">{{ errorCount }} error{{ errorCount === 1 ? '' : 's' }}</span>
        </span>

        <div v-if="nodes.length > 0" class="w-px h-4 bg-[#333] mx-0.5" />

        <button
          class="px-2 py-1 rounded text-[10px] font-bold transition-all"
          :class="eraserMode ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-[#1a1a1a] text-[#bbb] hover:text-white border border-transparent'"
          :aria-pressed="eraserMode"
          title="Eraser mode: click nodes or edges to delete them"
          @click="eraserMode = !eraserMode"
        >
          <Trash2 class="w-3.5 h-3.5" />
        </button>
        <button
          class="px-2 py-1 bg-[#1a1a1a] text-[#bbb] text-[10px] font-bold rounded hover:text-white transition-colors border border-transparent"
          @click="confirmClear"
        >
          Clear All
        </button>
        <button
          class="px-2 py-1 bg-[#1a1a1a] text-[#bbb] text-[10px] font-bold rounded hover:text-white transition-colors border border-transparent"
          title="Show tutorial"
          @click="$emit('help')"
        >
          ?
        </button>

        <div class="w-px h-4 bg-[#333] mx-0.5" />

        <button
          class="px-2 py-1 rounded text-[10px] font-bold transition-colors"
          :class="autorun ? 'bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/40' : 'bg-[#1a1a1a] text-[#bbb] border border-transparent hover:text-white'"
          :aria-pressed="autorun"
          @click="autorun = !autorun"
        >
          <component :is="autorun ? Pause : Play" class="w-3 h-3 inline -mt-px" />
          Auto
        </button>
        <button
          class="px-3 py-1 rounded text-[10px] font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          :class="autorun ? 'bg-[#222] text-[#bbb]' : 'bg-[#00c853] text-black hover:bg-[#00e863]'"
          :disabled="nodes.length === 0 || running || autorun"
          @click="runPipeline"
        >
          <Play class="w-3 h-3 inline -mt-px" /> Run
        </button>

        <div class="w-px h-4 bg-[#333] mx-0.5" />

        <button
          class="px-2 py-1 rounded text-[10px] font-bold transition-colors"
          :class="showAI ? 'bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/40' : 'bg-[#1a1a1a] text-[#bbb] border border-transparent hover:text-white'"
          title="Generate pipeline with AI"
          @click="showAI = !showAI"
        >
          <Sparkles class="w-3.5 h-3.5" />
        </button>
        <button
          class="px-2 py-1 rounded text-[10px] font-bold transition-colors"
          :class="showSaver ? 'bg-[#2979ff]/20 text-[#2979ff] border border-[#2979ff]/40' : 'bg-[#1a1a1a] text-[#bbb] border border-transparent hover:text-white'"
          title="Save/Load pipelines"
          @click="showSaver = !showSaver"
        >
          <Folder class="w-3.5 h-3.5" />
        </button>
      </div>

      <div ref="flowContainer" class="w-full h-full" :class="{ 'eraser-active': eraserMode }" @click="onCanvasClick">
        <VueFlow
          v-model:nodes="nodes"
          v-model:edges="edges"
          :default-viewport="{ x: 200, y: 200, zoom: 0.55 }"
          :delete-key-code="['Backspace', 'Delete']"
          :is-valid-connection="isValidConnection"
          fit-view-on-init
          :node-types="nodeTypes"
          @connect="onConnect"
        >
          <Background :gap="20" pattern-color="#2a2a2a" />
          <Controls position="bottom-right" />
        </VueFlow>
      </div>

      <!-- Empty state: starter templates -->
      <div
        v-if="nodes.length === 0"
        class="absolute inset-0 z-[5] flex items-center justify-center p-4 pointer-events-none"
      >
        <div class="pointer-events-auto w-full max-w-md bg-[#111] border border-[#333] rounded-2xl p-5 shadow-xl">
          <h2 class="text-white text-sm font-bold mb-1">Start from a template</h2>
          <p class="text-[#999] text-[10px] mb-4 leading-relaxed">Load a working pipeline, then change its symbol or settings. Or add nodes from the sidebar.</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              v-for="t in templates"
              :key="t.id"
              type="button"
              class="text-left bg-[#161616] hover:bg-[#1c1c1c] border border-[#2a2a2a] hover:border-[#00c853]/50 rounded-lg p-3 transition-colors"
              @click="applyTemplate(t)"
            >
              <span class="flex items-center gap-1.5 text-[11px] font-bold text-white">
                {{ t.name }}
                <Lock v-if="t.pro && !isPro" class="w-2.5 h-2.5 text-[#ff69b4]" aria-label="Pro" />
                <span v-if="t.pro" class="ml-auto text-[8px] font-bold text-[#ff69b4] bg-[#ff69b4]/10 px-1 rounded">PRO</span>
              </span>
              <span class="block text-[10px] text-[#999] leading-snug mt-1">{{ t.description }}</span>
            </button>
          </div>
        </div>
      </div>

      <div class="absolute bottom-3 left-3 z-10 flex items-center gap-2 text-[10px] text-[#bbb] font-mono bg-[#111]/80 border border-[#222] rounded-lg px-3 py-1.5">
        <MousePointer2 class="w-3 h-3 text-[#00c853] flex-shrink-0" />
        <span>Drag from an output to an input to connect · Select a node or edge and press Backspace to delete</span>
      </div>
    </div>

    <ProModal v-model="showProModal" />
    <PipelineAI v-model="showAI" @apply="applyPlan" />
    <PipelineSaver v-if="showSaver" @load="onPipelineLoad" @close="showSaver = false" />

    <Teleport to="body">
      <div
        v-if="tip && tip.def"
        class="fixed z-[100] w-64 pointer-events-none"
        :style="{ left: tip.x + 'px', top: tip.y + 'px' }"
        role="tooltip"
      >
        <div class="bg-[#161616] border border-[#333] rounded-lg p-3 shadow-xl">
          <p class="text-white font-bold text-[11px] mb-1" :style="{ color: tip.def.color }">{{ tip.def.label }}</p>
          <p class="text-[#bbb] text-[10px] leading-relaxed mb-2">{{ tip.def.description }}</p>

          <div v-if="tip.def.inputs.length > 0" class="mb-1.5">
            <p class="text-[9px] uppercase tracking-wider text-[#888] mb-1">Inputs</p>
            <div class="space-y-1">
              <div v-for="inp in tip.def.inputs" :key="inp.id" class="flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-[#2979ff] flex-shrink-0" />
                <span class="text-[10px] text-[#ccc]">{{ inp.label }}</span>
                <span class="text-[9px] text-[#777] font-mono ml-auto">{{ inp.type }}</span>
              </div>
            </div>
          </div>

          <div v-if="tip.def.outputs.length > 0">
            <p class="text-[9px] uppercase tracking-wider text-[#888] mb-1">Outputs</p>
            <div class="space-y-1">
              <div v-for="out in tip.def.outputs" :key="out.id" class="flex items-center gap-1.5">
                <span class="text-[10px] text-[#ccc]">{{ out.label }}</span>
                <span class="text-[9px] text-[#777] font-mono ml-auto">{{ out.type }}</span>
                <span class="w-1.5 h-1.5 rounded-full bg-[#ff69b4] flex-shrink-0" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { computed, markRaw, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { nodeDefinitions } from '../../utils/pipeline/nodeDefinitions'
import type { NodeDefinition } from '../../utils/pipeline/types'
import { executePipeline } from '../../utils/pipeline/runner'
import { migratePipeline } from '../../utils/pipeline/migrate'
import {
  connectionAllowed,
  graphSignature,
  stripEdges,
  stripResults,
  withConnection,
} from '../../utils/pipeline/graph'
import { templates, type PipelineTemplate } from '../../utils/pipeline/templates'
import CustomNode from './nodes/CustomNode.vue'
import ChartNode from './nodes/ChartNode.vue'
import CandleNode from './nodes/CandleNode.vue'
import ProModal from './ProModal.vue'
import PipelineAI from './PipelineAI.vue'
import PipelineSaver from './PipelineSaver.vue'
import { Trash2, Play, Pause, MousePointer2, Sparkles, Folder, Lock, Search } from '@lucide/vue'

const STORAGE_KEY = 'kalmate-pipeline'
const AUTO_RUN_DELAY_MS = 400
const SAVE_DELAY_MS = 300
const CANVAS_COLUMN_GAP = 320

const nodeTypes = { custom: CustomNode, chart: ChartNode, candle: CandleNode }
const flowContainer = ref<HTMLElement | null>(null)
const { screenToFlowCoordinate } = useVueFlow()

const emit = defineEmits<{ help: [] }>()

const nodes = ref<any[]>([])
const edges = ref<any[]>([])
const running = ref(false)
const autorun = ref(true)
const isPro = ref(false)
const eraserMode = ref(false)
const showProModal = ref(false)
const showAI = ref(false)
const showSaver = ref(false)
const query = ref('')
const lastRunAt = ref<Date | null>(null)
const tip = ref<{ def: any; x: number; y: number } | null>(null)
let nodeCounter = 0

// ---- Sidebar ----

const matchesQuery = (def: NodeDefinition) => {
  const q = query.value.trim().toLowerCase()
  return !q || def.label.toLowerCase().includes(q)
}

const groups = computed(() => {
  const of = (category: NodeDefinition['category']) =>
    nodeDefinitions.filter(d => d.category === category && !d.pro && matchesQuery(d))
  return [
    { key: 'input', title: 'Input', pro: false, items: of('input') },
    { key: 'process', title: 'Process', pro: false, items: of('process') },
    { key: 'output', title: 'Output', pro: false, items: of('output') },
    { key: 'pro', title: 'Pro', pro: true, items: nodeDefinitions.filter(d => d.pro && matchesQuery(d)) },
  ].filter(g => g.items.length > 0)
})

const isLocked = (def: NodeDefinition) => def.pro && !isPro.value

function buttonStyle(def: NodeDefinition) {
  if (isLocked(def)) return { background: '#111', color: '#555', border: '1px solid #222' }
  return { background: def.color + '15', color: def.color, border: '1px solid ' + def.color + '25' }
}

function showTip(node: any, event: MouseEvent | FocusEvent) {
  const e = event as MouseEvent
  const x = Math.min(e.clientX + 12, window.innerWidth - 280)
  const y = Math.min(e.clientY + 12, window.innerHeight - 200)
  tip.value = { def: node, x: Math.max(8, x), y: Math.max(8, y) }
}

function hideTip() {
  tip.value = null
}

// ---- Nodes and connections ----

function nodeTypeFor(type: string) {
  return type === 'chartOutput' ? 'chart' : type === 'candleChart' ? 'candle' : 'custom'
}

function makeNode(def: NodeDefinition, id: string, position: { x: number; y: number }, data: Record<string, any>) {
  return {
    id,
    type: nodeTypeFor(def.type),
    position,
    zIndex: 10,
    data: { ...data, type: def.type, pro: def.pro, label: data.label ?? `${def.label} ${nodeCounter}` },
  }
}

function addNode(type: string) {
  const def = nodeDefinitions.find(n => n.type === type)
  if (!def) return
  nodeCounter++
  let x = 250
  let y = 200
  if (flowContainer.value) {
    const rect = flowContainer.value.getBoundingClientRect()
    const center = screenToFlowCoordinate({ x: rect.width / 2, y: rect.height / 2 })
    x = center.x - 100 + nodeCounter * 10
    y = center.y - 100
  }
  nodes.value = [...nodes.value, makeNode(def, `${type}-${nodeCounter}`, { x, y }, structuredClone(def.defaultData))]
}

function isValidConnection(conn: any) {
  return connectionAllowed(conn, nodes.value, edges.value)
}

function onConnect(connection: any) {
  if (!connectionAllowed(connection, nodes.value, edges.value)) return
  edges.value = withConnection(edges.value, connection)
  syncPortfolioInputs()
}

/**
 * Weighted Average has one weight (and one input handle) per slot. Keep
 * at least two slots, plus one free slot after the last connected input.
 */
function syncPortfolioInputs() {
  for (const node of nodes.value) {
    if (node.data?.type !== 'portfolioInput') continue
    let maxIdx = -1
    for (const e of edges.value) {
      if (e.target !== node.id) continue
      const m = /^in(\d+)$/.exec(e.targetHandle ?? '')
      if (m) maxIdx = Math.max(maxIdx, Number(m[1]))
    }
    const weights: number[] = Array.isArray(node.data.weights) ? node.data.weights : [1, 1]
    const needed = Math.max(2, maxIdx + 2)
    if (weights.length < needed) {
      node.data.weights = [...weights, ...Array.from({ length: needed - weights.length }, () => 1)]
    } else if (!Array.isArray(node.data.weights)) {
      node.data.weights = weights
    }
  }
}

/** Nearest element with the class in the event path. Edges are SVG elements, so this is not limited to HTMLElement. */
function findInPath(e: Event, className: string): Element | null {
  for (const el of e.composedPath()) {
    if (el instanceof Element && el.classList.contains(className)) return el
  }
  return null
}

function onCanvasClick(e: MouseEvent) {
  if (showAI.value) {
    showAI.value = false
    return
  }
  if (!eraserMode.value) return
  // composedPath is fixed when the event is dispatched, so it still finds the
  // node even when a click on its title has already swapped the title for an input.
  const edgeEl = findInPath(e, 'vue-flow__edge')
  if (edgeEl) {
    const edgeId = edgeEl.getAttribute('data-id')
    if (edgeId) edges.value = edges.value.filter(ed => ed.id !== edgeId)
    return
  }
  const nodeEl = findInPath(e, 'vue-flow__node')
  if (nodeEl) {
    const nodeId = nodeEl.getAttribute('data-id')
    if (nodeId) {
      nodes.value = nodes.value.filter(n => n.id !== nodeId)
      edges.value = edges.value.filter(e => e.source !== nodeId && e.target !== nodeId)
    }
  }
}

// ---- Running ----

const errorCount = computed(() => nodes.value.filter(n => n.data?.result?.error).length)

const lastRunLabel = computed(() => {
  const d = lastRunAt.value
  if (!d) return ''
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
})

/**
 * Changes only when something that affects results changes (not positions,
 * labels or results), so writing results back never schedules another run.
 */
const signature = computed(() => graphSignature(nodes.value, edges.value))

let runTimer: ReturnType<typeof setTimeout> | null = null
let queued = false

function scheduleRun(delay = AUTO_RUN_DELAY_MS) {
  if (runTimer) clearTimeout(runTimer)
  runTimer = setTimeout(() => {
    runTimer = null
    runPipeline()
  }, delay)
}

async function runPipeline() {
  if (nodes.value.length === 0) return
  if (running.value) {
    queued = true
    return
  }
  running.value = true
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
    // Results go into each node's data. The signature ignores them, so this does not trigger another run.
    nodes.value = nodes.value.map((n: any) =>
      res[n.id] === undefined
        ? n
        : { ...n, data: { ...n.data, result: markRaw(res[n.id]) } },
    )
    lastRunAt.value = new Date()
  } catch (e) {
    console.error(e)
  } finally {
    running.value = false
    if (queued) {
      queued = false
      scheduleRun(0)
    }
  }
}

watch(signature, () => {
  if (autorun.value) scheduleRun()
})

watch(autorun, (on) => {
  scheduleSave()
  if (on) scheduleRun(0)
})

// ---- Saving and loading ----

let saveTimer: ReturnType<typeof setTimeout> | null = null

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      nodes: stripResults(nodes.value),
      edges: stripEdges(edges.value),
      counter: nodeCounter,
      autorun: autorun.value,
    }))
  } catch (e) {
    // Quota or private-mode errors must not break the editor.
    console.warn('Pipeline could not be saved', e)
  }
}

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveTimer = null
    saveState()
  }, SAVE_DELAY_MS)
}

watch([nodes, edges], scheduleSave, { deep: true })
watch(edges, syncPortfolioInputs)

/** Replaces the canvas with a saved pipeline, migrated to the current node set. */
function loadGraph(saved: any) {
  const m = migratePipeline(saved)
  nodes.value = m.nodes.map(n => ({ ...n, zIndex: n.zIndex ?? 10 }))
  edges.value = m.edges
  nodeCounter = m.counter
  autorun.value = m.autorun
  syncPortfolioInputs()
}

function onPipelineLoad(data: any) {
  loadGraph(data)
  scheduleRun(300)
}

onMounted(() => {
  isPro.value = (localStorage.getItem('kalmate-plan') || 'free') === 'pro'
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) loadGraph(JSON.parse(raw))
  } catch (e) {
    console.warn('Saved pipeline could not be read', e)
  }
  if (nodes.value.length > 0) scheduleRun(0)
})

onBeforeUnmount(() => {
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveState()
  }
  if (runTimer) clearTimeout(runTimer)
})

function confirmClear() {
  if (nodes.value.length === 0) return
  if (confirm('Delete all nodes and connections?')) {
    nodes.value = []
    edges.value = []
  }
}

// ---- Applying AI plans and templates (one code path) ----

type PlanNode = { type: string; data?: Record<string, any>; position?: { x: number; y: number } }
type PlanEdge = { source: number; target: number; sourceHandle: string; targetHandle: string }

function applyPlan(plan: { nodes: PlanNode[]; edges: PlanEdge[] }) {
  const idMap = new Map<number, string>()
  const newNodes: any[] = []
  const catCount: Record<string, number> = { input: 0, process: 0, output: 0 }
  const catY: Record<string, number> = { input: 80, process: 300, output: 520 }
  const existingMaxX = nodes.value.length
    ? Math.max(...nodes.value.map(n => n.position?.x ?? 0))
    : null
  const originX = existingMaxX === null ? 80 : existingMaxX + CANVAS_COLUMN_GAP

  plan.nodes.forEach((spec, i) => {
    const def = nodeDefinitions.find(n => n.type === spec.type)
    if (!def) return
    nodeCounter++
    const id = `${spec.type}-${nodeCounter}`
    idMap.set(i, id)
    const col = catCount[def.category] ?? 0
    catCount[def.category] = col + 1
    const position = spec.position || { x: originX + col * CANVAS_COLUMN_GAP, y: catY[def.category] }
    newNodes.push(makeNode(def, id, position, { ...structuredClone(def.defaultData), ...(spec.data ?? {}) }))
  })

  const allNodes = [...nodes.value, ...newNodes]
  let nextEdges = edges.value
  for (const e of plan.edges) {
    const source = idMap.get(e.source)
    const target = idMap.get(e.target)
    if (!source || !target) continue
    const conn = { source, target, sourceHandle: e.sourceHandle, targetHandle: e.targetHandle }
    if (!connectionAllowed(conn, allNodes, nextEdges)) continue
    nextEdges = withConnection(nextEdges, conn)
  }
  nodes.value = allNodes
  edges.value = nextEdges
  syncPortfolioInputs()
  scheduleRun(300)
}

function applyTemplate(t: PipelineTemplate) {
  if (t.pro && !isPro.value) {
    showProModal.value = true
    return
  }
  applyPlan(t.plan)
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
