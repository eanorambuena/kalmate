<template>
  <footer class="py-16 px-6 border-t border-[#1a1a1a] bg-[#0a0a0a]">
    <div class="max-w-6xl mx-auto">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-10 text-center md:text-left">
        <div>
          <div class="text-[#00c853] font-bold text-lg tracking-wider">{{ $t('header.brand') }}⌘</div>
          <p class="text-[#888] text-sm mt-3 leading-relaxed">
            {{ $t('footer.description') }}
          </p>
          <a href="mailto:a25.eanorambuena@gmail.com" class="inline-block text-[#888] text-xs mt-3 hover:text-white transition-colors">
            a25.eanorambuena@gmail.com
          </a>
        </div>

        <div>
          <h4 class="text-white text-xs font-bold tracking-widest uppercase mb-4">{{ $t('footer.links') }}</h4>
          <ul class="space-y-2.5">
            <li><NuxtLink to="/terminal" class="text-[#888] text-sm hover:text-white transition-colors">{{ $t('footer.terminal') }}</NuxtLink></li>
            <li><NuxtLink to="/about" class="text-[#888] text-sm hover:text-white transition-colors">{{ $t('footer.about') }}</NuxtLink></li>
            <li><NuxtLink to="/contact" class="text-[#888] text-sm hover:text-white transition-colors">{{ $t('footer.contact') }}</NuxtLink></li>
            <li><NuxtLink to="/blog" class="text-[#888] text-sm hover:text-white transition-colors">{{ $t('footer.blog') }}</NuxtLink></li>
          </ul>
        </div>

        <div>
          <h4 class="text-white text-xs font-bold tracking-widest uppercase mb-4">{{ $t('footer.legal') }}</h4>
          <ul class="space-y-2.5">
            <li><NuxtLink to="/privacy" class="text-[#888] text-sm hover:text-white transition-colors">{{ $t('footer.privacyPolicy') }}</NuxtLink></li>
            <li><NuxtLink to="/terms" class="text-[#888] text-sm hover:text-white transition-colors">{{ $t('footer.termsOfService') }}</NuxtLink></li>
            <li><NuxtLink to="/disclaimer" class="text-[#888] text-sm hover:text-white transition-colors">{{ $t('footer.disclaimer') }}</NuxtLink></li>
          </ul>
        </div>
      </div>

      <AdBanner />

      <div class="mt-10 pt-8 border-t border-[#1a1a1a]">
        <div class="flex flex-wrap items-center justify-center gap-6 text-xs text-[#666]">
          <span>{{ $t('footer.dataSource') }}</span>
          <span>{{ $t('footer.deploy') }}</span>
          <span class="flex items-center gap-2">
            {{ $t('footer.currency') }}
            <button
              class="font-mono px-2 py-0.5 rounded transition-colors"
              :class="currency === 'CLP' ? 'bg-[#2979ff]/20 text-[#2979ff] border border-[#2979ff]/40' : 'bg-[#1a1a1a] text-[#bbb] border border-[#333] hover:text-white'"
              @click="setCurrency('CLP')"
            >CLP</button>
            <button
              class="font-mono px-2 py-0.5 rounded transition-colors"
              :class="currency === 'USD' ? 'bg-[#2979ff]/20 text-[#2979ff] border border-[#2979ff]/40' : 'bg-[#1a1a1a] text-[#bbb] border border-[#333] hover:text-white'"
              @click="setCurrency('USD')"
            >USD</button>
          </span>
        </div>

        <div class="flex flex-wrap items-center justify-center gap-3 mt-4">
          <a
            v-if="m.githubSponsors.enabled"
            :href="m.githubSponsors.url"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 px-4 py-2 bg-[#ff69b4]/10 text-[#ff69b4] border border-[#ff69b4]/20 rounded-lg text-xs font-medium hover:bg-[#ff69b4]/20 transition-all"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor"><path d="m8 14.25-.345.666a.75.75 0 0 0 .69 0l-.345-.666Zm0 0 .345.666a.75.75 0 0 1-.69 0L8 14.25ZM4.268 2.47a3.72 3.72 0 0 0-3.31 1.34c-1.27 1.7-1 4.04.64 5.78l.02.02.02.02L8 14.25l6.37-4.62.02-.02.02-.02c1.64-1.74 1.91-4.08.64-5.78a3.72 3.72 0 0 0-3.31-1.34 4.9 4.9 0 0 0-3.3 1.73L8 4.69l-.44-.49a4.9 4.9 0 0 0-3.3-1.73h.02Z"/></svg>
            {{ $t('footer.sponsor') }}
          </a>
          <a
            v-if="m.buda.enabled"
            :href="m.buda.url"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 px-4 py-2 bg-[#00c853]/10 text-[#00c853] border border-[#00c853]/20 rounded-lg text-xs font-medium hover:bg-[#00c853]/20 transition-all"
          >
            {{ $t('footer.donateBuda') }}
          </a>
          <button
            v-if="m.fintual.enabled"
            class="inline-flex items-center gap-2 px-4 py-2 bg-[#6366f1]/10 text-[#6366f1] border border-[#6366f1]/20 rounded-lg text-xs font-medium hover:bg-[#6366f1]/20 transition-all cursor-pointer"
            @click="showFintualModal = true"
          >
            {{ $t('footer.investFintual') }}
          </button>
        </div>

        <div class="mt-8 text-center text-[10px] text-[#555]">
          {{ $t('footer.copyright') }}
        </div>
      </div>
    </div>
  </footer>

  <Modal v-model="showFintualModal">
    <div class="bg-[#111] border border-[#333] rounded-2xl p-8 max-w-md w-full shadow-2xl">
      <button class="absolute top-4 right-4 text-[#ccc] hover:text-white text-lg cursor-pointer" :aria-label="$t('common.close')" @click="showFintualModal = false">✕</button>
      <div class="text-center">
        <div class="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4 bg-[#6366f1]/10 text-[#6366f1]">F</div>
        <h3 class="text-white font-bold text-lg mb-3">{{ $t('footer.investFintual') }}</h3>
        <p class="text-[#ccc] text-sm leading-relaxed mb-4">
          {{ $t('footer.builtBy') }} <strong class="text-white">{{ $t('footer.builtByName') }}</strong>.
        </p>
        <p class="text-[#ccc] text-sm leading-relaxed mb-6">
          {{ $t('footer.builtByDesc') }}
        </p>
        <a
          :href="m.fintual.url"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 px-6 py-3 bg-[#6366f1] text-white rounded-xl text-sm font-bold hover:bg-[#6366f1]/90 transition-all no-underline"
          @click="showFintualModal = false"
        >
          {{ $t('footer.goTo') }} {{ $t('footer.investFintual') }} →
        </a>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import Modal from './Modal.vue'
import { monetization as m } from '../utils/monetization'
import { useCurrency } from '~/composables/useCurrency'

const showFintualModal = ref(false)
const { currency, toggleCurrency } = useCurrency()
function setCurrency(c: 'CLP' | 'USD') {
  if (currency.value !== c) toggleCurrency()
}
</script>
