<script setup lang="ts">
import { createChart, ColorType, CandlestickSeries, HistogramSeries } from 'lightweight-charts'
import type { CandlestickData, HistogramData } from 'lightweight-charts'

interface ChartData {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

const props = defineProps<{
  data: ChartData[]
}>()

const chartContainer = ref<HTMLDivElement | null>(null)
let chart: ReturnType<typeof createChart> | null = null

function isIntraday(data: ChartData[]): boolean {
  if (data.length < 2) return false
  const gaps = data.slice(1).map((d, i) => d.timestamp - data[i].timestamp)
  const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length
  return avgGap < 86400
}

function formatTime(ts: number, intraday: boolean): string {
  if (intraday) return ts as any
  const d = new Date(ts * 1000)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

function initChart() {
  if (!chartContainer.value || props.data.length === 0) return

  const intraday = isIntraday(props.data)

  chart = createChart(chartContainer.value, {
    layout: {
      background: { type: ColorType.Solid, color: '#0a0a0a' },
      textColor: '#888',
    },
    grid: {
      vertLines: { color: '#1a1a1a' },
      horzLines: { color: '#1a1a1a' },
    },
    width: chartContainer.value.clientWidth,
    height: 400,
    crosshair: { mode: 0 },
    timeScale: {
      borderColor: '#2a2a2a',
      timeVisible: intraday,
      secondsVisible: intraday,
    },
    rightPriceScale: {
      borderColor: '#2a2a2a',
    },
  })

  const candleSeries = chart.addSeries(CandlestickSeries, {
    upColor: '#00c853',
    downColor: '#ff1744',
    borderDownColor: '#ff1744',
    borderUpColor: '#00c853',
    wickDownColor: '#ff1744',
    wickUpColor: '#00c853',
  })

  const volumeSeries = chart.addSeries(HistogramSeries, {
    color: '#2979ff44',
    priceFormat: { type: 'volume' },
    priceScaleId: 'volume',
  })

  chart.priceScale('volume').applyOptions({
    scaleMargins: { top: 0.85, bottom: 0 },
  })

  const candleData: CandlestickData[] = props.data.map(d => ({
    time: formatTime(d.timestamp, intraday) as any,
    open: d.open,
    high: d.high,
    low: d.low,
    close: d.close,
  }))

  const volumeData: HistogramData[] = props.data.map(d => ({
    time: formatTime(d.timestamp, intraday) as any,
    value: d.volume,
    color: d.close >= d.open ? '#00c85344' : '#ff174444',
  }))

  candleSeries.setData(candleData)
  volumeSeries.setData(volumeData)
}

onMounted(() => {
  nextTick(initChart)
})

watch(() => props.data, () => {
  if (chart) {
    chart.remove()
    chart = null
  }
  nextTick(initChart)
})

onUnmounted(() => {
  if (chart) {
    chart.remove()
    chart = null
  }
})

const handleResize = () => {
  if (chart && chartContainer.value) {
    chart.applyOptions({ width: chartContainer.value.clientWidth })
  }
}

onMounted(() => window.addEventListener('resize', handleResize))
onUnmounted(() => window.removeEventListener('resize', handleResize))
</script>

<template>
  <div ref="chartContainer" class="w-full" role="img" aria-label="Stock price chart showing candlestick data with volume histogram" />
</template>
