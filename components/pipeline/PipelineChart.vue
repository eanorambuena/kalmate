<template>
  <div class="flex flex-col gap-1.5">
    <div class="flex items-center gap-1 flex-wrap">
      <div class="flex items-center gap-0.5 bg-[#161616] rounded-md p-0.5" role="group" aria-label="Range">
        <button
          v-for="h in HORIZONS"
          :key="h"
          type="button"
          class="nodrag px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors"
          :class="h === horizon ? 'bg-[#2a2a2a] text-white' : 'text-[#888] hover:text-white'"
          :aria-pressed="h === horizon"
          @click="setHorizon(h)"
        >{{ h === 'ALL' ? 'All' : h }}</button>
      </div>
      <div class="flex-1" />
      <button
        type="button"
        class="nodrag px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors"
        :class="logScale ? 'bg-[#2a2a2a] text-white' : 'text-[#888] hover:text-white'"
        title="Logarithmic price scale"
        :aria-pressed="logScale"
        @click="logScale = !logScale"
      >Log</button>
      <button
        type="button"
        class="nodrag px-1.5 py-0.5 rounded text-[10px] font-medium text-[#888] hover:text-white"
        title="Fit all data"
        @click="fitAll"
      >Fit</button>
      <slot name="actions" />
    </div>

    <div class="relative flex-none" :style="{ height }">
      <div
        ref="container"
        class="nodrag nowheel nopan absolute inset-0 rounded-md overflow-hidden"
        role="img"
        :aria-label="ariaLabel"
      />
      <div class="pointer-events-none absolute top-1 left-1.5 z-10 flex flex-col gap-0.5 text-[10px] leading-tight max-w-[75%]">
        <span v-if="legend.date" class="text-[#888] font-mono">{{ legend.date }}</span>
        <span v-if="legend.ohlc" class="font-mono text-[#ccc]">{{ legend.ohlc }}</span>
        <span v-for="row in legend.rows" :key="row.key" class="flex items-center gap-1 min-w-0">
          <span class="w-2 h-0.5 rounded-sm flex-shrink-0" :style="{ backgroundColor: row.color }" />
          <span class="text-[#aaa] truncate">{{ row.label }}</span>
          <span class="font-mono text-white">{{ row.value }}</span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue'
import {
  createChart, ColorType, CrosshairMode, LineSeries, CandlestickSeries, LineStyle, PriceScaleMode,
  type IChartApi, type ISeriesApi, type SeriesType, type UTCTimestamp, type MouseEventParams,
} from 'lightweight-charts'
import { formatValue } from '../../utils/pipeline/values'
import {
  HORIZONS, toLineData, toBandData, toCandleData, assignPanes, visibleFrom, legendAt,
  type SeriesPoint, type LinePoint, type CandlePoint,
} from '../../utils/lw-chart'

export interface ChartLine {
  key: string
  label: string
  unit?: string
  color: string
  points: SeriesPoint[]
}

const props = withDefaults(defineProps<{
  lines: ChartLine[]
  candles?: { timestamp: number; open: number; high: number; low: number; close: number }[] | null
  height?: string
  initialHorizon?: string
  ariaLabel?: string
}>(), { candles: null, height: '220px', initialHorizon: '1Y', ariaLabel: 'Chart' })

const container = ref<HTMLDivElement>()
const horizon = ref<string>(props.initialHorizon)
const logScale = ref(false)

let chart: IChartApi | null = null
let lastTime = 0
let drawn: { line: ChartLine; data: LinePoint[] }[] = []
let candleData: CandlePoint[] = []

type LegendRow = { key: string; label: string; color: string; value: string }
const legend = ref<{ date: string; ohlc: string; rows: LegendRow[] }>({ date: '', ohlc: '', rows: [] })

function fmtDate(t: number): string {
  return new Date(t * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })
}

function updateLegend(time: number | null) {
  const rows = drawn.map(({ line, data }) => ({
    key: line.key, label: line.label, color: line.color,
    value: formatValue(legendAt(data, time), line.unit ?? 'price'),
  }))
  let ohlc = ''
  if (candleData.length) {
    const idx = time == null ? candleData.length - 1 : lastIndexAtOrBefore(candleData, time)
    const c = idx >= 0 ? candleData[idx] : undefined
    if (c) ohlc = `O ${formatValue(c.open, 'price')}  H ${formatValue(c.high, 'price')}  L ${formatValue(c.low, 'price')}  C ${formatValue(c.close, 'price')}`
  }
  // Only date the legend while hovering: at rest the lines end on different days (a forecast runs ahead).
  legend.value = { date: time != null ? fmtDate(time) : '', ohlc, rows }
}

function lastIndexAtOrBefore(data: { time: number }[], time: number): number {
  let lo = 0, hi = data.length - 1, found = -1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (data[mid]!.time <= time) { found = mid; lo = mid + 1 } else hi = mid - 1
  }
  return found
}

