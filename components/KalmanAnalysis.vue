<script setup lang="ts">
interface KalmanData {
  symbol: string
  timestamps: number[]
  prices: number[]
  smoothed: number[]
  trend: number[]
  cycle: number[]
  predicted: number[]
  confidence: number[]
  lastPrice: number
  predictedPrice: number
  signal: string
  logLikelihood: number
  error?: string
}

const props = defineProps<{
  symbol: string
}>()

const { data, pending, error } = await useAsyncData(
  `kalman-${props.symbol}`,
  async () => {
    return await $fetch<KalmanData>(`/api/kalman?symbol=${props.symbol}&range=1y&predict=15`)
  },
  { default: () => null as KalmanData | null }
)

const chartData = computed(() => {
  if (!data.value) return null
  const d = data.value
  const labels = d.timestamps.map(t => new Date(t * 1000).toLocaleDateString())
  return { labels, ...d }
})

function formatPrice(v: number): string {
  return v ? '$' + v.toFixed(2) : '-'
}

function formatSignal(s: string): string {
  return s === 'overpriced' ? 'Sobrevalorado' : s === 'underpriced' ? 'Infravalorado' : '-'
}

function signalColor(s: string): string {
  return s === 'overpriced' ? '#ff4444' : s === 'underpriced' ? '#00c853' : '#888'
}
</script>

