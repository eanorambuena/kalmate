<template>
  <div class="bg-[#111] border border-[#333] rounded-xl p-3 min-w-[280px] cursor-grab active:cursor-grabbing relative">
    <div class="flex items-center gap-2 mb-2">
      <div class="w-2 h-2 rounded-full" :style="{ backgroundColor: '#ff69b4' }" />
      <span class="text-[10px] font-bold text-[#888] uppercase tracking-wider">OUTPUT</span>
    </div>
    <p class="text-white text-xs font-medium mb-2">Chart</p>
    <div v-if="chartData.length > 0" ref="chartRef" class="w-full h-[120px]" />
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
import { createChart, ColorType } from 'lightweight-charts'

const props = defineProps({
  id: { type: String, required: true },
  data: { type: Object, default: () => ({}) },
})

const chartRef = ref<HTMLDivElement | null>(null)
const result = computed(() => props.data?.result)
const chartData = computed(() => {
  const h = result.value?.history || result.value?.price
  if (Array.isArray(h)) return h
  return []
})
const price = computed(() => result.value?.price)

onMounted(() => {
  if (chartData.value.length > 0 && chartRef.value) {
    renderChart()
  }
})

watch(chartData, () => {
  if (chartData.value.length > 0 && chartRef.value) {
    nextTick(() => renderChart())
  }
})

function renderChart() {
  if (!chartRef.value) return
  chartRef.value.innerHTML = ''
  const chart = createChart(chartRef.value, {
    width: chartRef.value.clientWidth,
    height: 120,
    layout: { background: { type: ColorType.Solid, color: '#111' }, textColor: '#555' },
    grid: { vertLines: { color: '#222' }, horzLines: { color: '#222' } },
    crosshair: { vertLine: { visible: false }, horzLine: { visible: false } },
    timeScale: { visible: false },
    rightPriceScale: { visible: true, borderColor: '#333', textColor: '#555' },
  })
  const series = chart.addAreaSeries({
    lineColor: '#00c853',
    topColor: '#00c85330',
    bottomColor: '#00c85305',
    lineWidth: 2,
    priceFormat: { type: 'price', minMove: 0.01 },
  })
  series.setData(chartData.value.map((d: any, i: number) => ({
    time: (d.timestamp || i) as any,
    value: d.close || d,
  })))
  chart.timeScale().fitContent()
}
</script>