function onCrosshair(param: MouseEventParams) {
  updateLegend(typeof param.time === 'number' ? param.time : null)
}

function priceFormat(unit: string) {
  return { type: 'custom' as const, minMove: 0.0001, formatter: (v: number) => formatValue(v, unit) }
}

function build() {
  destroy()
  const el = container.value
  if (!el) return
  chart = createChart(el, {
    autoSize: true,
    layout: {
      background: { type: ColorType.Solid, color: '#0c0c0c' },
      textColor: '#8a8a8a',
      fontSize: 10,
      attributionLogo: false,
      panes: { separatorColor: '#262626', enableResize: true },
    },
    grid: { vertLines: { color: '#171717' }, horzLines: { color: '#171717' } },
    crosshair: { mode: CrosshairMode.Normal },
    rightPriceScale: { borderColor: '#262626', mode: logScale.value ? PriceScaleMode.Logarithmic : PriceScaleMode.Normal },
    timeScale: { borderColor: '#262626', rightOffset: 3, fixLeftEdge: true },
    handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
    handleScale: { mouseWheel: true, pinch: true, axisPressedMouseMove: true },
  })

  drawn = []
  candleData = toCandleData(props.candles ?? [])
  if (candleData.length) {
    const s = chart.addSeries(CandlestickSeries, {
      upColor: '#00c853', downColor: '#ff1744', borderUpColor: '#00c853', borderDownColor: '#ff1744',
      wickUpColor: '#00c853', wickDownColor: '#ff1744', priceFormat: priceFormat('price'),
    })
    s.setData(candleData.map(c => ({ ...c, time: c.time as UTCTimestamp })))
  }

  // With candles on pane 0, the lines are laid out as if a price series came first.
  const units = props.lines.map(l => ({ unit: l.unit ?? 'price' }))
  const panes = assignPanes(candleData.length ? [{ unit: 'price' }, ...units] : units)
  const linePanes = candleData.length ? panes.slice(1) : panes

  props.lines.forEach((line, i) => {
    const data = toLineData(line.points)
    if (!data.length || !chart) return
    const pane = linePanes[i] ?? 0
    const unit = line.unit ?? 'price'
    const series: ISeriesApi<SeriesType> = chart.addSeries(LineSeries, {
      color: line.color, lineWidth: 2, priceFormat: priceFormat(unit),
      priceLineVisible: false, lastValueVisible: true, crosshairMarkerRadius: 3,
    }, pane)
    series.setData(data.map(d => ({ time: d.time as UTCTimestamp, value: d.value })))
    const band = toBandData(line.points)
    for (const edge of [band.upper, band.lower]) {
      if (!edge.length) continue
      const b = chart.addSeries(LineSeries, {
        color: line.color + '99', lineWidth: 1, lineStyle: LineStyle.Dashed, priceFormat: priceFormat(unit),
        priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false,
      }, pane)
      b.setData(edge.map(d => ({ time: d.time as UTCTimestamp, value: d.value })))
    }
    drawn.push({ line, data })
  })

  // Secondary panes take a quarter of the height each, at most half in total.
  const all = chart.panes()
  if (all.length > 1) {
    const total = el.clientHeight || 220
    const each = Math.max(50, Math.floor(Math.min(total * 0.25, (total * 0.5) / (all.length - 1))))
    all.slice(1).forEach(p => p.setHeight(each))
  }

  const times = [...drawn.flatMap(d => d.data.map(p => p.time)), ...candleData.map(c => c.time)]
  lastTime = times.length ? Math.max(...times) : 0
  chart.subscribeCrosshairMove(onCrosshair)
  applyHorizon()
  updateLegend(null)
}

function applyHorizon() {
  if (!chart || !lastTime) return
  const from = visibleFrom(horizon.value, lastTime)
  const first = Math.min(...drawn.map(d => d.data[0]?.time ?? Infinity), candleData[0]?.time ?? Infinity)
  if (from == null || from <= first) chart.timeScale().fitContent()
  else chart.timeScale().setVisibleRange({ from: from as UTCTimestamp, to: lastTime as UTCTimestamp })
}

function setHorizon(h: string) {
  horizon.value = h
  applyHorizon()
}

function fitAll() {
  horizon.value = 'ALL'
  chart?.timeScale().fitContent()
  chart?.priceScale('right').applyOptions({ autoScale: true })
}

function destroy() {
  if (chart) {
    chart.unsubscribeCrosshairMove(onCrosshair)
    chart.remove()
    chart = null
  }
}

watch(logScale, v => {
  chart?.panes().forEach((_, i) => {
    if (i === 0) chart?.priceScale('right', 0).applyOptions({ mode: v ? PriceScaleMode.Logarithmic : PriceScaleMode.Normal })
  })
})
watch(() => [props.lines, props.candles], () => nextTick(build), { deep: false })

onMounted(() => nextTick(build))
onBeforeUnmount(destroy)
</script>
