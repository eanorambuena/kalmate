<template>
  <div class="bg-[#111] border border-[#333] rounded-xl p-3 min-w-[280px] cursor-grab active:cursor-grabbing relative">
    <div class="flex items-center gap-2 mb-2">
      <div class="w-2 h-2 rounded-full" :style="{ backgroundColor: '#ff69b4' }" />
      <span class="text-[10px] font-bold text-[#aaa] uppercase tracking-wider">{{ $t('chart.output') }}</span>
    </div>
    <p class="text-white text-xs font-medium mb-2 cursor-pointer hover:text-[#00c853]" @click="startEdit" v-if="!editing">{{ displayLabel }}</p>
    <input v-else ref="inputEl" v-model="editLabel" class="bg-[#1a1a1a] border border-[#444] rounded px-1 py-0.5 text-xs text-white w-full mb-2 outline-none" @blur="saveLabel" @keydown.enter="saveLabel" @keydown.escape="cancelLabel" />
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
      {{ result?.error || $t('chart.empty') }}
    </div>
    <div v-if="price" class="mt-1 text-center">
      <span class="text-white font-mono text-sm font-bold">${{ price }}</span>
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

const { t } = useI18n()

const props = defineProps({
  id: { type: String, required: true },
  data: { type: Object, default: () => ({}) },
})

const def = nodeDefinitions.find(n => n.type === 'chartOutput')
const inputs = def?.inputs ?? []
const displayLabel = computed(() => props.data?.label || t('chart.chart'))

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
    props.data.label = editLabel.value.trim()
  }
  editing.value = false
}

function cancelLabel() {
  editing.value = false
}

const result = computed(() => props.data?.result)

const seriesToPlot = computed(() => {
  const r = result.value
  if (!r) return []
  const series: Array<{ label: string; values: number[]; color: string }> = []
  const mainSeries = r.seriesA || r.history || r.series || r.price
  if (Array.isArray(mainSeries) && mainSeries.length > 0) {
    series.push({ label: t('chart.main'), values: mainSeries.map((d: any) => d.close ?? d), color: '#00c853' })
  }
  const overlayA = r.seriesB || r.overlay1 || r.sma || r.smoothed
  if (Array.isArray(overlayA) && overlayA.length > 0) {
    series.push({ label: t('chart.overlayA'), values: overlayA, color: '#2979ff' })
  }
  const overlayB = r.seriesC || r.overlay2 || r.ema || r.forecast
  if (Array.isArray(overlayB) && overlayB.length > 0) {
    series.push({ label: t('chart.overlayB'), values: overlayB, color: '#aa00ff' })
  }
  const overlayC = r.seriesD || r.overlay3 || r.trend
  if (Array.isArray(overlayC) && overlayC.length > 0) {
    series.push({ label: t('chart.overlayC'), values: overlayC, color: '#ff6d00' })
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
