<template>
  <div class="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 min-h-[120px]" :style="{ borderLeftColor: color, borderLeftWidth: '3px' }">
    <div class="text-xs font-bold mb-2" :style="{ color }">{{ label }}</div>
    <div class="space-y-1.5">
      <div v-for="(val, key) in displayData" :key="key" class="flex justify-between text-[10px]">
        <span class="text-[#666]">{{ key }}:</span>
        <span class="text-white font-mono">{{ formatVal(val) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  label: { type: String, default: '' },
  color: { type: String, default: '#888' },
  data: { type: Object, default: () => ({}) },
})

const displayData = computed(() => {
  const d = { ...props.data }
  delete d.label
  return d
})

function formatVal(v) {
  if (v === null || v === undefined) return '-'
  if (typeof v === 'number') return v.toFixed(2)
  if (Array.isArray(v)) return `[${v.length} pts]`
  return String(v)
}
</script>
