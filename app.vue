<template>
  <NuxtLayout>
    <NuxtPage :key="route.path" />
  </NuxtLayout>
</template>

<script setup lang="ts">
const route = useRoute()

watch(() => route.path, () => {
  if (import.meta.client) window.scrollTo(0, 0)
})
</script>
