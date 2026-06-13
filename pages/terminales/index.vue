<script setup lang="ts">
import { ALL_MARKETS } from '../../utils/constants'

const categories = Object.entries(ALL_MARKETS).map(([title, symbols]) => ({
  title,
  symbols,
}))
</script>

<template>
  <div class="mb-6">
    <MarketOverview />
  </div>
  <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
    <div v-for="cat in categories" :key="cat.title">
      <MarketCategoryTable :title="cat.title" :symbols="cat.symbols" />
    </div>
  </div>
  <div class="mt-4">
    <NewsFeed />
  </div>
</template>
