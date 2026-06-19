<script setup lang="ts">
import type { ChileIndicator } from '~/utils/types'

const FORMAT_CONFIG: Record<string, { decimals: number; suffix?: string }> = {
  uf: { decimals: 0 },
  dolar: { decimals: 0 },
  euro: { decimals: 0 },
  utm: { decimals: 0 },
  ipc: { decimals: 1, suffix: '%' },
  tpm: { decimals: 1, suffix: '%' },
  libra_cobre: { decimals: 2, suffix: ' USD' },
  imacec: { decimals: 1, suffix: '%' },
  tasa_desempleo: { decimals: 2, suffix: '%' },
}

const ICONS: Record<string, string> = {
  uf: 'UF',
  dolar: '$',
  euro: '€',
  utm: 'UTM',
  ipc: 'IPC',
  tpm: 'TPM',
  libra_cobre: 'Cu',
  imacec: 'IM',
  tasa_desempleo: 'DE',
}

const { data, pending, error, refresh } = await useAsyncData<ChileIndicator[]>(
  'indicadores-chile',
  () => $fetch('/api/indicadores-chile'),
  { default: () => [] }
)

const indicators = computed(() => data.value || [])

function formatVal(ind: ChileIndicator): string {
  const cfg = FORMAT_CONFIG[ind.codigo] || { decimals: 2 }
  const val = ind.valor
  if (val == null || isNaN(val)) return '-'
  const fmt = val.toLocaleString('es-CL', {
    minimumFractionDigits: cfg.decimals,
    maximumFractionDigits: cfg.decimals,
  })
  return cfg.suffix ? `${fmt}${cfg.suffix}` : `$${fmt}`
}

function formatDate(fecha: string): string {
  try {
    const d = new Date(fecha)
    return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return fecha
  }
}

onMounted(() => {
  let interval: ReturnType<typeof setInterval>
  function start() { interval = setInterval(() => refresh(), 600000) }
  function stop() { clearInterval(interval) }
  start()
  function onVisibility() {
    if (document.hidden) stop()
    else { refresh(); start() }
  }
  document.addEventListener('visibilitychange', onVisibility)
  onUnmounted(() => {
    stop()
    document.removeEventListener('visibilitychange', onVisibility)
  })
})
</script>

<template>
  <div class="bg-[#111] border border-[#2a2a2a] rounded-xl p-3 card-hover">
    <div class="text-xs text-[#ccc] mb-3 tracking-wider font-sans flex items-center gap-2" aria-live="polite" :aria-label="$t('chileIndicators.heading')">
      <span>{{ $t('chileIndicators.heading') }}</span>
      <span v-if="pending" class="inline-block w-2 h-2 rounded-full bg-[#2979ff] animate-pulse" :aria-label="$t('chileIndicators.updatingLabel')" />
      <span class="text-[#666] text-[10px] ml-auto font-normal">{{ $t('chileIndicators.source') }}</span>
    </div>
    <div v-if="error" role="alert" class="text-[#ff1744] text-xs py-4 text-center">{{ $t('common.noData') }}</div>
    <div v-else-if="pending && indicators.length === 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3" :aria-label="$t('chileIndicators.loadingLabel')">
      <div v-for="i in 8" :key="i" class="rounded-lg p-3 bg-[#1a1a1a]">
        <div class="skeleton h-3 w-12 mb-2" />
        <div class="skeleton h-6 w-20 mb-1" />
        <div class="skeleton h-3 w-16" />
      </div>
    </div>
    <div v-else-if="indicators.length === 0" role="alert" class="text-[#888] text-xs py-4 text-center">
      {{ $t('chileIndicators.empty') }}
    </div>
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      <div
        v-for="ind in indicators"
        :key="ind.codigo"
        class="rounded-lg p-3 transition-all duration-200 hover:bg-[#1a1a1a] hover:scale-[1.02] active:scale-[0.98]"
      >
        <div class="flex items-center gap-2 mb-1">
          <span class="text-[10px] font-mono font-bold bg-[#0d47a1] text-white px-1.5 py-0.5 rounded">{{ ICONS[ind.codigo] || ind.codigo }}</span>
          <span class="text-xs text-[#bbb] font-sans font-medium truncate">{{ ind.nombre.replace(/\(.*?\)/, '').trim() }}</span>
        </div>
        <div class="text-lg font-mono font-bold mt-1 tracking-tight text-white">
          {{ formatVal(ind) }}
        </div>
        <div class="text-[10px] text-[#666] font-sans mt-0.5">
          {{ formatDate(ind.fecha) }}
        </div>
      </div>
    </div>
  </div>
</template>