<template>
  <div v-if="pending" class="bg-[#111] border border-[#2a2a2a] rounded-xl p-5">
    <div class="flex items-center gap-3 mb-4">
      <div class="w-32 h-4 bg-[#2a2a2a] rounded animate-pulse" />
      <div class="w-20 h-4 bg-[#2a2a2a] rounded animate-pulse" />
    </div>
    <div class="h-64 bg-[#2a2a2a] rounded animate-pulse" />
  </div>

  <div v-else-if="error || data?.error" class="bg-[#111] border border-[#2a2a2a] rounded-xl p-5 text-[#888] text-sm">
    {{ error?.message || data?.error || 'No data available' }}
  </div>

  <div v-else-if="data" class="bg-[#111] border border-[#2a2a2a] rounded-xl p-5">
    <div class="flex items-center justify-between mb-5">
      <div>
        <h3 class="text-white font-bold text-base">Kalman Analysis</h3>
        <p class="text-[#555] text-xs font-mono">{{ symbol }} · Schwartz-Smith 2-Factor Model</p>
      </div>
      <div class="flex items-center gap-4 text-xs">
        <div class="text-center">
          <p class="text-[#555]">Price</p>
          <p class="text-white font-bold">{{ formatPrice(data.lastPrice) }}</p>
        </div>
        <div class="text-center">
          <p class="text-[#555]">Predicted</p>
          <p class="text-white font-bold">{{ formatPrice(data.predictedPrice) }}</p>
        </div>
        <div class="text-center">
          <p class="text-[#555]">Signal</p>
          <p class="font-bold" :style="{ color: signalColor(data.signal) }">{{ formatSignal(data.signal) }}</p>
        </div>
      </div>
    </div>

    <div class="relative h-64 mb-4">
      <svg class="w-full h-full" viewBox="0 0 700 240" preserveAspectRatio="none">
        <defs>
          <linearGradient id="confGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#2979ff" stop-opacity="0.15" />
            <stop offset="100%" stop-color="#2979ff" stop-opacity="0" />
          </linearGradient>
        </defs>

        <g v-if="chartData" transform="translate(0, 0)">
          <line x1="0" y1="240" x2="700" y2="240" stroke="#2a2a2a" stroke-width="1" />
          <line x1="0" y1="0" x2="0" y2="240" stroke="#2a2a2a" stroke-width="1" />

          <path
            :d="'M' + chartData.prices.map((v: number, i: number) => {
              const min = Math.min(...chartData.prices)
              const max = Math.max(...chartData.prices)
              const y = 240 - ((v - min) / (max - min || 1)) * 220 - 10
              const x = (i / (chartData.prices.length - 1 || 1)) * 680 + 10
              return x + ',' + y
            }).join(' L')"
            fill="none"
            stroke="#888"
            stroke-width="1"
            opacity="0.5"
          />

          <path
            :d="'M' + chartData.smoothed.map((v: number, i: number) => {
              const min = Math.min(...chartData.prices)
              const max = Math.max(...chartData.prices)
              const y = 240 - ((v - min) / (max - min || 1)) * 220 - 10
              const x = (i / (chartData.smoothed.length - 1 || 1)) * 680 + 10
              return x + ',' + y
            }).join(' L')"
            fill="none"
            stroke="#00c853"
            stroke-width="2"
          />

          <path
            v-if="chartData.predicted.length"
            :d="'M' + chartData.predicted.map((v: number, i: number) => {
              const all = [...chartData.prices, ...chartData.predicted]
              const min = Math.min(...all)
              const max = Math.max(...all)
              const y = 240 - ((v - min) / (max - min || 1)) * 220 - 10
              const x = ((chartData.prices.length - 1 + i) / (chartData.prices.length + chartData.predicted.length - 1)) * 680 + 10
              return x + ',' + y
            }).join(' L')"
            fill="none"
            stroke="#2979ff"
            stroke-width="2"
            stroke-dasharray="6,3"
          />

          <path
            v-if="chartData.confidence.length"
            :d="'M' + chartData.predicted.map((v: number, i: number) => {
              const all = [...chartData.prices, ...chartData.predicted]
              const min2 = Math.min(...all)
              const max2 = Math.max(...all)
              const upper = v + chartData.confidence[i]
              const y = 240 - ((upper - min2) / (max2 - min2 || 1)) * 220 - 10
              const x = ((chartData.prices.length - 1 + i) / (chartData.prices.length + chartData.predicted.length - 1)) * 680 + 10
              return x + ',' + y
            }).join(' L')
            + ' L' + chartData.predicted.map((v: number, i: number) => {
              const all = [...chartData.prices, ...chartData.predicted]
              const min2 = Math.min(...all)
              const max2 = Math.max(...all)
              const lower = Math.max(0.01, v - chartData.confidence[i])
              const y = 240 - ((lower - min2) / (max2 - min2 || 1)) * 220 - 10
              const x = ((chartData.prices.length - 1 + i) / (chartData.prices.length + chartData.predicted.length - 1)) * 680 + 10
              return x + ',' + y
            }).join(' L') + ' Z'"
            fill="url(#confGrad)"
            stroke="none"
          />
        </g>
      </svg>
      <div class="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-[#555] px-2">
        <span>{{ chartData?.labels?.[0] || '' }}</span>
        <span>{{ chartData?.labels?.[chartData.labels.length - 1] || '' }}</span>
      </div>
    </div>

    <div class="flex items-center justify-between text-xs text-[#555]">
      <div class="flex items-center gap-4">
        <span class="flex items-center gap-1.5">
          <span class="w-3 h-0.5 bg-[#888] opacity-50 inline-block" /> Price
        </span>
        <span class="flex items-center gap-1.5">
          <span class="w-3 h-0.5 bg-[#00c853] inline-block" /> Smoothed
        </span>
        <span class="flex items-center gap-1.5">
          <span class="w-3 h-0.5 bg-[#2979ff] dashed inline-block" style="border-top: 1px dashed #2979ff; height: 0; background: none;" /> Predicted
        </span>
      </div>
      <div class="flex items-center gap-3">
        <span>Cycle: <span :style="{ color: signalColor(data.signal) }">{{ (data.cycle[data.cycle.length - 1] * 100).toFixed(1) }}%</span></span>
        <span>LogLik: {{ data.logLikelihood.toFixed(0) }}</span>
      </div>
    </div>
  </div>
</template>
