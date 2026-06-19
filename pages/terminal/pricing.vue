<script setup lang="ts">
import { canonicalUrl } from '../../utils/seo'

const { t } = useI18n()

const canonical = canonicalUrl('/terminal/pricing')

useHead({
  title: computed(() => t('pricing.heading')),
  meta: [
    { name: 'description', content: computed(() => t('pricing.subtext')) },
    { name: 'keywords', content: 'kalmate pricing, free financial terminal, free forever, no sign-up, pro plan, financial terminal pricing' },
    { property: 'og:title', content: computed(() => t('pricing.heading')) },
    { property: 'og:description', content: computed(() => t('pricing.subtext')) },
    { property: 'og:url', content: canonical },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: computed(() => t('pricing.heading')) },
    { name: 'twitter:description', content: computed(() => t('pricing.subtext')) },
  ],
  link: [{ rel: 'canonical', href: canonical }],
})

const plan = ref<'free' | 'pro'>(getPlan())
const step = ref<'plans' | 'methods' | 'activate'>('plans')
const selectedMethod = ref('')

function getPlan(): 'free' | 'pro' {
  if (import.meta.client) {
    return (localStorage.getItem('kalmate-plan') as 'free' | 'pro') || 'free'
  }
  return 'free'
}

function setPlan(p: 'free' | 'pro') {
  plan.value = p
  if (import.meta.client) {
    localStorage.setItem('kalmate-plan', p)
  }
}

function goToMethods() {
  step.value = 'methods'
}

function selectMethod(m: string) {
  selectedMethod.value = m
  step.value = 'activate'
}

function activatePro() {
  setPlan('pro')
  step.value = 'plans'
}

function back() {
  step.value = selectedMethod ? 'methods' : 'plans'
  selectedMethod.value = ''
}

const methods = computed(() => [
  {
    id: 'buda',
    name: t('pricing.upgrade.methods.buda.name'),
    desc: t('pricing.upgrade.methods.buda.desc'),
    icon: '₿',
    color: '#00c853',
    bgColor: '#00c85310',
    details: t('pricing.upgrade.methods.buda.details'),
    action: 'https://www.buda.com/link/eanorambuena',
    actionLabel: t('pricing.upgrade.methods.buda.cta'),
  },
  {
    id: 'mach',
    name: t('pricing.upgrade.methods.mach.name'),
    desc: t('pricing.upgrade.methods.mach.desc'),
    icon: 'M',
    color: '#00a3ff',
    bgColor: '#00a3ff10',
    details: t('pricing.upgrade.methods.mach.details'),
    action: 'https://app.soymach.com/rF2V/vv4l7jpk',
    actionLabel: t('pricing.upgrade.methods.mach.cta'),
    email: 'eanorambuena@uc.cl',
  },
  {
    id: 'github',
    name: t('pricing.upgrade.methods.github.name'),
    desc: t('pricing.upgrade.methods.github.desc'),
    icon: '♥',
    color: '#ff69b4',
    bgColor: '#ff69b410',
    details: t('pricing.upgrade.methods.github.details'),
    action: 'https://github.com/sponsors/eanorambuena',
    actionLabel: t('pricing.upgrade.methods.github.cta'),
  },
])

const features = computed(() => t('pricing.comparison.features'))
</script>

