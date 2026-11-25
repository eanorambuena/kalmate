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

    <div v-if="candles.length > 0" class="flex flex-wrap gap-x-2.5 gap-y-1 mb-2 text-[9px] min-w-0" aria-label="Legend">
      <span class="flex items-center gap-1">
        <span class="font-mono" :style="{ color: lastUp ? UP : DOWN }">Close {{ lastClose }}</span>
        <span class="text-[#666]">· {{ candles.length }} candles</span>
      </span>
      <span v-for="o in overlays" :key="o.key" class="flex items-center gap-1 min-w-0">
        <span class="w-2 h-0.5 rounded flex-shrink-0" :style="{ backgroundColor: o.color }" />
        <span class="text-[#bbb] truncate max-w-[110px]" :title="o.label">{{ o.label }}</span>
        <span class="font-mono text-white">{{ o.last == null ? '—' : formatValue(o.last, o.unit) }}</span>
      </span>
    </div>

    <svg
      v-if="candles.length > 0 && range"
      :viewBox="`0 0 ${W} ${H}`"
      class="w-full h-auto block"
      role="img"
      :aria-label="`${displayLabel}: ${candles.length} candles`"
    >
      <line :x1="PADL" :y1="BOTTOM" :x2="W - PADR" :y2="BOTTOM" stroke="#333" stroke-width="1" />
      <text :x="PADL - 3" :y="TOP + 4" fill="#888" font-size="6.5" text-anchor="end" font-family="monospace">{{ formatValue(range.max, 'price') }}</text>
      <text :x="PADL - 3" :y="BOTTOM" fill="#888" font-size="6.5" text-anchor="end" font-family="monospace">{{ formatValue(range.min, 'price') }}</text>

      <g v-for="(c, i) in items" :key="i">
        <line :x1="c.x" :y1="c.yH" :x2="c.x" :y2="c.yL" :stroke="c.color" stroke-width="1" />
        <rect :x="c.x - c.w / 2" :y="c.bodyTop" :width="c.w" :height="c.bodyH" :fill="c.color" />
      </g>

      <polyline
        v-for="o in overlayPaths"
        :key="'ov-' + o.key"
        :points="o.points"
        fill="none"
        :stroke="o.color"
        stroke-width="1.5"
        stroke-linejoin="round"
        vector-effect="non-scaling-stroke"
      />

      <g v-for="(t, idx) in axisLabels" :key="'ax' + idx">
        <line :x1="t.x" :y1="BOTTOM" :x2="t.x" :y2="BOTTOM + 3" stroke="#444" stroke-width="1" />
        <text :x="t.x" :y="BOTTOM + 12" fill="#888" font-size="6.5" :text-anchor="t.anchor" font-family="monospace">{{ t.label }}</text>
      </g>
    </svg>
    <div v-else class="h-[120px] flex items-center justify-center text-center text-[#aaa] text-[10px] px-2">
      {{ result?.error || 'Run pipeline to see candles' }}
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
import { yRange, valueToY, nearestIndex, medianGap, type ValueRange } from '../../../utils/chart-scale'

const props = defineProps({
  id: { type: String, required: true },
  data: { type: Object, default: () => ({}) },
})

const { removeNodes } = useVueFlow()

const def = nodeDefinitions.find(n => n.type === 'candleChart')
const inputs = def?.inputs ?? []

const result = computed<any>(() => props.data?.result)
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
const TOP = 6
const BOTTOM = 110
const H = BOTTOM + 16
const MAX_CANDLES = 60
const DAY = 86_400_000
const UP = '#00c853'
const DOWN = '#ff1744'
const OVERLAY_COLORS = ['#2979ff', '#aa00ff', '#ff6d00']

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

type Candle = { timestamp: number; open: number; high: number; low: number; close: number }

/** The most recent candles, ordered by time, with all four prices present. */
const candles = computed<Candle[]>(() => {
  const raw = result.value?.candleSeries
  if (!Array.isArray(raw)) return []
  return raw
    .filter((c: any) => [c?.open, c?.high, c?.low, c?.close].every(v => Number.isFinite(v) && v > 0))
    .slice(-MAX_CANDLES)
})

const timestamps = computed(() => candles.value.map(c => c.timestamp))
const gap = computed(() => medianGap(timestamps.value) || DAY)
const candleW = computed(() => (candles.value.length ? (W - PADL - PADR) / candles.value.length : 0))
const candleX = (i: number) => PADL + (i + 0.5) * candleW.value

