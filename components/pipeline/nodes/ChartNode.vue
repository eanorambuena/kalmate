<template>
  <div class="group relative w-[280px] bg-[#111] border border-[#333] rounded-xl p-3 cursor-grab active:cursor-grabbing">
    <button
      type="button"
      class="nodrag absolute top-1.5 right-1.5 z-10 w-4 h-4 flex items-center justify-center rounded text-[#888] hover:text-white hover:bg-[#333] text-xs leading-none opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
      title="Remove node"
      aria-label="Remove node"
      @click.stop="removeSelf"
    >×</button>

    <div class="flex items-center gap-2 mb-1.5 pr-5">
      <div class="w-2 h-2 rounded-full flex-shrink-0" :style="{ backgroundColor: '#ff69b4' }" />
      <span class="text-[10px] font-bold text-[#aaa] uppercase tracking-wider">Output</span>
    </div>
    <p v-if="!editing" class="nodrag text-white text-xs font-medium mb-2 cursor-pointer hover:text-[#00c853] truncate" :title="displayLabel" @click="startEdit">{{ displayLabel }}</p>
    <input
      v-else
      ref="inputEl"
      v-model="editLabel"
      class="nodrag bg-[#1a1a1a] border border-[#444] rounded px-1 py-0.5 text-xs text-white w-full mb-2 outline-none"
      @blur="saveLabel"
      @keydown.enter="saveLabel"
      @keydown.escape="cancelLabel"
    />

    <div class="flex items-center justify-between gap-2 mb-2">
      <div class="flex flex-wrap gap-x-2.5 gap-y-1 text-[9px] min-w-0" aria-label="Legend">
        <span v-for="s in series" :key="s.key" class="flex items-center gap-1 min-w-0">
          <span class="w-2 h-2 rounded-sm flex-shrink-0" :style="{ backgroundColor: s.color }" />
          <span class="text-[#bbb] truncate max-w-[110px]" :title="s.label">{{ s.label }}</span>
          <span class="font-mono text-white">{{ s.last == null ? '—' : formatValue(s.last, s.unit) }}</span>
        </span>
      </div>
      <select
        v-model="horizon"
        class="nodrag flex-shrink-0 bg-[#1a1a1a] border border-[#444] rounded px-1 py-0.5 text-[10px] text-white outline-none focus:border-[#00c853] cursor-pointer"
        aria-label="Horizon"
      >
        <option v-for="opt in horizonOptions" :key="opt" :value="opt">{{ opt === 'ALL' ? 'All' : opt }}</option>
      </select>
    </div>

    <svg
      v-if="series.length > 0"
      :viewBox="`0 0 ${W} ${H}`"
      class="w-full h-auto block"
      role="img"
      :aria-label="`${displayLabel}: ${series.length} series`"
    >
      <!-- Main panel -->
      <line :x1="PADL" :y1="MAIN_BOTTOM" :x2="W - PADR" :y2="MAIN_BOTTOM" stroke="#333" stroke-width="1" />
      <text v-if="mainRange" :x="PADL - 3" :y="MAIN_TOP + 4" fill="#888" font-size="6.5" text-anchor="end" font-family="monospace">{{ formatValue(mainRange.max, mainUnit) }}</text>
      <text v-if="mainRange" :x="PADL - 3" :y="MAIN_BOTTOM" fill="#888" font-size="6.5" text-anchor="end" font-family="monospace">{{ formatValue(mainRange.min, mainUnit) }}</text>

      <g v-for="s in mainPlots" :key="'m-' + s.key">
        <path v-if="s.band" :d="s.band" :fill="s.color" fill-opacity="0.15" stroke="none" />
        <polyline v-if="s.line" :points="s.line" fill="none" :stroke="s.color" stroke-width="1.5" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
      </g>

      <!-- Secondary panel: one scale per unit -->
      <g v-if="secondaryPlots.length > 0">
        <line :x1="PADL" :y1="SEC_TOP - 6" :x2="W - PADR" :y2="SEC_TOP - 6" stroke="#2a2a2a" stroke-width="1" stroke-dasharray="2 2" />
        <g v-if="secondaryLabels">
          <text :x="PADL - 3" :y="SEC_TOP + 4" fill="#888" font-size="6.5" text-anchor="end" font-family="monospace">{{ secondaryLabels.max }}</text>
          <text :x="PADL - 3" :y="SEC_BOTTOM" fill="#888" font-size="6.5" text-anchor="end" font-family="monospace">{{ secondaryLabels.min }}</text>
        </g>
        <line :x1="PADL" :y1="SEC_BOTTOM" :x2="W - PADR" :y2="SEC_BOTTOM" stroke="#333" stroke-width="1" />
        <g v-for="s in secondaryPlots" :key="'s-' + s.key">
          <path v-if="s.band" :d="s.band" :fill="s.color" fill-opacity="0.15" stroke="none" />
          <polyline v-if="s.line" :points="s.line" fill="none" :stroke="s.color" stroke-width="1.5" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
        </g>
      </g>

      <!-- Time axis -->
      <g v-for="(t, idx) in ticks" :key="'t' + idx">
        <line :x1="t.x" :y1="axisBase" :x2="t.x" :y2="axisBase + 3" stroke="#444" stroke-width="1" />
        <text :x="t.x" :y="axisBase + 12" fill="#888" font-size="6.5" :text-anchor="t.anchor" font-family="monospace">{{ t.label }}</text>
      </g>
    </svg>
    <div v-else class="h-[120px] flex items-center justify-center text-center text-[#aaa] text-[10px] px-2">
      {{ result?.error || 'Run pipeline to see chart' }}
    </div>

    <div class="flex flex-col gap-1 mt-2">
      <div v-for="inp in inputs" :key="inp.id" class="flex items-center gap-1 relative pl-3">
        <Handle type="target" :position="Position.Left" :id="inp.id" class="w-2 h-2 !bg-[#2979ff] !border-0" :style="{ position: 'absolute', left: '0px', top: '50%' }" />
        <Handle type="source" :position="Position.Left" :id="'left:' + inp.id" class="w-2 h-2 !bg-[#2979ff] !border-0 !opacity-0" :style="{ position: 'absolute', left: '0px', top: '50%' }" />
        <span class="text-[9px] text-[#aaa]">{{ inp.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import { computed, ref, nextTick } from 'vue'
import { nodeDefinitions } from '../../../utils/pipeline/nodeDefinitions'
import { formatValue } from '../../../utils/pipeline/values'
import {
  toTimeDomain,
  splitTimeDomain,
  splitPanels,
  groupByUnit,
  yRange,
  valueToY,
  plotX,
  bandPath,
  type ChartPoint,
  type ValueRange,
} from '../../../utils/chart-scale'

const props = defineProps({
  id: { type: String, required: true },
  data: { type: Object, default: () => ({}) },
})

const { removeNodes } = useVueFlow()

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

function removeSelf() {
  removeNodes([props.id], true)
}

// ---- Layout (SVG user units; the svg scales to the node width) ----
const W = 256
const PADL = 34
const PADR = 4
const MAIN_TOP = 6
const MAIN_BOTTOM = 110
const SEC_TOP = 122
const SEC_BOTTOM = 160
const DAY = 86_400_000

const HORIZONS: Record<string, number> = { '1M': 30, '3M': 90, '6M': 180, '1Y': 365, '2Y': 730 }
const horizonOptions = ['1M', '3M', '6M', '1Y', '2Y', 'ALL']
const horizon = ref('1Y')

const HANDLE_COLORS: Record<string, string> = {
  mainSeries: '#00c853',
  overlayA: '#2979ff',
  overlayB: '#aa00ff',
  overlayC: '#ff6d00',
}
const FALLBACK_COLORS = ['#ffd600', '#00e5ff', '#ff4081']

const result = computed<any>(() => props.data?.result)

type PlotSeries = {
  key: string
  label: string
  unit: string
  color: string
  points: ChartPoint[]
  last: number | null
}

const series = computed<PlotSeries[]>(() => {
  const raw = result.value?.series
  if (!Array.isArray(raw)) return []
  const days = HORIZONS[horizon.value]
  const cut = days ? Date.now() - days * DAY : 0
  const out: PlotSeries[] = []
  raw.forEach((s: any, i: number) => {
    const points: ChartPoint[] = (Array.isArray(s?.points) ? s.points : []).filter(
      (p: ChartPoint) => Number.isFinite(p?.value) && (cut === 0 || p.timestamp >= cut),
    )
    if (points.length === 0) return
    const key = String(s.handle ?? i)
    out.push({
      key,
      label: String(s.label ?? key),
      unit: s.unit ?? 'price',
      color: HANDLE_COLORS[key] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]!,
      points,
      last: points[points.length - 1]!.value,
    })
  })
  return out
})

const panels = computed(() => splitPanels(series.value))
const mainSeries = computed(() => panels.value.main)
const secondary = computed(() => panels.value.secondary)
const mainUnit = computed(() => mainSeries.value[0]?.unit ?? 'price')
const hasSecondary = computed(() => secondary.value.length > 0)
const axisBase = computed(() => (hasSecondary.value ? SEC_BOTTOM : MAIN_BOTTOM))
const H = computed(() => axisBase.value + 16)

const domain = computed(() => {
  const global = toTimeDomain(series.value.map(s => ({ timestamps: s.points.map(p => p.timestamp) })))
  return splitTimeDomain({
    global,
    mainTimes: mainSeries.value[0]?.points.map(p => p.timestamp),
    fraction: 0.5,
  })
})

const mainRange = computed<ValueRange | null>(() => yRange(mainSeries.value))

type Drawn = { key: string; color: string; line: string; band: string }

/** Polyline and band for one series on a panel with the given range. */
function drawSeries(s: PlotSeries, range: ValueRange, top: number, bottom: number): Drawn {
  const n = s.points.length
  const xy = (p: ChartPoint, i: number) => ({
    x: plotX(p.timestamp, i, n, domain.value, PADL, W - PADR),
    y: valueToY(p.value, range, top, bottom),
  })
  const line = s.points
    .map((p, i) => xy(p, i))
    .map(q => `${q.x.toFixed(1)},${q.y.toFixed(1)}`)
    .join(' ')
  const banded = s.points
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => Number.isFinite(p.lower) && Number.isFinite(p.upper))
  const upper = banded.map(({ p, i }) => ({
    x: plotX(p.timestamp, i, n, domain.value, PADL, W - PADR),
    y: valueToY(p.upper!, range, top, bottom),
  }))
  const lower = banded.map(({ p, i }) => ({
    x: plotX(p.timestamp, i, n, domain.value, PADL, W - PADR),
    y: valueToY(p.lower!, range, top, bottom),
  }))
  return { key: s.key, color: s.color, line, band: bandPath(upper, lower) }
}