<template>
  <div class="min-h-screen bg-[#0a0a0a] py-16 px-6">
    <div class="max-w-4xl mx-auto">

      <!-- Plans -->
      <div v-if="step === 'plans'">
        <div class="text-center mb-12">
          <p class="text-[#00c853] text-xs font-mono tracking-widest mb-3">{{ $t('pricing.eyebrow') }}</p>
          <h1 class="text-4xl font-bold text-white mb-3">{{ $t('pricing.heading') }}</h1>
          <p class="text-[#aaa] text-sm">{{ $t('pricing.subtext') }}</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <div
            class="bg-[#111] border rounded-2xl p-8 cursor-pointer transition-all duration-200"
            :class="plan === 'free' ? 'border-[#00c853] ring-1 ring-[#00c853]/30' : 'border-[#222] hover:border-[#333]'"
            @click="setPlan('free')"
          >
            <p class="text-[#aaa] text-xs font-mono tracking-widest mb-2">{{ $t('pricing.free.badge') }}</p>
            <p class="text-4xl font-bold text-white mb-1">{{ $t('pricing.free.price') }}</p>
            <p class="text-[#aaa] text-sm mb-6">{{ $t('pricing.free.desc') }}</p>
            <button
              class="w-full py-2.5 rounded-lg text-sm font-bold transition-all"
              :class="plan === 'free' ? 'bg-[#00c853] text-black' : 'bg-[#1a1a1a] text-[#aaa] hover:text-white'"
            >
              {{ plan === 'free' ? $t('pricing.free.current') : $t('pricing.free.downgrade') }}
            </button>
          </div>

          <div
            class="bg-[#111] border rounded-2xl p-8 transition-all duration-200 relative overflow-hidden"
            :class="plan === 'pro' ? 'border-[#ff69b4] ring-1 ring-[#ff69b4]/30' : 'border-[#222]'"
          >
            <div class="absolute top-0 right-0 bg-[#ff69b4]/10 text-[#ff69b4] text-[10px] font-bold px-3 py-1 rounded-bl-lg">
              {{ $t('pricing.pro.badge') }}
            </div>
            <p class="text-[#aaa] text-xs font-mono tracking-widest mb-2">{{ $t('pricing.pro.badge') }}</p>
            <p class="text-4xl font-bold text-white mb-1">{{ $t('pricing.pro.price') }}</p>
            <p class="text-[#aaa] text-sm mb-1">{{ $t('pricing.pro.priceCaption') }}</p>
            <p class="text-[#aaa] text-sm mb-6">{{ $t('pricing.pro.desc') }}</p>
            <button
              v-if="plan !== 'pro'"
              class="w-full py-2.5 rounded-lg text-sm font-bold bg-[#ff69b4] text-black hover:bg-[#ff85c8] transition-all"
              @click="goToMethods"
            >
              {{ $t('pricing.pro.cta') }}
            </button>
            <button
              v-else
              class="w-full py-2.5 rounded-lg text-sm font-bold bg-[#ff69b4] text-black"
            >
              {{ $t('pricing.pro.current') }}
            </button>
          </div>
        </div>

        <div class="max-w-2xl mx-auto mt-10 bg-[#111] border border-[#222] rounded-2xl p-6">
          <p class="text-white font-bold text-sm mb-4">{{ $t('pricing.comparison.title') }}</p>
          <div class="space-y-3">
            <div v-for="f in features" :key="f.label" class="flex items-center justify-between text-sm">
              <span class="text-[#ccc]">{{ f.label }}</span>
              <div class="flex items-center gap-4 text-xs">
                <span :class="f.free ? 'text-[#00c853]' : 'text-[#444]'">{{ f.free ? '✓' : '—' }}</span>
                <span :class="f.pro ? 'text-[#ff69b4]' : 'text-[#444]'">{{ f.pro ? '✓' : '—' }}</span>
              </div>
            </div>
          </div>
          <div class="flex justify-end gap-4 text-[10px] text-[#aaa] mt-3 pt-3 border-t border-[#222]">
            <span>{{ $t('pricing.comparison.freeCol') }}</span>
            <span>{{ $t('pricing.comparison.proCol') }}</span>
          </div>
        </div>
      </div>

      <!-- Payment Methods -->
      <div v-if="step === 'methods'">
        <button class="text-[#aaa] hover:text-white text-xs mb-8 transition-colors" @click="back">{{ $t('pricing.upgrade.backToPlans') }}</button>
        <div class="text-center mb-10">
          <p class="text-[#ff69b4] text-xs font-mono tracking-widest mb-3">{{ $t('pricing.upgrade.eyebrow') }}</p>
          <h2 class="text-3xl font-bold text-white mb-2">{{ $t('pricing.upgrade.heading') }}</h2>
          <p class="text-[#aaa] text-sm">{{ $t('pricing.upgrade.subtext') }}</p>
        </div>
        <div class="max-w-lg mx-auto space-y-4">
          <div
            v-for="m in methods" :key="m.id"
            class="bg-[#111] border border-[#222] rounded-2xl p-6 hover:border-[#333] transition-all cursor-pointer"
            @click="selectMethod(m.id)"
          >
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold" :style="{ background: m.bgColor, color: m.color }">
                {{ m.icon }}
              </div>
              <div>
                <p class="text-white font-bold text-sm">{{ m.name }}</p>
                <p class="text-[#aaa] text-xs">{{ m.desc }}</p>
              </div>
              <div class="ml-auto text-[#aaa]">→</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Activation -->
      <div v-if="step === 'activate'">
        <button class="text-[#aaa] hover:text-white text-xs mb-8 transition-colors" @click="back">{{ $t('pricing.upgrade.backToMethods') }}</button>
        <div class="max-w-md mx-auto bg-[#111] border border-[#222] rounded-2xl p-8 text-center">
          <div class="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4" :style="{ background: methods.find(m => m.id === selectedMethod)?.bgColor, color: methods.find(m => m.id === selectedMethod)?.color }">
            {{ methods.find(m => m.id === selectedMethod)?.icon }}
          </div>
          <h3 class="text-white font-bold text-lg mb-2">{{ methods.find(m => m.id === selectedMethod)?.name }}</h3>
          <p class="text-[#aaa] text-sm mb-6">{{ methods.find(m => m.id === selectedMethod)?.details }}</p>

          <div v-if="selectedMethod === 'mach'" class="bg-[#0a0a0a] border border-[#333] rounded-xl p-4 mb-6">
            <img src="/qr-mach.jpg" alt="QR MACH" class="w-48 h-48 mx-auto rounded-lg mb-4">
            <p class="text-[#aaa] text-xs mb-1 text-center">{{ $t('pricing.upgrade.transferLabel') }}</p>
            <p class="text-white font-mono text-sm break-all text-center">eanorambuena@uc.cl</p>
            <p class="text-[#aaa] text-xs mt-2 text-center">{{ $t('pricing.upgrade.amountLabel') }}</p>
          </div>

          <a
            v-if="methods.find(m => m.id === selectedMethod)?.action"
            :href="methods.find(m => m.id === selectedMethod)?.action"
            target="_blank"
            rel="noopener noreferrer"
            class="block w-full py-3 rounded-xl text-sm font-bold text-center mb-4 transition-all no-underline"
            :style="{ background: methods.find(m => m.id === selectedMethod)?.color + '20', color: methods.find(m => m.id === selectedMethod)?.color, border: '1px solid ' + methods.find(m => m.id === selectedMethod)?.color + '40' }"
          >
            {{ methods.find(m => m.id === selectedMethod)?.actionLabel }} →
          </a>

          <div class="border-t border-[#222] pt-5 mt-5">
            <p class="text-[#aaa] text-xs mb-3">{{ $t('pricing.upgrade.activationPrompt') }}</p>
            <button
              class="w-full py-3 rounded-xl text-sm font-bold bg-[#ff69b4] text-black hover:bg-[#ff85c8] transition-all"
              @click="activatePro"
            >
              {{ $t('pricing.upgrade.activateBtn') }}
            </button>
            <p class="text-[#aaa] text-[10px] mt-3">{{ $t('pricing.upgrade.honorNote') }}</p>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
