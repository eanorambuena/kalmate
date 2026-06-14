<template>
  <div class="bg-[#111] border border-[#333] rounded-xl p-3 min-w-[280px] cursor-grab active:cursor-grabbing relative">
    <div class="flex items-center gap-2 mb-2">
      <div class="w-2 h-2 rounded-full" :style="{ backgroundColor: '#ff69b4' }" />
      <span class="text-[10px] font-bold text-[#888] uppercase tracking-wider">OUTPUT</span>
    </div>
    <p class="text-white text-xs font-medium mb-2">Chart</p>
    <div v-if="seriesToPlot.length > 0" class="w-full h-[120px] relative">
      <svg viewBox="0 0 260 110" class="w-full h-full" preserveAspectRatio="none">
        <path v-for="(s, idx) in seriesToPlot" :key="idx" :d="areaPath(s.values)" :fill="s.color" opacity="0.1" />
        <polyline v-for="(s, idx) in seriesToPlot" :key="idx + 100" :points="linePoints(s.values)" fill="none" :stroke="s.color" stroke-width="2" vector-effect="non-scaling-stroke" />
      </svg>
      <div class="absolute top-2 right-2 flex flex-col gap-1 text-[7px]">
        <span v-for="(s, idx) in seriesToPlot" :key="idx" class="flex items-center gap-1" :style="{ color: s.color }">
          <span class="w-2 h-2 rounded" :style="{ backgroundColor: s.color }" />
          {{ s.label }}
        </span>
      </div>
    </div>
    <div v-else class="h-[120px] flex items-center justify-center text-[#555] text-[10px]">
      {{ result?.error || 'Run pipeline to see chart' }}
    </div>
    <div v-if="price" class="mt-1 text-center">
      <span class="text-white font-mono text-sm font-bold">${{ price }}</span>
    </div>
    <Handle type="target" :position="Position.Left" id="price" class="w-2 h-2 !bg-[#2979ff] !border-0" />
    <Handle type="target" :position="Position.Left" id="history" class="w-2 h-2 !bg-[#2979ff] !border-0" style="top: 25%" />
    <Handle type="target" :position="Position.Left" id="smoothed" class="w-2 h-2 !bg-[#2979ff] !border-0" style="top: 45%" />
    <Handle type="target" :position="Position.Left" id="trend" class="w-2 h-2 !bg-[#2979ff] !border-0" style="top: 65%" />
    <Handle type="target" :position="Position.Left" id="sma" class="w-2 h-2 !bg-[#2979ff] !border-0" style="top: 85%" />
    <Handle type="target" :position="Position.Left" id="ema" class="w-2 h-2 !bg-[#2979ff] !border-0" style="top: 95%" />
    <Handle type="target" :position="Position.Left" id="forecast" class="w-2 h-2 !bg-[#2979ff] !border-0" style="top: 105%" />
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
  const history = r.history || r.price
  if (Array.isArray(history) && history.length > 0) {
    series.push({ label: 'Price', values: history.map((d: any) => d.close ?? d), color: '#00c853' })
  }
  if (Array.isArray(r.smoothed) && r.smoothed.length > 0) {
    series.push({ label: 'Smoothed (Kalman)', values: r.smoothed, color: '#ff69b4' })
  }
  if (Array.isArray(r.trend) && r.trend.length > 0) {
    series.push({ label: 'Trend (Kalman)', values: r.trend, color: '#ff6d00' })
  }
  if (Array.isArray(r.sma) && r.sma.length > 0) {
    series.push({ label: 'SMA', values: r.sma, color: '#2979ff' })
  }
  if (Array.isArray(r.ema) && r.ema.length > 0) {
    series.push({ label: 'EMA', values: r.ema, color: '#aa00ff' })
  }
  if (Array.isArray(r.forecast) && r.forecast.length > 0) {
    series.push({ label: 'Forecast', values: r.forecast, color: '#ff9100' })
  }
  return series
})

const price = computed(() => result.value?.price)

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