const lastCandle = computed(() => candles.value[candles.value.length - 1])
const lastClose = computed(() => (lastCandle.value ? formatValue(lastCandle.value.close, 'price') : '—'))
const lastUp = computed(() => !!lastCandle.value && lastCandle.value.close >= lastCandle.value.open)

type Overlay = { key: string; label: string; unit: string; color: string; last: number | null; values: { idx: number; value: number }[] }

/**
 * Overlays placed by timestamp: each point goes to the candle closest in
 * time, and is dropped when no candle is within one bar of it (for example
 * forecast points after the last candle).
 */
const overlays = computed<Overlay[]>(() => {
  const raw = Array.isArray(result.value?.overlays) ? result.value.overlays : []
  const ts = timestamps.value
  if (ts.length === 0) return []
  const out: Overlay[] = []
  raw.forEach((o: any, k: number) => {
    const byIdx = new Map<number, number>()
    for (const p of Array.isArray(o?.points) ? o.points : []) {
      if (!Number.isFinite(p?.value)) continue
      const idx = nearestIndex(ts, p.timestamp)
      if (idx < 0 || Math.abs(ts[idx]! - p.timestamp) > gap.value) continue
      byIdx.set(idx, p.value)
    }
    const values = [...byIdx.entries()].sort((a, b) => a[0] - b[0]).map(([idx, value]) => ({ idx, value }))
    if (values.length === 0) return
    out.push({
      key: String(o.handle ?? k),
      label: String(o.label ?? o.handle ?? `Overlay ${k + 1}`),
      unit: o.unit ?? 'price',
      color: OVERLAY_COLORS[k % OVERLAY_COLORS.length]!,
      last: values[values.length - 1]!.value,
      values,
    })
  })
  return out
})

const range = computed<ValueRange | null>(() => {
  if (candles.value.length === 0) return null
  const pts = candles.value.flatMap(c => [
    { timestamp: c.timestamp, value: c.low },
    { timestamp: c.timestamp, value: c.high },
  ])
  for (const o of overlays.value) for (const v of o.values) pts.push({ timestamp: 0, value: v.value })
  return yRange([{ points: pts }])
})

/** Polyline points for each overlay, on the same scale as the candles. */
const overlayPaths = computed(() => {
  const r = range.value
  if (!r) return []
  return overlays.value.map(o => ({
    key: o.key,
    color: o.color,
    points: o.values
      .map(v => `${candleX(v.idx).toFixed(1)},${valueToY(v.value, r, TOP, BOTTOM).toFixed(1)}`)
      .join(' '),
  }))
})

const items = computed(() => {
  const r = range.value
  if (!r) return []
  const cw = candleW.value
  return candles.value.map((c, i) => {
    const yH = valueToY(c.high, r, TOP, BOTTOM)
    const yL = valueToY(c.low, r, TOP, BOTTOM)
    const yO = valueToY(c.open, r, TOP, BOTTOM)
    const yC = valueToY(c.close, r, TOP, BOTTOM)
    return {
      x: candleX(i),
      yH,
      yL,
      bodyTop: Math.min(yO, yC),
      bodyH: Math.max(Math.abs(yC - yO), 1),
      w: Math.max(cw * 0.6, 1),
      color: c.close >= c.open ? UP : DOWN,
    }
  })
})

const axisLabels = computed(() => {
  const all = candles.value
  if (all.length === 0) return []
  const first = all[0]!
  const last = all[all.length - 1]!
  const useMonthLabels = last.timestamp - first.timestamp > 250 * DAY
  const fmt = (ts: number) => {
    const d = new Date(ts)
    return useMonthLabels ? `${MONTHS[d.getMonth()]} '${String(d.getFullYear()).slice(2)}` : `${MONTHS[d.getMonth()]} ${d.getDate()}`
  }
  const mid = Math.floor((all.length - 1) / 2)
  const picks = [
    { i: 0, anchor: 'start' },
    { i: mid, anchor: 'middle' },
    { i: all.length - 1, anchor: 'end' },
  ].filter((p, k, arr) => arr.findIndex(q => q.i === p.i) === k)
  return picks.map(p => ({ x: candleX(p.i), label: fmt(all[p.i]!.timestamp), anchor: p.anchor }))
})
</script>
