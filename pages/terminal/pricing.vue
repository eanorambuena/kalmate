<script setup lang="ts">
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

const methods = [
  {
    id: 'buda',
    name: 'Buda (cripto)',
    desc: 'Donación en crypto vía Buda',
    icon: '₿',
    color: '#00c853',
    bgColor: '#00c85310',
    details: 'Manda el equivalente a $9.990 CLP en BTC, ETH o USDC a este link y activas Pro para siempre.',
    action: 'https://www.buda.com/link/eanorambuena',
    actionLabel: 'Donar con Buda',
  },
  {
    id: 'mach',
    name: 'MACH / Transferencia',
    desc: 'Transferencia desde cualquier banco',
    icon: 'M',
    color: '#00a3ff',
    bgColor: '#00a3ff10',
    details: 'Paga $9.990 CLP con MACH desde cualquier banco (Santander, BCI, BancoEstado, etc.).',
    action: 'https://app.soymach.com/rF2V/vv4l7jpk',
    actionLabel: 'Pagar con MACH',
    email: 'eanorambuena@uc.cl',
  },
  {
    id: 'github',
    name: 'GitHub Sponsors',
    desc: 'Sponsoreame en GitHub',
    icon: '♥',
    color: '#ff69b4',
    bgColor: '#ff69b410',
    details: 'Donación única de $9.990 CLP (≈ $9 USD) como sponsor en GitHub. Activas Pro para siempre.',
    action: 'https://github.com/sponsors/eanorambuena',
    actionLabel: 'Sponsor en GitHub',
  },
]

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

      <!-- Plans -->
      <div v-if="step === 'plans'">
        <div class="text-center mb-12">
          <p class="text-[#00c853] text-xs font-mono tracking-widest mb-3">PRICING</p>
          <h1 class="text-4xl font-bold text-white mb-3">Simple Plans for Every Trader</h1>
          <p class="text-[#888] text-sm">Start free, upgrade when you need pro nodes.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
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

          <div
            class="bg-[#111] border rounded-2xl p-8 transition-all duration-200 relative overflow-hidden"
            :class="plan === 'pro' ? 'border-[#ff69b4] ring-1 ring-[#ff69b4]/30' : 'border-[#222]'"
          >
            <div class="absolute top-0 right-0 bg-[#ff69b4]/10 text-[#ff69b4] text-[10px] font-bold px-3 py-1 rounded-bl-lg">
              PRO
            </div>
            <p class="text-[#888] text-xs font-mono tracking-widest mb-2">PRO</p>
            <p class="text-4xl font-bold text-white mb-1">$9.990</p>
            <p class="text-[#555] text-sm mb-1">Una vez, para siempre.</p>
            <p class="text-[#555] text-sm mb-6">Unlock all pro nodes and features.</p>
            <button
              v-if="plan !== 'pro'"
              class="w-full py-2.5 rounded-lg text-sm font-bold bg-[#ff69b4] text-black hover:bg-[#ff85c8] transition-all"
              @click="goToMethods"
            >
              Upgrade to Pro
            </button>
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
      </div>

      <!-- Payment Methods -->
      <div v-if="step === 'methods'">
        <button class="text-[#888] hover:text-white text-xs mb-8 transition-colors" @click="back">← Back to plans</button>
        <div class="text-center mb-10">
          <p class="text-[#ff69b4] text-xs font-mono tracking-widest mb-3">UPGRADE</p>
          <h2 class="text-3xl font-bold text-white mb-2">Choose a payment method</h2>
          <p class="text-[#888] text-sm">Donate any amount via any method below and get Pro activated.</p>
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
                <p class="text-[#888] text-xs">{{ m.desc }}</p>
              </div>
              <div class="ml-auto text-[#555]">→</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Activation -->
      <div v-if="step === 'activate'">
        <button class="text-[#888] hover:text-white text-xs mb-8 transition-colors" @click="back">← Back to methods</button>
        <div class="max-w-md mx-auto bg-[#111] border border-[#222] rounded-2xl p-8 text-center">
          <div class="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4" :style="{ background: methods.find(m => m.id === selectedMethod)?.bgColor, color: methods.find(m => m.id === selectedMethod)?.color }">
            {{ methods.find(m => m.id === selectedMethod)?.icon }}
          </div>
          <h3 class="text-white font-bold text-lg mb-2">{{ methods.find(m => m.id === selectedMethod)?.name }}</h3>
          <p class="text-[#888] text-sm mb-6">{{ methods.find(m => m.id === selectedMethod)?.details }}</p>

          <div v-if="selectedMethod === 'mach'" class="bg-[#0a0a0a] border border-[#333] rounded-xl p-4 mb-6">
            <img src="/qr-mach.jpg" alt="QR MACH" class="w-48 h-48 mx-auto rounded-lg mb-4">
            <p class="text-[#888] text-xs mb-1 text-center">O transfiere manualmente a:</p>
            <p class="text-white font-mono text-sm break-all text-center">eanorambuena@uc.cl</p>
            <p class="text-[#555] text-xs mt-2 text-center">Monto: $9.990 CLP (cualquier banco)</p>
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
            <p class="text-[#888] text-xs mb-3">¿Ya donaste? Activa tu Pro:</p>
            <button
              class="w-full py-3 rounded-xl text-sm font-bold bg-[#ff69b4] text-black hover:bg-[#ff85c8] transition-all"
              @click="activatePro"
            >
              Ya doné, activar Pro 🎉
            </button>
            <p class="text-[#555] text-[10px] mt-3">Honor system por ahora. Pronto pagos automáticos.</p>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
