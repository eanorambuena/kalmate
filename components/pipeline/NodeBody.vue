<template>
  <div class="bg-[#1a1a1a] border border-[#333] rounded-xl p-3 min-h-[100px]" :style="{ borderLeftColor: color, borderLeftWidth: '3px' }">
    <div class="text-[10px] font-bold mb-2" :style="{ color }">{{ label }}</div>
    <div v-for="(val, key) in displayData" :key="key" class="flex justify-between text-[9px] leading-relaxed">
      <span class="text-[#bbb]">{{ key }}:</span>
      <span class="text-white font-mono text-right max-w-[60%] truncate">{{ formatVal(val) }}</span>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  label: { type: String, default: '' },
  color: { type: String, default: '#888' },
  data: { type: Object, default: () => ({}) },
})

const skipKeys = ['label', 'pro', 'type', 'defaultData']

const displayData = computed(() => {
  const d = {}
  for (const [k, v] of Object.entries(props.data)) {
    if (!skipKeys.includes(k) && v !== undefined && v !== null) d[k] = v
  }
  return d
})

function formatVal(v) {
  if (v === null || v === undefined) return '-'
  if (typeof v === 'number') return v.toFixed(2)
  if (Array.isArray(v)) {
    const nums = v.filter(x => typeof x === 'number')
    if (nums.length > 1) {
      const min = Math.min(...nums).toFixed(2)
      const max = Math.max(...nums).toFixed(2)
      const last = nums[nums.length - 1].toFixed(2)
      const change = ((nums[nums.length - 1] - nums[0]) / nums[0] * 100).toFixed(1)
      return `${nums.length}pts · $${min}-$${max} · ${change}%`
    }
    return `[${v.length}]`
  }
  return String(v)
}
</script>
