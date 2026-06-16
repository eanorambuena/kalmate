<template>
  <div class="bg-[#111] border border-[#333] rounded-xl p-3 min-w-[280px] cursor-grab active:cursor-grabbing relative">
    <div class="flex items-center gap-2 mb-2">
      <div class="w-2 h-2 rounded-full" :style="{ backgroundColor: '#ff69b4' }" />
      <span class="text-[10px] font-bold text-[#aaa] uppercase tracking-wider">OUTPUT</span>
    </div>
    <p class="text-white text-xs font-medium mb-2">Candle Chart</p>
    <div v-if="candles.length > 0" class="w-full h-[120px] relative">
      <svg viewBox="0 0 260 110" class="w-full h-full" preserveAspectRatio="none">
        <g v-for="(c, i) in visibleCandles" :key="i">
          <line :x1="c.x" :y1="c.highY" :x2="c.x" :y2="c.lowY" :stroke="c.color" stroke-width="1" />
          <rect :x="c.x - c.w / 2" :y="c.bodyTop" :width="c.w" :height="c.bodyH" :fill="c.color" />
        </g>
      </svg>
      <div class="absolute top-2 right-2 text-[9px] text-[#aaa] font-mono">
        {{ candles.length }} velas
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
import { computed } from 'vue'
import { nodeDefinitions } from '~/utils/pipeline/nodeDefinitions'

const props = defineProps({
  id: { type: String, required: true },
  data: { type: Object, default: () => ({}) },
})

const def = nodeDefinitions.find(n => n.type === 'candleChart')
const inputs = def?.inputs ?? []

const result = computed(() => props.data?.result)

const candles = computed(() => {
  const ohlc = result.value?.ohlc
  if (!Array.isArray(ohlc) || ohlc.length < 2) return []
  return ohlc.filter((h: any) => h.open > 0 && h.high > 0 && h.low > 0 && h.close > 0)
})

const svgW = 260, svgH = 110, pad = 5
const maxCandles = 40

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
  return slice.map((c: any, i: number) => {
    const x = pad + i * candleW + candleW / 2
    const highY = svgH - pad - ((c.high - min) / range) * (svgH - pad * 2)
    const lowY = svgH - pad - ((c.low - min) / range) * (svgH - pad * 2)
    const openY = svgH - pad - ((c.open - min) / range) * (svgH - pad * 2)
    const closeY = svgH - pad - ((c.close - min) / range) * (svgH - pad * 2)
    const bodyTop = Math.min(openY, closeY)
    const bodyBottom = Math.max(openY, closeY)
    const bodyH = bodyBottom - bodyTop || 1
    const green = c.close >= c.open
    return { x, highY, lowY, bodyTop, bodyH, w: Math.max(candleW * 0.6, 1), color: green ? '#00c853' : '#ff1744' }
  })
})

const lastPrice = computed(() => {
  const ohlc = result.value?.ohlc
  if (!Array.isArray(ohlc) || ohlc.length === 0) return null
  const last = ohlc[ohlc.length - 1]
  return last.close?.toFixed(2) ?? null
})

const openPrice = computed(() => {
  const ohlc = result.value?.ohlc
  if (!Array.isArray(ohlc) || ohlc.length === 0) return 0
  return ohlc[ohlc.length - 1].open ?? 0
})
</script>
