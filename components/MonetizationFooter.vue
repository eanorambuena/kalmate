<template>
  <footer class="py-12 px-6 border-t border-[#1a1a1a] bg-[#0a0a0a]">
    <div class="max-w-6xl mx-auto text-center">
      <span class="text-[#00c853] font-bold text-lg tracking-wider">KALMATE⌘</span>
      <p class="text-[#888] text-sm mt-4">Real-time financial data at your fingertips.</p>
      <div class="flex justify-center gap-6 mt-6 text-xs text-[#888]">
        <span>Data: Yahoo Finance</span>
        <span>Deploy: Cloudflare Pages</span>
      </div>
      <div class="flex justify-center gap-4 mt-3 text-xs">
        <NuxtLink to="/about" class="text-[#888] hover:text-white transition-colors">About</NuxtLink>
        <NuxtLink to="/contact" class="text-[#888] hover:text-white transition-colors">Contact</NuxtLink>
        <NuxtLink to="/privacy" class="text-[#888] hover:text-white transition-colors">Privacy</NuxtLink>
        <NuxtLink to="/terms" class="text-[#888] hover:text-white transition-colors">Terms</NuxtLink>
        <NuxtLink to="/disclaimer" class="text-[#888] hover:text-white transition-colors">Disclaimer</NuxtLink>
      </div>

      <div class="mt-8 pt-8 border-t border-[#1a1a1a]">
        <p class="text-[#888] text-xs mb-3">Kalmate is free and open source.</p>
        <div class="flex items-center justify-center gap-2 mb-4">
          <span class="text-[9px] text-[#666]">Moneda:</span>
          <button
            class="text-[10px] font-mono px-2 py-0.5 rounded transition-colors"
            :class="currency === 'CLP' ? 'bg-[#2979ff]/20 text-[#2979ff] border border-[#2979ff]/40' : 'bg-[#1a1a1a] text-[#bbb] border border-[#333] hover:text-white'"
            @click="setCurrency('CLP')"
          >CLP</button>
          <button
            class="text-[10px] font-mono px-2 py-0.5 rounded transition-colors"
            :class="currency === 'USD' ? 'bg-[#2979ff]/20 text-[#2979ff] border border-[#2979ff]/40' : 'bg-[#1a1a1a] text-[#bbb] border border-[#333] hover:text-white'"
            @click="setCurrency('USD')"
          >USD</button>
        </div>
        <div class="flex flex-wrap items-center justify-center gap-3">
          <a
            v-if="m.githubSponsors.enabled"
            :href="m.githubSponsors.url"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 px-5 py-2.5 bg-[#ff69b4]/10 text-[#ff69b4] border border-[#ff69b4]/20 rounded-lg text-sm font-medium hover:bg-[#ff69b4]/20 transition-all"
          >
            <svg class="w-4 h-4" viewBox="0 0 16 16" fill="currentColor"><path d="m8 14.25-.345.666a.75.75 0 0 0 .69 0l-.345-.666Zm0 0 .345.666a.75.75 0 0 1-.69 0L8 14.25ZM4.268 2.47a3.72 3.72 0 0 0-3.31 1.34c-1.27 1.7-1 4.04.64 5.78l.02.02.02.02L8 14.25l6.37-4.62.02-.02.02-.02c1.64-1.74 1.91-4.08.64-5.78a3.72 3.72 0 0 0-3.31-1.34 4.9 4.9 0 0 0-3.3 1.73L8 4.69l-.44-.49a4.9 4.9 0 0 0-3.3-1.73h.02Z"/></svg>
            Sponsor on GitHub
          </a>
          <a
            v-if="m.buda.enabled"
            :href="m.buda.url"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00c853]/10 text-[#00c853] border border-[#00c853]/20 rounded-lg text-sm font-medium hover:bg-[#00c853]/20 transition-all"
          >
            {{ m.buda.label }}
          </a>
          <a
            v-if="m.fintual.enabled"
            :href="m.fintual.url"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 px-5 py-2.5 bg-[#6366f1]/10 text-[#6366f1] border border-[#6366f1]/20 rounded-lg text-sm font-medium hover:bg-[#6366f1]/20 transition-all"
          >
            {{ m.fintual.label }}
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { monetization as m } from '../utils/monetization'
import { useCurrency } from '~/composables/useCurrency'

const { currency, toggleCurrency } = useCurrency()
function setCurrency(c: 'CLP' | 'USD') {
  if (currency.value !== c) toggleCurrency()
}
</script>
