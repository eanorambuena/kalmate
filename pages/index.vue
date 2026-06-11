<script setup lang="ts">
import { ALL_MARKETS } from '../utils/constants'

const categories = Object.entries(ALL_MARKETS).map(([title, symbols]) => ({
  title,
  symbols,
}))
</script>

<template>
  <div class="min-h-screen bg-[#0a0a0a]">
    <Header />
    <main class="max-w-7xl mx-auto px-4 py-4">
      <div class="mb-4">
        <SearchBar />
      </div>
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
    </main>
  </div>
</template>
