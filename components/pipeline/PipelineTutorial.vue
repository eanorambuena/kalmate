<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="skip" />
      <div class="relative bg-[#111] border border-[#333] rounded-2xl p-8 max-w-lg w-full shadow-2xl">
        <button class="absolute top-4 right-4 text-[#aaa] hover:text-white text-lg cursor-pointer" @click="skip">✕</button>

        <div class="text-center mb-6">
          <div class="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4" :style="{ background: step.color + '20', color: step.color }">
            {{ step.icon }}
          </div>
          <h3 class="text-white font-bold text-lg mb-2">{{ step.title }}</h3>
          <p class="text-[#aaa] text-sm leading-relaxed">{{ step.text }}</p>
        </div>

        <div v-if="step.code" class="bg-[#0a0a0a] border border-[#222] rounded-xl p-3 mb-6 text-left font-mono text-xs text-[#aaa]">
          <div v-for="(line, i) in step.code" :key="i">{{ line }}</div>
        </div>

        <div class="flex items-center justify-between gap-3">
          <button class="text-[#aaa] hover:text-white text-xs transition-colors cursor-pointer" @click="skip">
            Skip tutorial
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
              Back
            </button>
            <button
              class="px-5 py-2 text-sm font-bold rounded-xl transition-colors cursor-pointer"
              :style="{ background: step.color, color: '#000' }"
              @click="next"
            >
              {{ currentStep < steps.length - 1 ? 'Next' : 'Done' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const show = ref(false)

const steps = [
  { icon: '🔀', color: '#2979ff', title: 'Welcome to Pipeline Builder', text: 'Visual pipeline builder para análisis financiero. Conecta nodos para crear estrategias sin código.' },
  { icon: '+', color: '#2979ff', title: 'Add Nodes', text: 'Haz clic en los botones FREE/Pro del toolbar para agregar nodos al canvas. Cada nodo tiene entradas (azul) y salidas (verde).' },
  { icon: '🔗', color: '#00c853', title: 'Connect Nodes', text: 'Arrastra desde un puerto de salida (verde) a un puerto de entrada (azul) para conectar nodos. El flujo va de izquierda a derecha.' },
  { icon: '📦', color: '#2979ff', title: 'Available Nodes', text: 'Input: Symbol Input, Price Feed. Process: Kalman Filter. Output: Chart, Price Display, Alert.' },
  { icon: '💎', color: '#ff69b4', title: 'Pro Nodes', text: 'SMA, RSI, Price Forecast, Multi Symbol, Telegram, Email. Upgrade en Pricing para desbloquear.' },
  { icon: '▶', color: '#2979ff', title: 'Run Pipeline', text: 'Presiona Run para ejecutar el pipeline. Los resultados aparecen en cada nodo y en el panel lateral.' },
]

const currentStep = ref(0)
const step = computed(() => steps[currentStep.value])

function next() {
  if (currentStep.value < steps.length - 1) {
    currentStep.value++
  } else {
    done()
  }
}

function prev() {
  if (currentStep.value > 0) currentStep.value--
}

function skip() {
  done()
}

function done() {
  if (import.meta.client) localStorage.setItem('kalmate-pipeline-tutorial', 'done')
  show.value = false
}

onMounted(() => {
  if (import.meta.client && !localStorage.getItem('kalmate-pipeline-tutorial')) {
    show.value = true
  }
})
</script>
