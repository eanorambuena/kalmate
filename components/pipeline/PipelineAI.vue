<template>
  <Transition name="slide">
    <div v-if="open" class="fixed right-0 top-0 h-full w-96 bg-[#111] border-l border-[#333] shadow-2xl z-20 flex flex-col pointer-events-auto" ref="panelRef">
      <div class="flex items-center justify-between px-4 py-3 border-b border-[#222]">
        <span class="text-xs font-bold text-[#00c853] uppercase tracking-wider flex items-center gap-1.5">
          AI Pipeline
        </span>
        <button class="text-[#bbb] hover:text-white text-xs transition-colors" @click="close" title="Close">✕</button>
      </div>

      <div class="flex-1 overflow-y-auto px-4 py-3 space-y-3" ref="messagesRef">
        <div v-if="!conversation.length" class="text-[#666] text-xs text-center mt-12 leading-relaxed">
          Describe the pipeline you want to build.<br>
          Example: <span class="text-[#888] font-mono">chart AAPL with candles and SMA20</span>
        </div>
        <div v-for="(msg, i) in conversation" :key="i" class="flex" :class="msg.role === 'user' ? 'justify-end' : 'justify-start'">
          <div class="text-xs max-w-[85%] rounded-2xl px-3.5 py-2 leading-relaxed" :class="msg.role === 'user' ? 'bg-[#00c853]/20 text-white' : 'bg-[#222] text-[#ccc]'">
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
            placeholder="Describe your pipeline..."
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
            <Zap class="w-4 h-4" v-if="!generating" />
            <span v-else class="animate-pulse text-[10px]">...</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useAIPipeline } from '~/composables/useAIPipeline'
import { Zap } from '@lucide/vue'

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

watch(() => props.modelValue, (v) => { open.value = v })

watch(open, (v) => {
  emit('update:modelValue', v)
})

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
    conversation.value.push({ role: 'assistant', content: 'Error: ' + plan.error })
  } else {
    result.value = plan
    const summary = `Generated: ${plan.nodes.length} nodes, ${plan.edges.length} connections`
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

<style scoped>
.slide-enter-active, .slide-leave-active {
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-enter-from, .slide-leave-to {
  transform: translateX(100%);
}
</style>
