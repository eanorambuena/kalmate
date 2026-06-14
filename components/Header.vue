<template>
  <header class="bg-[#111] border-b border-[#2a2a2a] px-4 py-2 flex items-center justify-between sticky top-0 z-50 backdrop-blur-xl bg-[#111]/95">
    <div class="flex items-center gap-4 md:gap-6">
      <NuxtLink to="/terminal" class="text-[#00c853] font-bold text-lg tracking-wider shrink-0">
        KALMATE<span class="text-[#555]">⌘</span>
      </NuxtLink>
      <div class="hidden md:block flex-1 max-w-md">
        <SearchBar />
      </div>
      <nav class="hidden md:flex gap-1 text-sm">
        <NuxtLink
          v-for="link in navLinks" :key="link.to"
          :to="link.to"
          class="px-3 py-1.5 rounded-md text-[#888] hover:text-white hover:bg-white/5 transition-all duration-200 flex items-center gap-1.5"
          :class="{ 'text-white bg-white/5': isActive(link.to) }"
        >
          {{ link.label }}
          <span class="text-[#555] text-[10px] font-mono">[{{ link.key }}]</span>
        </NuxtLink>
      </nav>
    </div>
    <div class="flex items-center gap-3">
      <button
        class="md:hidden text-[#888] hover:text-white transition-colors p-1"
        @click="mobileOpen = !mobileOpen"
        aria-label="Toggle menu"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path v-if="!mobileOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <span class="text-xs text-[#aaa] hidden md:block">
        <span class="text-[#2979ff] animate-pulse">●</span> LIVE
      </span>
    </div>
  </header>

  <!-- Mobile search -->
  <div class="md:hidden px-4 py-2 bg-[#111] border-b border-[#2a2a2a]">
    <SearchBar />
  </div>

  <!-- Mobile bottom nav -->
  <nav class="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#111]/95 backdrop-blur-xl border-t border-[#2a2a2a] flex justify-around py-1.5 safe-area-bottom">
    <NuxtLink
      v-for="link in navLinks" :key="link.to"
      :to="link.to"
      class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-md transition-colors"
      :class="isActive(link.to) ? 'text-[#00c853]' : 'text-[#666] hover:text-[#aaa]'"
    >
      <span class="text-lg">{{ link.icon }}</span>
      <span class="text-[10px] font-medium">{{ link.label }}</span>
    </NuxtLink>
  </nav>

  <!-- Mobile slide-out -->
  <Transition name="fade">
    <div
      v-if="mobileOpen"
      class="fixed inset-0 z-40 md:hidden"
      @click="mobileOpen = false"
    >
      <div class="absolute inset-0 bg-black/60" />
      <div class="absolute right-0 top-0 bottom-0 w-64 bg-[#111] border-l border-[#2a2a2a] p-6" @click.stop>
        <div class="flex flex-col gap-2 mt-8">
          <NuxtLink
            v-for="link in navLinks" :key="link.to"
            :to="link.to"
            class="px-4 py-3 rounded-lg text-[#888] hover:bg-white/5 hover:text-white transition-colors flex items-center gap-3"
            :class="{ 'text-white bg-white/5': isActive(link.to) }"
            @click="mobileOpen = false"
          >
            <span class="text-lg">{{ link.icon }}</span>
            <span class="font-medium">{{ link.label }}</span>
            <span class="text-[#555] text-xs font-mono ml-auto">[{{ link.key }}]</span>
          </NuxtLink>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const route = useRoute()
const mobileOpen = ref(false)

const navLinks = [
  { to: '/terminal', label: 'MARKET', key: '1', icon: '📊' },
  { to: '/terminal/portfolio', label: 'PORTFOLIO', key: '2', icon: '💼' },
  { to: '/terminal/screener', label: 'SCREENER', key: '4', icon: '🔍' },
  { to: '/terminal/alerts', label: 'ALERTS', key: '3', icon: '🔔' },
]

function isActive(to: string) {
  return route.path === to || route.path.startsWith(to + '/')
}
</script>

<style scoped>
.safe-area-bottom {
  padding-bottom: max(0.375rem, env(safe-area-inset-bottom, 0px));
}
</style>
