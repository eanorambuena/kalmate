<template>
  <Modal v-model="show">
    <div class="bg-[#111] border border-[#333] rounded-2xl p-8 max-w-lg w-full shadow-2xl">
      <button class="absolute top-4 right-4 text-[#aaa] hover:text-white text-lg cursor-pointer" @click="close">✕</button>

      <div class="text-center mb-6">
        <div class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" :style="{ background: step.color + '20' }">
          <component :is="step.icon" class="w-7 h-7" :style="{ color: step.color }" />
        </div>
        <h3 class="text-white font-bold text-lg mb-2">{{ step.title }}</h3>
        <p class="text-[#aaa] text-sm leading-relaxed">{{ step.text }}</p>
      </div>

      <div v-if="step.code" class="bg-[#0a0a0a] border border-[#222] rounded-xl p-3 mb-6 text-left font-mono text-xs text-[#aaa]">
        <div v-for="(line, i) in step.code" :key="i">{{ line }}</div>
      </div>

      <div class="flex items-center justify-between gap-3">
        <button class="text-[#aaa] hover:text-white text-xs transition-colors cursor-pointer" @click="close">
          {{ $t('pipeline.tutorial.skip') }}
        </button>
        <div class="flex items-center gap-2">
          <div v-for="(s, i) in steps" :key="i" class="w-2 h-2 rounded-full transition-colors" :class="i === currentStep ? 'bg-[#00c853]' : 'bg-[#333]'" />
        </div>
        <div class="flex gap-2">
          <button
            v-if="currentStep > 0"
            class="px-4 py-2 bg-[#222] text-[#ccc] text-sm rounded-xl hover:bg-[#333] transition-colors cursor-pointer"
            @click="prev"
          >
            {{ $t('pipeline.tutorial.back') }}
          </button>
          <button
            class="px-5 py-2 text-sm font-bold rounded-xl transition-colors cursor-pointer"
            :style="{ background: step.color, color: '#000' }"
            @click="next"
          >
            {{ currentStep < steps.length - 1 ? $t('pipeline.tutorial.next') : $t('pipeline.tutorial.done') }}
          </button>
        </div>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Modal from '../Modal.vue'
import { Shuffle, Plus, Link2, Package, Diamond, Play } from '@lucide/vue'

const { t } = useI18n()

const show = ref(false)

const steps = computed(() => [
  { icon: Shuffle, color: '#2979ff', title: t('pipeline.tutorial.step1.title'), text: t('pipeline.tutorial.step1.text') },
  { icon: Plus, color: '#2979ff', title: t('pipeline.tutorial.step2.title'), text: t('pipeline.tutorial.step2.text') },
  { icon: Link2, color: '#00c853', title: t('pipeline.tutorial.step3.title'), text: t('pipeline.tutorial.step3.text') },
  { icon: Package, color: '#2979ff', title: t('pipeline.tutorial.step4.title'), text: t('pipeline.tutorial.step4.text') },
  { icon: Diamond, color: '#ff69b4', title: t('pipeline.tutorial.step5.title'), text: t('pipeline.tutorial.step5.text') },
  { icon: Play, color: '#2979ff', title: t('pipeline.tutorial.step6.title'), text: t('pipeline.tutorial.step6.text') },
])

const currentStep = ref(0)
const step = computed(() => steps.value[currentStep.value])

function next() {
  if (currentStep.value < steps.value.length - 1) {
    currentStep.value++
  } else {
    close()
  }
}

function prev() {
  if (currentStep.value > 0) currentStep.value--
}

function close() {
  if (import.meta.client) localStorage.setItem('kalmate-pipeline-tutorial', 'done')
  show.value = false
}

onMounted(() => {
  if (import.meta.client && !localStorage.getItem('kalmate-pipeline-tutorial')) {
    show.value = true
  }
})
</script>
