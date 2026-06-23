<template>
  <div v-if="open" class="fixed z-30 pointer-events-none" :style="panelPos">
    <div class="w-96 bg-[#111] border border-[#333] rounded-2xl shadow-2xl pointer-events-auto flex flex-col overflow-hidden transition-shadow duration-200 hover:shadow-[0_0_30px_rgba(0,200,83,0.1)]"
         ref="panelRef">
      <div
        class="flex items-center justify-between px-4 py-2.5 border-b border-[#222] cursor-grab active:cursor-grabbing select-none"
        @mousedown="startDrag"
      >
        <span class="text-xs font-bold text-[#00c853] uppercase tracking-wider">AI Pipeline</span>
        <button class="text-[#888] hover:text-white text-lg leading-none px-1.5 py-0.5 rounded-lg hover:bg-[#222] transition-colors" @click="close" title="Close">✕</button>
      </div>

      <div class="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0" ref="messagesRef">
        <div v-if="!conversation.length" class="text-[#666] text-xs text-center mt-12 leading-relaxed">
          Describe el pipeline que quieres construir.<br>
          Ej: <span class="text-[#888] font-mono">chart AAPL con SMA20</span>
        </div>
        <div v-for="(msg, i) in conversation" :key="i" class="flex" :class="msg.role === 'user' ? 'justify-end' : 'justify-start'">
          <div class="text-xs max-w-[85%] rounded-2xl px-3.5 py-2 leading-relaxed break-words" :class="msg.role === 'user' ? 'bg-[#00c853]/20 text-white' : 'bg-[#222] text-[#ccc]'">
            {{ msg.content }}
          </div>
        </div>
        <div v-if="generating" class="flex justify-start">
          <div class="bg-[#222] rounded-2xl px-3.5 py-2 text-[#666] text-xs animate-pulse">Generating...</div>
        </div>
      </div>

      <div v-if="error" class="px-4 py-1.5 bg-[#ff1744]/10 border-t border-[#ff1744]/20 text-[#ff1744] text-[10px]">
        {{ error }}
      </div>

      <div v-if="result && !generating" class="px-4 py-1.5 bg-[#00c853]/10 border-t border-[#00c853]/20 text-[#00c853] text-[10px]">
        {{ result.nodes.length }} nodes, {{ result.edges.length }} connections
      </div>

      <div class="p-3 border-t border-[#222]">
        <div class="flex gap-2">
          <input
            v-model="query"
            type="text"
            placeholder="Describe tu pipeline..."
            class="flex-1 bg-[#222] border border-[#444] rounded-xl px-3 py-2 text-white text-xs font-mono outline-none focus:border-[#00c853] transition-colors"
            @keydown.enter="doGenerate"
            :disabled="generating"
          />
          <button
            class="bg-[#00c853] hover:bg-[#00e676] text-black font-bold px-3 py-2 rounded-xl transition-colors disabled:opacity-40 flex items-center"
            :disabled="generating || !query.trim()"
            @click="doGenerate"
            title="Generate"
          >
            <Sparkles class="w-4 h-4" v-if="!generating" />
            <span v-else class="animate-pulse text-[10px]">...</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import { useAIPipeline } from '~/composables/useAIPipeline'
import { Sparkles } from '@lucide/vue'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  apply: [plan: { nodes: any[]; edges: any[] }]
}>()

const { generate } = useAIPipeline()

const open = ref(props.modelValue)
const query = ref('')
const generating = ref(false)
const error = ref('')
const result = ref<{ nodes: any[]; edges: any[] } | null>(null)
const conversation = ref<Array<{ role: string; content: string }>>([])
const messagesRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)

const posX = ref(24)
const posY = ref(80)
const dragging = ref(false)
const dragOffset = { x: 0, y: 0 }

watch(() => props.modelValue, (v) => { open.value = v })
watch(open, (v) => { emit('update:modelValue', v) })

function startDrag(e: MouseEvent) {
  const panel = panelRef.value
  if (!panel) return
  const rect = panel.getBoundingClientRect()
  dragOffset.x = e.clientX - rect.left
  dragOffset.y = e.clientY - rect.top
  dragging.value = true
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

function onDrag(e: MouseEvent) {
  if (!dragging.value) return
  posX.value = e.clientX - dragOffset.x
  posY.value = e.clientY - dragOffset.y
}

function stopDrag() {
  dragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

onUnmounted(() => {
  stopDrag()
})

const panelPos = computed(() => ({
  left: posX.value + 'px',
  top: posY.value + 'px',
}))

async function doGenerate() {
  if (!query.value.trim()) return
  const q = query.value.trim()
  conversation.value.push({ role: 'user', content: q })
  query.value = ''
  generating.value = true
  error.value = ''
  result.value = null
  nextTick(() => scrollBottom())
  const plan = await generate(q)
  if ('error' in plan) {
    error.value = plan.error
    conversation.value.push({ role: 'assistant', content: plan.error })
  } else {
    result.value = plan
    const summary = `Pipeline listo: ${plan.nodes.length} nodos, ${plan.edges.length} conexiones`
    conversation.value.push({ role: 'assistant', content: summary })
    emit('apply', plan)
  }
  generating.value = false
  nextTick(() => scrollBottom())
}

function scrollBottom() {
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}

function close() {
  open.value = false
}
</script>
