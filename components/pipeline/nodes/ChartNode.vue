<template>
  <div class="bg-[#111] border border-[#333] rounded-xl p-3 min-w-[280px] cursor-grab active:cursor-grabbing relative">
    <div class="flex items-center gap-2 mb-2">
      <div class="w-2 h-2 rounded-full" :style="{ backgroundColor: '#ff69b4' }" />
      <span class="text-[10px] font-bold text-[#aaa] uppercase tracking-wider">OUTPUT</span>
    </div>
    <p class="text-white text-xs font-medium mb-2">Chart</p>
    <div v-if="seriesToPlot.length > 0" class="w-full h-[120px] relative">
      <svg viewBox="0 0 260 110" class="w-full h-full" preserveAspectRatio="none">
        <path v-for="(s, idx) in seriesToPlot" :key="idx" :d="areaPath(s.values)" :fill="s.color" opacity="0.1" />
        <polyline v-for="(s, idx) in seriesToPlot" :key="idx + 100" :points="linePoints(s.values)" fill="none" :stroke="s.color" stroke-width="2" vector-effect="non-scaling-stroke" />
      </svg>
      <div class="absolute top-2 right-2 flex flex-col gap-1 text-[9px]">
        <span v-for="(s, idx) in seriesToPlot" :key="idx" class="flex items-center gap-1" :style="{ color: s.color }">
          <span class="w-2 h-2 rounded" :style="{ backgroundColor: s.color }" />
          {{ s.label }}
        </span>
      </div>
    </div>
    <div v-else class="h-[120px] flex items-center justify-center text-[#aaa] text-[10px]">
      {{ result?.error || 'Run pipeline to see chart' }}
    </div>
    <div v-if="price" class="mt-1 text-center">
      <span class="text-white font-mono text-sm font-bold">${{ price }}</span>
    </div>

    <div class="flex items-start justify-between gap-2 mb-1">
      <div class="flex flex-col gap-1">
        <div class="flex items-center gap-1">
          <Handle type="target" :position="Position.Left" id="series" class="w-2 h-2 !bg-[#2979ff] !border-0" />
          <span class="text-[9px] text-[#aaa] w-20">series (price[])</span>
        </div>
        <div class="flex items-center gap-1">
          <Handle type="target" :position="Position.Left" id="overlay1" class="w-2 h-2 !bg-[#2979ff] !border-0" />
          <span class="text-[9px] text-[#aaa] w-20">overlay 1 (series)</span>
        </div>
        <div class="flex items-center gap-1">
          <Handle type="target" :position="Position.Left" id="overlay2" class="w-2 h-2 !bg-[#2979ff] !border-0" />
          <span class="text-[9px] text-[#aaa] w-20">overlay 2 (series)</span>
        </div>
        <div class="flex items-center gap-1">
          <Handle type="target" :position="Position.Left" id="overlay3" class="w-2 h-2 !bg-[#2979ff] !border-0" />
          <span class="text-[9px] text-[#aaa] w-20">overlay 3 (series)</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import { computed } from 'vue'

const props = defineProps({
  id: { type: String, required: true },
  data: { type: Object, default: () => ({}) },
})

const result = computed(() => props.data?.result)

const seriesToPlot = computed(() => {
  const r = result.value
  if (!r) return []
  const series: Array<{ label: string; values: number[]; color: string }> = []
  const mainSeries = r.seriesA || r.history || r.series || r.price
  if (Array.isArray(mainSeries) && mainSeries.length > 0) {
    series.push({ label: 'Main', values: mainSeries.map((d: any) => d.close ?? d), color: '#00c853' })
  }
  const overlayA = r.seriesB || r.overlay1 || r.sma || r.smoothed
  if (Array.isArray(overlayA) && overlayA.length > 0) {
    series.push({ label: 'Overlay A', values: overlayA, color: '#2979ff' })
  }
  const overlayB = r.seriesC || r.overlay2 || r.ema || r.forecast
  if (Array.isArray(overlayB) && overlayB.length > 0) {
    series.push({ label: 'Overlay B', values: overlayB, color: '#aa00ff' })
  }
  const overlayC = r.seriesD || r.overlay3 || r.trend
  if (Array.isArray(overlayC) && overlayC.length > 0) {
    series.push({ label: 'Overlay C', values: overlayC, color: '#ff6d00' })
  }
  return series
})

const price = computed(() => {
  const p = result.value?.source ?? result.value?.price
  return typeof p === 'number' ? p.toFixed(2) : null
})

const svgW = 260, svgH = 110, pad = 5

const getMinMax = (series: Array<{ values: number[] }>) => {
  let min = Infinity, max = -Infinity
  for (const s of series) {
    for (const v of s.values) {
      if (v < min) min = v
      if (v > max) max = v
    }
  }
  return { min, max, range: max - min || 1 }
}

const linePoints = (values: number[]) => {
  if (values.length < 2) return ''
  const { min, range } = getMinMax(seriesToPlot.value)
  return values.map((v: number, i: number) => {
    const x = pad + (i / (values.length - 1)) * (svgW - pad * 2)
    const y = svgH - pad - ((v - min) / range) * (svgH - pad * 2)
    return `${x},${y}`
  }).join(' ')
}

const areaPath = (values: number[]) => {
  if (values.length < 2) return ''
  const { min, range } = getMinMax(seriesToPlot.value)
  const bottom = svgH - pad
  let d = `M${pad},${bottom}`
  values.forEach((v: number, i: number) => {
    const x = pad + (i / (values.length - 1)) * (svgW - pad * 2)
    const y = svgH - pad - ((v - min) / range) * (svgH - pad * 2)
    d += ` L${x},${y}`
  })
  d += ` L${pad + (svgW - pad * 2)},${bottom} Z`
  return d
}
</script>
