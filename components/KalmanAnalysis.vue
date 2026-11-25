<script setup lang="ts">
import PipelineChart, { type ChartLine } from './pipeline/PipelineChart.vue'

interface KalmanData {
  symbol: string
  /** Unix seconds. */
  timestamps: number[]
  prices: number[]
  smoothed: number[]
  deviationPct: number | null
  position: 'above' | 'below' | null
  predicted: number[]
  lower: number[]
  upper: number[]
  lastPrice: number | null
  predictedPrice: number | null
  backtest: { skill: number; hitRate: number; coverage: number; n: number }
  error?: string
}

const STEPS = 15

const props = defineProps<{
  symbol: string
}>()

const { data, pending, error } = await useAsyncData(
  `kalman-${props.symbol}`,
  async () => {
    return await $fetch<KalmanData>(`/api/kalman?symbol=${encodeURIComponent(props.symbol)}&range=1y&predict=${STEPS}`)
  },
  { default: () => null as KalmanData | null }
)

/** Median spacing of the last points, so forecast steps land on trading days. */
function stepMs(ts: number[]): number {
  const gaps = ts.slice(-30).slice(1).map((t, i) => t - ts.slice(-30)[i]!).sort((a, b) => a - b)
  return (gaps[Math.floor(gaps.length / 2)] ?? 86_400) * 1000
}

const lines = computed<ChartLine[]>(() => {
  const d = data.value
  if (!d || d.error || !d.prices?.length) return []
  const ms = d.timestamps.map(t => t * 1000)
  const out: ChartLine[] = [
    { key: 'price', label: 'Price', unit: 'price', color: '#9e9e9e', points: d.prices.map((v, i) => ({ timestamp: ms[i]!, value: v })) },
    { key: 'trend', label: 'Kalman trend', unit: 'price', color: '#00c853', points: d.smoothed.map((v, i) => ({ timestamp: ms[i]!, value: v })) },
  ]
  if (d.predicted.length) {
    const last = ms[ms.length - 1]!
    const lastPrice = d.prices[d.prices.length - 1]!
    const step = stepMs(d.timestamps)
    out.push({
      key: 'forecast',
      label: 'Forecast (95% band)',
      unit: 'price',
      color: '#2979ff',
      points: [
        { timestamp: last, value: lastPrice, lower: lastPrice, upper: lastPrice },
        ...d.predicted.map((v, i) => ({ timestamp: last + (i + 1) * step, value: v, lower: d.lower[i], upper: d.upper[i] })),
      ],
    })
  }
  return out
})

function formatPrice(v: number | null | undefined): string {
  return v != null && Number.isFinite(v) ? '$' + v.toFixed(2) : '-'
}

function pct(v: number | null | undefined, digits = 1): string {
  return v != null && Number.isFinite(v) ? `${v > 0 ? '+' : ''}${(v * 100).toFixed(digits)}%` : '-'
}

const positionLabel = computed(() => {
  const p = data.value?.position
  return p === 'above' ? 'Above trend' : p === 'below' ? 'Below trend' : '-'
})

const skillText = computed(() => {
  const b = data.value?.backtest
  if (!b?.n) return 'Not enough history to validate the forecast'
  const verdict = b.skill > 0
    ? `beat "no change" by ${(b.skill * 100).toFixed(1)}%`
    : `did not beat "no change" (${(b.skill * 100).toFixed(1)}%)`
  return `Over ${b.n} past ${STEPS}-day forecasts the model ${verdict}; direction right ${(b.hitRate * 100).toFixed(0)}% of the time, ${(b.coverage * 100).toFixed(0)}% inside the band.`
})
</script>

<template>
  <div v-if="pending" class="bg-[#111] border border-[#2a2a2a] rounded-xl p-5">
    <div class="flex items-center gap-3 mb-4">
      <div class="w-32 h-4 bg-[#2a2a2a] rounded animate-pulse" />
      <div class="w-20 h-4 bg-[#2a2a2a] rounded animate-pulse" />
    </div>
    <div class="h-64 bg-[#2a2a2a] rounded animate-pulse" />
  </div>

  <div v-else-if="error || data?.error" class="bg-[#111] border border-[#2a2a2a] rounded-xl p-5 text-[#aaa] text-sm">
    {{ error?.message || data?.error || 'No data available' }}
  </div>

  <div v-else-if="data" class="bg-[#111] border border-[#2a2a2a] rounded-xl p-5">
    <div class="flex flex-wrap items-start justify-between gap-4 mb-4">
      <div>
        <h3 class="text-white font-bold text-base">Kalman Analysis</h3>
        <p class="text-[#aaa] text-xs font-mono">{{ symbol }} · Local-trend Kalman filter · validated forecast</p>
      </div>
      <div class="flex items-center gap-4 text-xs">
        <div class="text-center">
          <p class="text-[#aaa]">Price</p>
          <p class="text-white font-bold">{{ formatPrice(data.lastPrice) }}</p>
        </div>
        <div class="text-center">
          <p class="text-[#aaa]">Forecast ({{ STEPS }}d)</p>
          <p class="text-white font-bold">{{ formatPrice(data.predictedPrice) }}</p>
        </div>
        <div class="text-center">
          <p class="text-[#aaa]">Vs. trend</p>
          <p class="font-bold" :class="data.position === 'above' ? 'text-[#ffab40]' : 'text-[#40c4ff]'">
            {{ positionLabel }} <span class="font-mono font-normal">{{ pct(data.deviationPct) }}</span>
          </p>
        </div>
      </div>
    </div>

    <PipelineChart
      v-if="lines.length"
      :lines="lines"
      height="280px"
      initial-horizon="6M"
      :aria-label="`${symbol}: price, Kalman trend and forecast`"
    />

    <p class="mt-3 text-[11px] text-[#aaa]">{{ skillText }}</p>
    <p class="mt-1 text-[10px] text-[#666]">Descriptive analysis, not investment advice.</p>
  </div>
</template>
