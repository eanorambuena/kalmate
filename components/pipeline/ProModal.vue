<template>
  <Modal v-model="open">
    <div class="bg-[#0d0d0d] border border-[#ff69b4]/30 rounded-3xl p-10 max-w-lg w-full mx-4 shadow-[0_0_80px_rgba(255,105,180,0.15)] modal-enter">
      <div class="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full bg-gradient-to-br from-[#ff69b4] via-[#ffd700] to-[#00c853] flex items-center justify-center text-3xl shadow-[0_0_40px_rgba(255,105,180,0.4)] animate-pulse-slow">
        <span class="text-black font-bold text-2xl">✦</span>
      </div>
      <button class="absolute top-4 right-4 text-[#aaa] hover:text-white text-xl transition-colors" :aria-label="$t('common.close')" @click="open = false">✕</button>

        <div class="text-center mt-4">
          <p class="text-[#ff69b4] text-xs font-mono tracking-[0.2em] mb-2 animate-fade-in">{{ $t('pipeline.proModal.badge') }}</p>
          <h2 class="text-3xl font-bold text-white mb-2 animate-fade-in" style="animation-delay: 0.1s">
            {{ $t('pipeline.proModal.unlock') }} <span class="bg-gradient-to-r from-[#ff69b4] via-[#ffd700] to-[#00c853] bg-clip-text text-transparent">{{ $t('pipeline.proModal.pro') }}</span>
          </h2>
          <p class="text-[#aaa] text-sm mb-6 animate-fade-in" style="animation-delay: 0.2s">{{ $t('pipeline.proModal.subtitle') }}</p>
        </div>

        <div class="space-y-2.5 mb-8 animate-fade-in" style="animation-delay: 0.3s">
          <div v-for="f in proFeatures" :key="f.label" class="flex items-center gap-3 bg-[#111] border border-[#222] rounded-xl px-4 py-2.5">
            <component :is="f.icon" class="w-4 h-4 flex-shrink-0" :style="{ color: '#ff69b4' }" />
            <span class="text-white text-sm">{{ f.label }}</span>
          </div>
        </div>

        <div class="text-center mb-6 animate-fade-in" style="animation-delay: 0.4s">
          <p class="text-3xl font-bold text-white">
            <span class="text-[#aaa] line-through text-xl">{{ $t('pipeline.proModal.originalPrice') }}</span>
            <span class="bg-gradient-to-r from-[#ff69b4] to-[#ffd700] bg-clip-text text-transparent"> {{ $t('pipeline.proModal.proPrice') }}</span>
          </p>
          <p class="text-[#aaa] text-xs">{{ $t('pipeline.proModal.priceCaption') }}</p>
        </div>

        <button
          class="relative w-full py-3.5 rounded-xl text-sm font-bold text-black overflow-hidden group animate-fade-in"
          style="animation-delay: 0.5s"
          @click="goPricing"
        >
          <span class="absolute inset-0 bg-gradient-to-r from-[#ff69b4] via-[#ffd700] to-[#00c853] bg-[length:200%_100%] animate-gradient-shift" />
          <span class="absolute inset-0 bg-[rgba(255,255,255,0.1)] opacity-0 group-hover:opacity-100 transition-opacity" />
          <span class="relative z-10 flex items-center justify-center gap-2">
            <span>{{ $t('pipeline.proModal.cta') }}</span>
            <span class="text-lg group-hover:translate-x-1 transition-transform">→</span>
          </span>
        </button>

        <p class="text-[#aaa] text-[10px] text-center mt-4 animate-fade-in" style="animation-delay: 0.6s">
          {{ $t('pipeline.proModal.payments') }}
        </p>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import Modal from '../Modal.vue'
import { TrendingUp, BarChart3, Sparkles, Link2, Mail, Zap } from '@lucide/vue'

const { t } = useI18n()

const props = defineProps<{ modelValue?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
const open = ref(props.modelValue ?? false)

watch(() => props.modelValue, (v) => { open.value = v ?? false })
watch(open, (v) => { emit('update:modelValue', v) })

const featureIcons = [TrendingUp, BarChart3, Sparkles, Link2, Mail, Zap]

const proFeatures = computed(() => {
  const labels = t('pipeline.proModal.features') as string[]
  return labels.map((label, i) => ({
    icon: featureIcons[i] || Zap,
    label,
  }))
})

function goPricing() {
  window.location.href = '/terminal/pricing'
}
</script>

<style scoped>
.modal-enter {
  animation: modalIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes modalIn {
  from { opacity: 0; transform: scale(0.85) translateY(20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes pulse-slow {
  0%, 100% { box-shadow: 0 0 40px rgba(255,105,180,0.4); }
  50% { box-shadow: 0 0 60px rgba(255,105,180,0.7), 0 0 80px rgba(255,215,0,0.3); }
}
@keyframes gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
.animate-fade-in {
  animation: fade-in 0.5s ease-out both;
}
.animate-pulse-slow {
  animation: pulse-slow 3s ease-in-out infinite;
}
.animate-gradient-shift {
  animation: gradient-shift 3s ease infinite;
}
</style>
