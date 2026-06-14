<template>
  <div class="h-[calc(100vh-120px)] relative">
    <div class="absolute top-3 left-3 z-10 flex gap-2">
      <button
        class="px-3 py-1.5 bg-[#00c853] text-black text-[10px] font-bold rounded hover:bg-[#00e060] transition-colors"
        @click="addNode('symbolInput')"
      >
        + Symbol
      </button>
      <button
        class="px-3 py-1.5 bg-[#00c853] text-black text-[10px] font-bold rounded hover:bg-[#00e060] transition-colors"
        @click="addNode('priceFeed')"
      >
        + Price
      </button>
      <button
        class="px-3 py-1.5 bg-[#00c853] text-black text-[10px] font-bold rounded hover:bg-[#00e060] transition-colors"
        @click="addNode('kalmanFilter')"
      >
        + Kalman
      </button>
      <button
        class="px-3 py-1.5 bg-[#ff69b4] text-black text-[10px] font-bold rounded hover:bg-[#ff85c8] transition-colors"
        @click="addNode('chartOutput')"
      >
        + Chart
      </button>
      <button
        class="px-3 py-1.5 bg-[#ff69b4] text-black text-[10px] font-bold rounded hover:bg-[#ff85c8] transition-colors"
        @click="addNode('priceDisplay')"
      >
        + Display
      </button>
      <div class="w-px bg-[#333]" />
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
    </div>

    <div class="vue-flow-bg h-full">
      <VueFlow
        v-model:nodes="nodes"
        v-model:edges="edges"
        :default-viewport="{ x: 100, y: 100, zoom: 0.9 }"
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
  </div>
</template>

<script setup lang="ts">
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { nodeDefinitions } from '../../utils/pipeline/nodeDefinitions'
import { executePipeline } from '../../utils/pipeline/runner'
import CustomNode from './nodes/CustomNode.vue'

const nodeTypes = { custom: CustomNode }

const { nodes, edges, addNodes, addEdges, removeNodes, removeEdges } = useVueFlow({ id: 'pipeline' })

const running = ref(false)
const results = ref({})

let nodeCounter = 0

function addNode(type: string) {
  const def = nodeDefinitions.find(n => n.type === type)
  if (!def) return
  nodeCounter++
  const id = `${type}-${nodeCounter}`
  const label = `${def.label} ${nodeCounter}`
  addNodes([{
    id,
    type: 'custom',
    position: { x: 100 + nodeCounter * 40, y: 100 + nodeCounter * 60 },
    data: { ...def.defaultData, label, type },
  }])
}

function onConnect(connection: any) {
  addEdges([{
    ...connection,
    id: `e-${connection.source}-${connection.target}`,
    style: { stroke: '#555', strokeWidth: 2 },
  }])
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

    for (const node of nodes.value) {
      if (res[node.id]) {
        node.data = { ...node.data, result: res[node.id] }
      }
    }
  } catch (e) {
    console.error(e)
  }
  running.value = false
}

function clearAll() {
  removeNodes(nodes.value.map((n: any) => n.id))
  removeEdges(edges.value.map((e: any) => e.id))
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
.vue-flow__minimap {
  background: #111 !important;
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
