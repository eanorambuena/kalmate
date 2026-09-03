<template>
  <div class="bg-[#111] border border-[#333] rounded-xl p-3 min-w-[280px] cursor-grab active:cursor-grabbing relative">
    <div class="flex items-center gap-2 mb-2">
      <div class="w-2 h-2 rounded-full" :style="{ backgroundColor: '#ff69b4' }" />
      <span class="text-[10px] font-bold text-[#aaa] uppercase tracking-wider">OUTPUT</span>
    </div>
    <p class="text-white text-xs font-medium mb-2 cursor-pointer hover:text-[#00c853]" @click="startEdit" v-if="!editing">{{ displayLabel }}</p>
    <input v-else ref="inputEl" v-model="editLabel" class="bg-[#1a1a1a] border border-[#444] rounded px-1 py-0.5 text-xs text-white w-full mb-2 outline-none" @blur="saveLabel" @keydown.enter="saveLabel" @keydown.escape="cancelLabel" />
    <div v-if="seriesToPlot.length > 0" class="w-full h-[120px] relative">
      <svg viewBox="0 0 260 118" class="w-full h-full" preserveAspectRatio="none">
        <line x1="5" y1="109" x2="255" y2="109" stroke="#333" stroke-width="1" />
        <path v-if="confidenceBand" :d="confidenceBand.d" :fill="confidenceBand.color" opacity="0.15" />
        <path v-for="(s, idx) in seriesToPlot" :key="idx" :d="areaPath(s.values, s.timestamps)" :fill="s.color" opacity="0.1" />
        <polyline v-for="(s, idx) in seriesToPlot" :key="idx + 100" :points="linePoints(s.values, s.timestamps)" fill="none" :stroke="s.color" stroke-width="2" vector-effect="non-scaling-stroke" />
        <g v-for="(t, idx) in xTicks" :key="'t' + idx">
          <line :x1="t.x" y1="109" :x2="t.x" y2="112" stroke="#444" stroke-width="1" />
          <text :x="t.x" y="116" fill="#888" font-size="6.5" text-anchor="middle" font-family="monospace">{{ t.label }}</text>
        </g>
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

    <div class="flex flex-col gap-1 mt-2">
      <div v-for="inp in inputs" :key="inp.id" class="flex items-center gap-1 relative pl-3">
        <Handle type="target" :position="Position.Left" :id="inp.id" class="w-2 h-2 !bg-[#2979ff] !border-0" :style="{ position:'absolute', left:'0px', top:'50%' }" />
        <Handle type="source" :position="Position.Left" :id="'left:' + inp.id" class="w-2 h-2 !bg-[#2979ff] !border-0 !opacity-0" :style="{ position:'absolute', left:'0px', top:'50%' }" />
        <span class="text-[9px] text-[#aaa]">{{ inp.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import { computed, ref, nextTick } from 'vue'
import { nodeDefinitions } from '~/utils/pipeline/nodeDefinitions'
import { toSeriesValues, toSeriesTimestamps } from '~/utils/series'
import { pointX, toTimeDomain, splitTimeDomain, xLimit } from '~/utils/chart-scale'

const props = defineProps({
  id: { type: String, required: true },
  data: { type: Object, default: () => ({}) },
})

const def = nodeDefinitions.find(n => n.type === 'chartOutput')
const inputs = def?.inputs ?? []
const displayLabel = computed(() => props.data?.label || 'Chart')

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

type Plot = { label: string; values: number[]; timestamps: number[]; color: string }

function norm(series: any): { values: number[]; timestamps: number[] } {
  return { values: toSeriesValues(series), timestamps: toSeriesTimestamps(series, toSeriesValues(series).length) }
}

const seriesToPlot = computed<Plot[]>(() => {
  const r = result.value
  if (!r) return []
  const series: Plot[] = []
  const main = norm(r.mainSeries || r.priceSeries || r.seriesA || r.history || r.price)
  if (main.values.length > 0) {
    series.push({ label: 'Main', values: main.values, timestamps: main.timestamps, color: '#00c853' })
  }
  const overlayA = norm(r.overlayA || r.seriesB || r.overlay1 || r.sma || r.smoothed)
  if (overlayA.values.length > 0) {
    series.push({ label: 'Overlay A', values: overlayA.values, timestamps: overlayA.timestamps, color: '#2979ff' })
  }
  const isConfidence = (r.confidenceSeries || r.confidence) != null
  const overlayB = !isConfidence ? norm(r.overlayB || r.seriesC || r.overlay2 || r.ema || r.forecast) : { values: [], timestamps: [] }
  if (overlayB.values.length > 0) {
    series.push({ label: 'Overlay B', values: overlayB.values, timestamps: overlayB.timestamps, color: '#aa00ff' })
  }
  const overlayC = norm(r.overlayC || r.seriesD || r.overlay3 || r.trend)
  if (overlayC.values.length > 0) {
    series.push({ label: 'Overlay C', values: overlayC.values, timestamps: overlayC.timestamps, color: '#ff6d00' })
  }
  return series
})

const mainTimestamps = computed<number[]>(() =>
  seriesToPlot.value.find(s => s.label === 'Main')?.timestamps ?? seriesToPlot.value[0]?.timestamps ?? [],
)

const timeDomain = computed(() =>
  splitTimeDomain({ global: toTimeDomain(seriesToPlot.value), mainTimes: mainTimestamps.value, fraction: 0.5 }),
)

const xForP = (ts: number | undefined, idx: number, len: number) =>
  pointX(ts, idx, len, timeDomain.value, svgW, pad)

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function fmtTick(ts: number, useMonthLabels: boolean): string {
  const d = new Date(ts)
  const month = MONTHS[d.getMonth()]
  if (useMonthLabels) return `${month} '${String(d.getFullYear()).slice(2)}`
  return `${month} ${d.getDate()}`
}

const xTicks = computed(() => {
  const ts = mainTimestamps.value
  if (ts.length < 2) return []
  const n = ts.length - 1
  const spanDays = (ts[n] - ts[0]) / 86_400_000
  const useMonthLabels = spanDays > 250
  const tickCount = useMonthLabels ? 5 : 3
  const picks: number[] = []
  if (tickCount === 1) picks.push(0)
  else for (let i = 0; i < tickCount; i++) picks.push(Math.round((i / (tickCount - 1)) * n))
  return picks.map(tsIdx => ({
    x: xForP(ts[tsIdx], tsIdx, ts.length),
    label: fmtTick(ts[tsIdx], useMonthLabels),
  }))
})

const price = computed(() => {
  const p = result.value?.price ?? result.value?.source
  return typeof p === 'number' ? p.toFixed(2) : null
})

const svgW = 260, svgH = 114, pad = 5

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

const linePoints = (values: number[], timestamps: number[] = []) => {
  if (values.length < 2) return ''
  const { min, range } = getMinMax(seriesToPlot.value)
  const limit = xLimit(svgW, pad)
  const pts = values
    .map((v: number, i: number) => {
      const x = xForP(timestamps[i], i, values.length)
      return { x, y: svgH - pad - ((v - min) / range) * (svgH - pad * 2), _i: i }
    })
    .filter(p => p.x <= limit)
  if (pts.length < 2) return ''
  return pts.map(p => `${p.x},${p.y}`).join(' ')
}

const confidenceBand = computed<{ d: string; color: string } | null>(() => {
  const r = result.value
  if (!r) return null
  const forecastRaw = r.forecastSeries || r.forecast
  const forecastValues = toSeriesValues(forecastRaw)
  const confidenceValues = toSeriesValues(r.confidenceSeries || r.confidence)
  const forecastTimestamps = toSeriesTimestamps(forecastRaw, forecastValues.length)
  const len = Math.min(forecastValues.length, confidenceValues.length)
  if (len < 2) return null
  const forecastVals = forecastValues.slice(0, len)
  const confidenceVals = confidenceValues.slice(0, len)
  const times = forecastTimestamps.slice(0, len)
  const { min, range } = getMinMax(seriesToPlot.value)
  const limit = xLimit(svgW, pad)
  const upper: { x: number; y: number }[] = []
  const lower: { x: number; y: number }[] = []
  for (let i = 0; i < len; i++) {
    const x = xForP(times[i], i, len)
    if (x > limit) continue
    upper.push({ x, y: svgH - pad - ((forecastVals[i] + confidenceVals[i] - min) / range) * (svgH - pad * 2) })
    lower.push({ x, y: svgH - pad - ((forecastVals[i] - confidenceVals[i] - min) / range) * (svgH - pad * 2) })
  }
  if (upper.length < 2) return null
  let d = `M${upper[0].x},${upper[0].y}`
  for (let i = 1; i < upper.length; i++) d += ` L${upper[i].x},${upper[i].y}`
  for (let i = lower.length - 1; i >= 0; i--) d += ` L${lower[i].x},${lower[i].y}`
  d += ' Z'
  return { d, color: '#aa00ff' }
})

const areaPath = (values: number[], timestamps: number[] = []) => {
  if (values.length < 2) return ''
  const { min, range } = getMinMax(seriesToPlot.value)
  const bottom = svgH - pad
  const limit = xLimit(svgW, pad)
  const pts: { x: number; y: number }[] = []
  values.forEach((v: number, i: number) => {
    const x = xForP(timestamps[i], i, values.length)
    if (x > limit) return
    pts.push({ x, y: svgH - pad - ((v - min) / range) * (svgH - pad * 2) })
  })
  if (pts.length < 2) return ''
  let d = `M${pts[0].x},${bottom}`
  for (const p of pts) d += ` L${p.x},${p.y}`
  d += ` L${pts[pts.length - 1].x},${bottom} Z`
  return d
}</script>