const mainPlots = computed<Drawn[]>(() => {
  const range = mainRange.value
  if (!range) return []
  return mainSeries.value.map(s => drawSeries(s, range, MAIN_TOP, MAIN_BOTTOM))
})

const secondaryGroups = computed(() => groupByUnit(secondary.value))

const secondaryPlots = computed<Drawn[]>(() => {
  const out: Drawn[] = []
  for (const group of secondaryGroups.value.values()) {
    const range = yRange(group)
    if (!range) continue
    for (const s of group) out.push(drawSeries(s, range, SEC_TOP, SEC_BOTTOM))
  }
  return out
})

/** Min and max labels for the secondary panel, when it holds a single unit. */
const secondaryLabels = computed(() => {
  if (secondaryGroups.value.size !== 1) return null
  const [unit, group] = [...secondaryGroups.value.entries()][0]!
  const range = yRange(group)
  if (!range) return null
  return { min: formatValue(range.min, unit), max: formatValue(range.max, unit) }
})

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function fmtTick(ts: number, useMonthLabels: boolean): string {
  const d = new Date(ts)
  const month = MONTHS[d.getMonth()]
  if (useMonthLabels) return `${month} '${String(d.getFullYear()).slice(2)}`
  return `${month} ${d.getDate()}`
}

const ticks = computed(() => {
  const d = domain.value
  if (!d) return []
  const useMonthLabels = (d.max - d.min) / DAY > 250
  const count = useMonthLabels ? 5 : 3
  return Array.from({ length: count }, (_, k) => {
    const t = d.min + (k / (count - 1)) * (d.max - d.min)
    return {
      x: plotX(t, 0, 1, d, PADL, W - PADR),
      label: fmtTick(t, useMonthLabels),
      anchor: k === 0 ? 'start' : k === count - 1 ? 'end' : 'middle',
    }
  })
})
</script>
