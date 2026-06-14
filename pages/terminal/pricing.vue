<script setup lang="ts">
const plan = ref<'free' | 'pro'>(getPlan())

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

const features = [
  { free: true, pro: true, label: 'Visual node editor' },
  { free: true, pro: true, label: 'Basic nodes (Symbol, Price, Chart, Kalman)' },
  { free: false, pro: true, label: 'Pro nodes (RSI, SMA, Forecast, Multi Symbol)' },
  { free: false, pro: true, label: 'Telegram & Email alerts' },
  { free: true, pro: true, label: 'Real-time market data' },
  { free: true, pro: true, label: 'Kalman filter analysis' },
  { free: false, pro: true, label: 'Unlimited pipeline runs' },
  { free: true, pro: true, label: 'Stock detail page with charts' },
]
</script>

<template>
  <div class="min-h-screen bg-[#0a0a0a] py-16 px-6">
    <div class="max-w-4xl mx-auto">
      <div class="text-center mb-12">
        <p class="text-[#00c853] text-xs font-mono tracking-widest mb-3">PRICING</p>
        <h1 class="text-4xl font-bold text-white mb-3">Simple Plans for Every Trader</h1>
        <p class="text-[#888] text-sm">Start free, upgrade when you need pro nodes for your pipelines.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        <!-- Free Plan -->
        <div
          class="bg-[#111] border rounded-2xl p-8 cursor-pointer transition-all duration-200"
          :class="plan === 'free' ? 'border-[#00c853] ring-1 ring-[#00c853]/30' : 'border-[#222] hover:border-[#333]'"
          @click="setPlan('free')"
        >
          <p class="text-[#888] text-xs font-mono tracking-widest mb-2">FREE</p>
          <p class="text-4xl font-bold text-white mb-1">$0</p>
          <p class="text-[#555] text-sm mb-6">Forever free for basic usage.</p>
          <button
            class="w-full py-2.5 rounded-lg text-sm font-bold transition-all"
            :class="plan === 'free' ? 'bg-[#00c853] text-black' : 'bg-[#1a1a1a] text-[#888] hover:text-white'"
          >
            {{ plan === 'free' ? 'Current Plan' : 'Downgrade' }}
          </button>
        </div>

        <!-- Pro Plan -->
        <div
          class="bg-[#111] border rounded-2xl p-8 cursor-pointer transition-all duration-200 relative overflow-hidden"
          :class="plan === 'pro' ? 'border-[#ff69b4] ring-1 ring-[#ff69b4]/30' : 'border-[#222] hover:border-[#333]'"
          @click="setPlan('pro')"
        >
          <div class="absolute top-0 right-0 bg-[#ff69b4]/10 text-[#ff69b4] text-[10px] font-bold px-3 py-1 rounded-bl-lg">
            PRO
          </div>
          <p class="text-[#888] text-xs font-mono tracking-widest mb-2">PRO</p>
          <p class="text-4xl font-bold text-white mb-1">$9<span class="text-lg text-[#555]">/mo</span></p>
          <p class="text-[#555] text-sm mb-6">Unlock all nodes and features.</p>
          <a
            v-if="plan !== 'pro'"
            href="#"
            class="block w-full py-2.5 rounded-lg text-sm font-bold text-center bg-[#ff69b4] text-black hover:bg-[#ff85c8] transition-all no-underline"
          >
            Upgrade to Pro
          </a>
          <button
            v-else
            class="w-full py-2.5 rounded-lg text-sm font-bold bg-[#ff69b4] text-black"
          >
            Current Plan
          </button>
        </div>
      </div>

      <div class="max-w-2xl mx-auto mt-10 bg-[#111] border border-[#222] rounded-2xl p-6">
        <p class="text-white font-bold text-sm mb-4">Feature Comparison</p>
        <div class="space-y-3">
          <div v-for="f in features" :key="f.label" class="flex items-center justify-between text-sm">
            <span class="text-[#ccc]">{{ f.label }}</span>
            <div class="flex items-center gap-4 text-xs">
              <span :class="f.free ? 'text-[#00c853]' : 'text-[#444]'">{{ f.free ? '✓' : '—' }}</span>
              <span :class="f.pro ? 'text-[#ff69b4]' : 'text-[#444]'">{{ f.pro ? '✓' : '—' }}</span>
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-4 text-[10px] text-[#555] mt-3 pt-3 border-t border-[#222]">
          <span>FREE</span>
          <span>PRO</span>
        </div>
      </div>

      <p class="text-center text-[#555] text-xs mt-8 max-w-md mx-auto">
        Payments processed via Flow.cl. No monthly fixed costs — only per-transaction fees.
        Cancel anytime.
      </p>
    </div>
  </div>
</template>
