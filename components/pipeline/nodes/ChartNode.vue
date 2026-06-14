<template>
  <div class="bg-[#111] border border-[#333] rounded-xl p-3 min-w-[280px] cursor-grab active:cursor-grabbing relative">
    <div class="flex items-center gap-2 mb-2">
      <div class="w-2 h-2 rounded-full" :style="{ backgroundColor: '#ff69b4' }" />
      <span class="text-[10px] font-bold text-[#888] uppercase tracking-wider">OUTPUT</span>
    </div>
    <p class="text-white text-xs font-medium mb-2">Chart</p>
    <div v-if="chartPoints.length > 0" class="w-full h-[120px] relative">
      <svg viewBox="0 0 260 110" class="w-full h-full" preserveAspectRatio="none">
        <polyline :points="svgPoints" fill="none" stroke="#00c853" stroke-width="2" vector-effect="non-scaling-stroke" />
        <path :d="svgArea" fill="#00c853" opacity="0.15" />
      </svg>
    </div>
    <div v-else class="h-[120px] flex items-center justify-center text-[#555] text-[10px]">
      {{ result?.error || 'Run pipeline to see chart' }}
    </div>
    <div v-if="price" class="mt-1 text-center">
      <span class="text-white font-mono text-sm font-bold">${{ price }}</span>
    </div>
    <Handle type="target" :position="Position.Left" id="price" class="w-2 h-2 !bg-[#2979ff] !border-0" />
    <Handle type="target" :position="Position.Left" id="smoothed" class="w-2 h-2 !bg-[#2979ff] !border-0" style="top: 60%" />
    <Handle type="target" :position="Position.Left" id="trend" class="w-2 h-2 !bg-[#2979ff] !border-0" style="top: 75%" />
  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'

const props = defineProps({
  id: { type: String, required: true },
  data: { type: Object, default: () => ({}) },
})

const result = computed(() => props.data?.result)

const chartPoints = computed(() => {
  const h = result.value?.history
  if (!Array.isArray(h) || h.length === 0) return []
  return h.map((d: any) => d.close ?? d)
})

const price = computed(() => result.value?.price)

const svgW = 260, svgH = 110, pad = 5

const svgPoints = computed(() => {
  const pts = chartPoints.value
  if (pts.length < 2) return ''
  const min = Math.min(...pts)
  const max = Math.max(...pts)
  const range = max - min || 1
  return pts.map((v: number, i: number) => {
    const x = pad + (i / (pts.length - 1)) * (svgW - pad * 2)
    const y = svgH - pad - ((v - min) / range) * (svgH - pad * 2)
    return `${x},${y}`
  }).join(' ')
})

const svgArea = computed(() => {
  const pts = chartPoints.value
  if (pts.length < 2) return ''
  const min = Math.min(...pts)
  const max = Math.max(...pts)
  const range = max - min || 1
  const firstX = pad
  const lastX = pad + (svgW - pad * 2)
  const bottom = svgH - pad
  let d = `M${firstX},${bottom}`
  pts.forEach((v: number, i: number) => {
    const x = pad + (i / (pts.length - 1)) * (svgW - pad * 2)
    const y = svgH - pad - ((v - min) / range) * (svgH - pad * 2)
    d += ` L${x},${y}`
  })
  d += ` L${lastX},${bottom} Z`
  return d
})
</script>
