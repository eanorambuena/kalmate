<template>
  <div class="bg-[#111] border border-[#333] rounded-xl p-3 min-w-[280px] cursor-grab active:cursor-grabbing relative">
    <div class="flex items-center gap-2 mb-2">
      <div class="w-2 h-2 rounded-full" :style="{ backgroundColor: '#ff69b4' }" />
      <span class="text-[10px] font-bold text-[#aaa] uppercase tracking-wider">OUTPUT</span>
    </div>
    <p class="text-white text-xs font-medium mb-2 cursor-pointer hover:text-[#00c853]" @click="startEdit" v-if="!editing">{{ displayLabel }}</p>
    <input v-else ref="inputEl" v-model="editLabel" class="bg-[#1a1a1a] border border-[#444] rounded px-1 py-0.5 text-xs text-white w-full mb-2 outline-none" @blur="saveLabel" @keydown.enter="saveLabel" @keydown.escape="cancelLabel" />
    <div v-if="candles.length > 0" class="w-full h-[120px] relative">
      <svg viewBox="0 0 260 110" class="w-full h-full" preserveAspectRatio="none">
        <g v-for="(c, i) in visibleCandles.items" :key="i">
          <line :x1="c.x" :y1="c.highY" :x2="c.x" :y2="c.lowY" :stroke="c.color" stroke-width="1" />
          <rect :x="c.x - c.w / 2" :y="c.bodyTop" :width="c.w" :height="c.bodyH" :fill="c.color" />
        </g>
        <polyline v-for="(ov, idx) in overlays" :key="'ov-'+idx" :points="ov.points" fill="none" :stroke="ov.color" stroke-width="1.5" vector-effect="non-scaling-stroke" />
      </svg>
      <div class="absolute top-2 right-2 flex flex-col gap-1 text-[9px]">
        <span class="text-[#aaa] font-mono">{{ candles.length }} candles</span>
        <span v-for="(ov, idx) in overlays" :key="idx" class="flex items-center gap-1" :style="{ color: ov.color }">
          <span class="w-2 h-0.5 rounded" :style="{ backgroundColor: ov.color }" />
          {{ ov.label }}
        </span>
      </div>
    </div>
    <div v-else class="h-[120px] flex items-center justify-center text-[#aaa] text-[10px]">
      {{ result?.error || 'Run pipeline to see candles' }}
    </div>
    <div v-if="lastPrice" class="mt-1 text-center">
      <span class="text-white font-mono text-sm font-bold" :class="lastPrice >= openPrice ? 'text-[#00c853]' : 'text-[#ff1744]'">${{ lastPrice }}</span>
    </div>

    <div class="flex flex-col gap-1 mt-2">
      <div v-for="inp in inputs" :key="inp.id" class="flex items-center gap-1 relative pl-3">
        <Handle type="target" :position="Position.Left" :id="inp.id" class="w-2 h-2 !bg-[#2979ff] !border-0" :style="{ position:'absolute', left:'0px', top:'50%' }" />
        <span class="text-[9px] text-[#aaa]">{{ inp.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import { computed, ref, nextTick } from 'vue'
import { nodeDefinitions } from '~/utils/pipeline/nodeDefinitions'

const props = defineProps({
  id: { type: String, required: true },
  data: { type: Object, default: () => ({}) },
})

const emit = defineEmits<{ 'update:data': [data: any] }>()

const def = nodeDefinitions.find(n => n.type === 'candleChart')
const inputs = def?.inputs ?? []

const result = computed(() => props.data?.result)
const displayLabel = computed(() => props.data?.label || 'Candle Chart')

const editing = ref(false)
const editLabel = ref('')
const inputEl = ref<HTMLInputElement>()

function startEdit() {
  editLabel.value = displayLabel.value
  editing.value = true
  nextTick(() => inputEl.value?.focus())
}

function saveLabel() {
  if (editLabel.value.trim()) {
    emit('update:data', { ...props.data, label: editLabel.value.trim() })
  }
  editing.value = false
}

function cancelLabel() {
  editing.value = false
}

const candles = computed(() => {
  const ohlc = result.value?.ohlc
  if (!Array.isArray(ohlc) || ohlc.length < 2) return []
  return ohlc.filter((h: any) => h.open > 0 && h.high > 0 && h.low > 0 && h.close > 0)
})

const svgW = 260, svgH = 110, pad = 5, maxCandles = 40

const visibleCandles = computed(() => {
  const all = candles.value
  if (all.length === 0) return []
  const slice = all.slice(-maxCandles)
  let min = Infinity, max = -Infinity
  for (const c of slice) {
    if (c.low < min) min = c.low
    if (c.high > max) max = c.high
  }
  const range = max - min || 1
  const candleW = (svgW - pad * 2) / slice.length
  const yScale = (v: number) => svgH - pad - ((v - min) / range) * (svgH - pad * 2)
  return {
    items: slice.map((c: any, i: number) => {
      const x = pad + i * candleW + candleW / 2
      const highY = yScale(c.high)
      const lowY = yScale(c.low)
      const openY = yScale(c.open)
      const closeY = yScale(c.close)
      const bodyTop = Math.min(openY, closeY)
      const bodyH = Math.max(closeY - openY, 1) || 1
      return { x, highY, lowY, bodyTop, bodyH, w: Math.max(candleW * 0.6, 1), color: c.close >= c.open ? '#00c853' : '#ff1744' }
    }),
    min, range,
  }
})

const overlays = computed(() => {
  const r = result.value
  if (!r) return []
  const slice = candles.value.slice(-maxCandles)
  if (slice.length === 0) return []
  const { min, range } = visibleCandles.value
  const candleW = (svgW - pad * 2) / slice.length
  const yScale = (v: number) => svgH - pad - ((v - min) / range) * (svgH - pad * 2)
  const xAt = (i: number) => pad + i * candleW + candleW / 2

  type Overlay = { label: string; color: string; points: string }
  const out: Overlay[] = []
  const overlaysRaw: [string, string, string][] = [
    [r.seriesB, 'Overlay A', '#2979ff'],
    [r.seriesC, 'Overlay B', '#aa00ff'],
    [r.seriesD, 'Overlay C', '#ff6d00'],
  ]
  for (const [data, label, color] of overlaysRaw) {
    if (!Array.isArray(data) || data.length < 2) continue
    const pts = data.slice(-maxCandles).map((v: number, i: number) => `${xAt(i)},${yScale(v)}`).join(' ')
    out.push({ label, color, points: pts })
  }
  return out
})

const lastPrice = computed(() => {
  const ohlc = result.value?.ohlc
  if (!Array.isArray(ohlc) || ohlc.length === 0) return null
  return ohlc[ohlc.length - 1].close?.toFixed(2) ?? null
})

const openPrice = computed(() => {
  const ohlc = result.value?.ohlc
  if (!Array.isArray(ohlc) || ohlc.length === 0) return 0
  return ohlc[ohlc.length - 1].open ?? 0
})
</script>
