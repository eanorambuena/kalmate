<template>
  <header role="banner" class="bg-[#111] border-b border-[#2a2a2a] px-4 py-2 flex items-center justify-between sticky top-0 z-50 backdrop-blur-xl bg-[#111]/95">
    <div class="flex items-center gap-4 md:gap-6">
      <NuxtLink to="/terminal" class="text-[#00c853] font-bold text-lg tracking-wider shrink-0" aria-label="Kalmate terminal home">
        KALMATE<span class="text-[#555]" aria-hidden="true">⌘</span>
      </NuxtLink>
      <div class="hidden md:block flex-1 max-w-md">
        <SearchBar />
      </div>
      <nav class="hidden md:flex gap-1 text-sm" aria-label="Main navigation">
        <NuxtLink
          v-for="link in navLinks" :key="link.to"
          :to="link.to"
          class="px-3 py-1.5 rounded-md text-[#888] hover:text-white hover:bg-white/5 transition-all duration-200 flex items-center gap-1.5"
          :class="{ 'text-white bg-white/5': isActive(link.to) }"
          :aria-current="isActive(link.to) ? 'page' : undefined"
        >
          {{ link.label }}
          <span class="text-[#555] text-[10px] font-mono" aria-hidden="true">[{{ link.key }}]</span>
        </NuxtLink>
      </nav>
    </div>
    <div class="flex items-center gap-3">
      <button
        class="md:hidden text-[#888] hover:text-white transition-colors p-1"
        @click="mobileOpen = !mobileOpen"
        :aria-label="mobileOpen ? 'Close menu' : 'Open menu'"
        :aria-expanded="mobileOpen"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path v-if="!mobileOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <a
        href="https://github.com/sponsors/eanorambuena"
        target="_blank"
        rel="noopener noreferrer"
        class="hidden md:inline-flex items-center gap-1 text-[10px] text-[#555] hover:text-[#ff69b4] transition-colors"
        aria-label="Sponsor Kalmate on GitHub"
      >
        <svg class="w-3 h-3" viewBox="0 0 16 16" fill="currentColor"><path d="m8 14.25-.345.666a.75.75 0 0 0 .69 0l-.345-.666Zm0 0 .345.666a.75.75 0 0 1-.69 0L8 14.25ZM4.268 2.47a3.72 3.72 0 0 0-3.31 1.34c-1.27 1.7-1 4.04.64 5.78l.02.02.02.02L8 14.25l6.37-4.62.02-.02.02-.02c1.64-1.74 1.91-4.08.64-5.78a3.72 3.72 0 0 0-3.31-1.34 4.9 4.9 0 0 0-3.3 1.73L8 4.69l-.44-.49a4.9 4.9 0 0 0-3.3-1.73h.02Z"/></svg>
        Sponsor
      </a>
      <span class="text-xs text-[#aaa] hidden md:block" aria-live="polite" aria-label="Live connection active">
        <span class="text-[#2979ff] animate-pulse" aria-hidden="true">●</span> LIVE
      </span>
    </div>
  </header>

  <!-- Mobile search -->
  <div class="md:hidden px-4 py-2 bg-[#111] border-b border-[#2a2a2a]">
    <SearchBar />
  </div>

  <!-- Mobile bottom nav -->
  <nav class="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#111]/95 backdrop-blur-xl border-t border-[#2a2a2a] flex justify-around py-1.5 safe-area-bottom" aria-label="Mobile navigation">
    <NuxtLink
      v-for="link in navLinks" :key="link.to"
      :to="link.to"
      class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-md transition-colors"
      :class="isActive(link.to) ? 'text-[#00c853]' : 'text-[#666] hover:text-[#aaa]'"
      :aria-current="isActive(link.to) ? 'page' : undefined"
    >
      <span class="text-lg" aria-hidden="true">{{ link.icon }}</span>
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
