import { computed, ref, watch } from 'vue'

const STORAGE_KEY = 'kalmate-currency'

function detectCurrency(): 'CLP' | 'USD' {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (tz.includes('Santiago') || tz.includes('Chile')) return 'CLP'
  } catch {}
  return 'USD'
}

const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
const currency = ref<'CLP' | 'USD'>(saved === 'CLP' || saved === 'USD' ? saved : detectCurrency())

watch(currency, (c) => {
  if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, c)
})

export function useCurrency() {
  function formatPrice(value: number | undefined | null, decimals?: number): string {
    if (value == null || isNaN(value)) return '-'
    const d = decimals ?? (currency.value === 'CLP' ? 0 : 2)
    if (currency.value === 'CLP') {
      return '$' + value.toLocaleString('es-CL', { minimumFractionDigits: d, maximumFractionDigits: d })
    }
    return '$' + value.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
  }

  function formatChange(value: number | undefined | null): string {
    if (value == null || isNaN(value)) return '-'
    const sign = value >= 0 ? '+' : ''
    return sign + formatPrice(Math.abs(value)).replace('$', '')
  }

  function formatChangePercent(value: number | undefined | null): string {
    if (value == null || isNaN(value)) return '-'
    const sign = value >= 0 ? '+' : ''
    return sign + value.toFixed(2) + '%'
  }

  function toggleCurrency() {
    currency.value = currency.value === 'CLP' ? 'USD' : 'CLP'
  }

  const currencyLabel = computed(() => currency.value === 'CLP' ? 'CLP' : 'USD')

  return { currency, currencyLabel, formatPrice, formatChange, formatChangePercent, toggleCurrency }
}
