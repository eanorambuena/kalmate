<template>
  <footer class="py-12 px-6 border-t border-[#1a1a1a] bg-[#0a0a0a]">
    <div class="max-w-6xl mx-auto text-center">
      <div class="text-[#00c853] font-bold text-lg tracking-wider">KALMATE⌘</div>
      <p class="text-[#888] text-xs mt-3">Real-time financial data at your fingertips.</p>
      <div class="flex justify-center gap-4 mt-4 text-[10px] text-[#666]">
        <span>Data: Yahoo Finance</span>
        <span>Deploy: Cloudflare Pages</span>
      </div>
      <div class="flex justify-center gap-3 mt-4 text-xs">
        <NuxtLink to="/about" class="text-[#888] hover:text-white transition-colors">About</NuxtLink>
        <NuxtLink to="/contact" class="text-[#888] hover:text-white transition-colors">Contact</NuxtLink>
        <NuxtLink to="/blog" class="text-[#888] hover:text-white transition-colors">Blog</NuxtLink>
        <NuxtLink to="/privacy" class="text-[#888] hover:text-white transition-colors">Privacy</NuxtLink>
        <NuxtLink to="/terms" class="text-[#888] hover:text-white transition-colors">Terms</NuxtLink>
        <NuxtLink to="/disclaimer" class="text-[#888] hover:text-white transition-colors">Disclaimer</NuxtLink>
      </div>

      <AdBanner />

      <div class="mt-6 pt-6 border-t border-[#1a1a1a]">
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
          <button
            v-if="m.fintual.enabled"
            class="inline-flex items-center gap-2 px-5 py-2.5 bg-[#6366f1]/10 text-[#6366f1] border border-[#6366f1]/20 rounded-lg text-sm font-medium hover:bg-[#6366f1]/20 transition-all cursor-pointer"
            @click="showFintualModal = true"
          >
            {{ m.fintual.label }}
          </button>
        </div>
      </div>
    </div>
  </footer>

  <Teleport to="body">
    <div v-if="showFintualModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4" @click.self="showFintualModal = false">
      <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div class="relative bg-[#111] border border-[#333] rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <button class="absolute top-4 right-4 text-[#ccc] hover:text-white text-lg cursor-pointer" @click="showFintualModal = false">✕</button>
        <div class="text-center">
          <div class="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4 bg-[#6366f1]/10 text-[#6366f1]">F</div>
          <h3 class="text-white font-bold text-lg mb-3">{{ m.fintual.label }}</h3>
          <p class="text-[#ccc] text-sm leading-relaxed mb-4">
            Esta web fue hecha por <strong class="text-white">Emmanuel Norambuena</strong>.
          </p>
          <p class="text-[#ccc] text-sm leading-relaxed mb-6">
            Si quieres apoyarme con este referido, cuando Fintual te pregunte si alguien te recomendó, indica que me conoces. Eso me ayuda a seguir desarrollando herramientas gratis como esta.
          </p>
          <a
            :href="m.fintual.url"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 px-6 py-3 bg-[#6366f1] text-white rounded-xl text-sm font-bold hover:bg-[#6366f1]/90 transition-all no-underline"
            @click="showFintualModal = false"
          >
            Ir a {{ m.fintual.label }} →
          </a>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { monetization as m } from '../utils/monetization'
import { useCurrency } from '~/composables/useCurrency'

const showFintualModal = ref(false)
const { currency, toggleCurrency } = useCurrency()
function setCurrency(c: 'CLP' | 'USD') {
  if (currency.value !== c) toggleCurrency()
}
</script>
