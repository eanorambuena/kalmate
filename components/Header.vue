<template>
  <header role="banner" class="bg-[#111] border-b border-[#2a2a2a] px-4 py-2 flex items-center justify-between sticky top-0 z-50 backdrop-blur-xl bg-[#111]/95">
    <div class="flex items-center gap-4 md:gap-6">
      <NuxtLink to="/" class="text-[#00c853] font-bold text-lg tracking-wider shrink-0" :aria-label="$t('header.homeLabel')">
        {{ $t('header.brand') }}<span class="text-[#ccc]" aria-hidden="true">⌘</span>
      </NuxtLink>
      <div class="hidden md:block flex-1 max-w-md">
        <SearchBar />
      </div>
      <nav class="hidden md:flex gap-1 text-sm" :aria-label="$t('header.navMain')">
        <NuxtLink
          v-for="link in navLinks" :key="link.to"
          :to="link.to"
          class="px-3 py-1.5 rounded-md text-[#ccc] hover:text-white hover:bg-white/5 transition-all duration-200 flex items-center gap-1.5"
          :class="{ 'text-white bg-white/5': isActive(link.to) }"
          :aria-current="isActive(link.to) ? 'page' : undefined"
        >
          {{ $t(link.labelKey) }}
        </NuxtLink>
      </nav>
    </div>
    <div class="flex items-center gap-3">
      <button
        class="md:hidden text-[#ccc] hover:text-white transition-colors p-1"
        @click="mobileOpen = !mobileOpen"
        :aria-label="mobileOpen ? $t('header.closeMenu') : $t('header.openMenu')"
        :aria-expanded="mobileOpen"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path v-if="!mobileOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <a
        v-if="monetization.githubSponsors.enabled"
        :href="monetization.githubSponsors.url"
        target="_blank"
        rel="noopener noreferrer"
        class="hidden md:inline-flex items-center gap-1 text-[10px] text-[#ccc] hover:text-[#ff69b4] transition-colors"
        :aria-label="$t('header.sponsorLabel')"
      >
        <svg class="w-3 h-3" viewBox="0 0 16 16" fill="currentColor"><path d="m8 14.25-.345.666a.75.75 0 0 0 .69 0l-.345-.666Zm0 0 .345.666a.75.75 0 0 1-.69 0L8 14.25ZM4.268 2.47a3.72 3.72 0 0 0-3.31 1.34c-1.27 1.7-1 4.04.64 5.78l.02.02.02.02L8 14.25l6.37-4.62.02-.02.02-.02c1.64-1.74 1.91-4.08.64-5.78a3.72 3.72 0 0 0-3.31-1.34 4.9 4.9 0 0 0-3.3 1.73L8 4.69l-.44-.49a4.9 4.9 0 0 0-3.3-1.73h.02Z"/></svg>
        {{ $t('footer.sponsor') }}
      </a>
      <span class="text-xs text-[#ccc] hidden md:block" aria-live="polite" :aria-label="$t('header.liveLabel')">
        <span class="text-[#2979ff] animate-pulse" aria-hidden="true">●</span> LIVE
      </span>
      <div class="flex items-center gap-0.5 border-l border-[#2a2a2a] pl-3 ml-1" role="radiogroup" :aria-label="$t('common.language')">
        <button
          v-for="l in locales" :key="l.code"
          @click="setLocale(l.code)"
          class="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded transition-colors"
          :class="locale === l.code ? 'bg-[#00c853] text-black' : 'text-[#666] hover:text-[#ccc]'"
          :aria-label="l.code === 'en' ? 'English' : 'Español'"
          :aria-pressed="locale === l.code"
        >
          {{ l.label }}
        </button>
      </div>
    </div>
  </header>

  <!-- Mobile search -->
  <div class="md:hidden px-4 py-2 bg-[#111] border-b border-[#2a2a2a]">
    <SearchBar />
  </div>

  <!-- Mobile bottom nav -->
  <nav class="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#111]/95 backdrop-blur-xl border-t border-[#2a2a2a] flex justify-around py-1.5 safe-area-bottom" :aria-label="$t('header.navMobile')">
    <NuxtLink
      v-for="link in navLinks" :key="link.to"
      :to="link.to"
      class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-md transition-colors"
      :class="isActive(link.to) ? 'text-[#00c853]' : 'text-[#999] hover:text-[#ccc]'"
      :aria-current="isActive(link.to) ? 'page' : undefined"
    >
      <span class="text-lg" aria-hidden="true">{{ link.icon }}</span>
      <span class="text-[10px] font-medium">{{ $t(link.labelKey) }}</span>
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
            class="px-4 py-3 rounded-lg text-[#ccc] hover:bg-white/5 hover:text-white transition-colors flex items-center gap-3"
            :class="{ 'text-white bg-white/5': isActive(link.to) }"
            @click="mobileOpen = false"
          >
            <span class="text-lg">{{ link.icon }}</span>
            <span class="font-medium">{{ $t(link.labelKey) }}</span>
          </NuxtLink>
        </div>
        <div class="mt-6 pt-4 border-t border-[#2a2a2a] flex items-center justify-center gap-1" role="radiogroup" :aria-label="$t('common.language')">
          <button
            v-for="l in locales" :key="l.code"
            @click="setLocale(l.code)"
            class="text-xs font-mono font-bold px-3 py-1.5 rounded-lg transition-colors"
            :class="locale === l.code ? 'bg-[#00c853] text-black' : 'text-[#666] hover:text-[#ccc] bg-white/5'"
            :aria-pressed="locale === l.code"
          >
            {{ l.label }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { monetization } from '../utils/monetization'

const { locale, setLocale } = useI18n()
const route = useRoute()
const mobileOpen = ref(false)

const locales = [
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
  { code: 'pt', label: 'PT' },
]

const navLinks = [
  { to: '/terminal', labelKey: 'header.navLinks.market', icon: '📊' },
  { to: '/terminal/portfolio', labelKey: 'header.navLinks.portfolio', icon: '💼' },
  { to: '/terminal/screener', labelKey: 'header.navLinks.screener', icon: '🔍' },
  { to: '/terminal/alerts', labelKey: 'header.navLinks.alerts', icon: '🔔' },
  { to: '/terminal/pipeline', labelKey: 'header.navLinks.pipeline', icon: '🔀' },
  { to: '/terminal/pricing', labelKey: 'header.navLinks.pricing', icon: '💎' },
  { to: '/about', labelKey: 'header.navLinks.about', icon: 'ℹ️' },
  { to: '/contact', labelKey: 'header.navLinks.contact', icon: '✉️' },
  { to: '/blog', labelKey: 'header.navLinks.blog', icon: '📝' },
]

function isActive(to: string) {
  const p = route.path
  const localized = locale.value === 'en' ? to : `/${locale.value}${to}`
  return p === localized || p.startsWith(localized + '/')
}
</script>

<style scoped>
.safe-area-bottom {
  padding-bottom: max(0.375rem, env(safe-area-inset-bottom, 0px));
}
</style>
