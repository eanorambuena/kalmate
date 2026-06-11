<script setup lang="ts">
const { startPolling, isPolling } = useAlerts()
onMounted(() => startPolling(30000))
</script>

<template>
  <div class="text-xs text-[#aaa] mb-3 flex items-center gap-2">
    <span class="font-sans">ALERTS</span>
    <span class="text-[#555] text-[10px] flex items-center gap-1">
      <span :class="isPolling ? 'text-[#00c853]' : 'text-[#555]'" class="text-xs">●</span>
      {{ isPolling ? 'LIVE' : 'OFF' }}
    </span>
  </div>
  <AlertForm />
</template>
