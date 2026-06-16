<template>
  <div class="bg-[#111] border border-[#333] rounded-xl p-3 min-w-[180px] cursor-grab active:cursor-grabbing relative" :style="{ borderLeft: '3px solid ' + color }">
    <span v-if="props.data?.pro" class="absolute -top-2 -right-2 bg-[#ff69b4] text-black text-[9px] font-bold px-1.5 py-0.5 rounded">PRO</span>

    <div class="flex items-center gap-2 mb-1">
      <div class="w-2 h-2 rounded-full" :style="{ backgroundColor: color }" />
      <span class="text-[10px] font-bold text-[#bbb] uppercase tracking-wider">{{ def.category }}</span>
    </div>

    <p class="text-white text-xs font-medium mb-0.5 cursor-pointer hover:text-[#00c853]" @click="startEdit" v-if="!editing">{{ label }}</p>
    <input v-else ref="inputEl" v-model="editLabel" class="bg-[#1a1a1a] border border-[#444] rounded px-1 py-0.5 text-xs text-white w-full mb-0.5 outline-none" @blur="saveLabel" @keydown.enter="saveLabel" @keydown.escape="cancelLabel" />
    <p class="text-[#bbb] text-[10px] mb-2">{{ def.description }}</p>

    <div v-if="def.type === 'symbolInput'" class="mb-2">
      <input
        v-model="data.symbol"
        class="w-full bg-[#222] border border-[#444] rounded px-2 py-1 text-white text-[10px] font-mono outline-none focus:border-[#00c853]"
        placeholder="AAPL"
      />
    </div>

    <div v-if="def.type === 'currencyInput'" class="mb-2 space-y-1.5">
      <div class="flex items-center gap-1">
        <span class="text-[9px] text-[#bbb] w-6">From</span>
        <select
          v-model="data.from"
          class="flex-1 bg-[#222] border border-[#444] rounded px-1.5 py-1 text-white text-[10px] font-mono outline-none focus:border-[#00c853] appearance-none cursor-pointer"
        >
          <option v-for="c in currencies" :key="c.code" :value="c.code">{{ c.code }}</option>
        </select>
      </div>
      <div class="flex items-center gap-1">
        <span class="text-[9px] text-[#bbb] w-6">To</span>
        <select
          v-model="data.to"
          class="flex-1 bg-[#222] border border-[#444] rounded px-1.5 py-1 text-white text-[10px] font-mono outline-none focus:border-[#00c853] appearance-none cursor-pointer"
        >
          <option v-for="c in currencies" :key="c.code" :value="c.code">{{ c.code }}</option>
        </select>
      </div>
      <p class="text-[#bbb] text-[9px] text-center mt-0.5">{{ data.from }}{{ data.to }}=X</p>
    </div>

    <div v-if="def.type === 'mathOp'" class="mb-2">
      <select
        v-model="data.op"
        class="w-full bg-[#222] border border-[#444] rounded px-2 py-1 text-white text-[10px] font-mono outline-none focus:border-[#00c853] appearance-none cursor-pointer text-center"
      >
<option value="+">+ (add)</option>
<option value="-">- (subtract)</option>
        <option value="*">* (multiply)</option>
        <option value="/">/ (divide)</option>
      </select>
    </div>

    <div v-if="def.type === 'scalarInput'" class="mb-2">
      <input
        v-model.number="data.value"
        class="w-full bg-[#222] border border-[#444] rounded px-2 py-1 text-white text-[10px] font-mono outline-none focus:border-[#00c853]"
        placeholder="1.0"
        step="0.01"
      />
    </div>

    <div v-if="def.type === 'portfolioInput'" class="mb-2">
      <div v-for="(weight, idx) in data.weights" :key="idx" class="flex items-center gap-1 mb-1">
        <span class="text-[9px] text-[#bbb] w-6">In{{ idx + 1 }}</span>
        <input
          type="number"
          v-model.number="data.weights[idx]"
          class="w-16 bg-[#222] border border-[#444] rounded px-1.5 py-1 text-white text-[10px] font-mono outline-none focus:border-[#00c853]"
          step="0.1"
          min="0"
        />
        <span class="text-[9px] text-[#bbb]">×</span>
      </div>
    </div>

    <div v-if="def.type === 'emaIndicator' || def.type === 'smaIndicator' || def.type === 'rsiIndicator'" class="mb-2">
      <input
        v-model.number="data.period"
        type="number"
        class="w-full bg-[#222] border border-[#444] rounded px-2 py-1 text-white text-[10px] font-mono outline-none focus:border-[#00c853]"
        placeholder="Period"
        min="2"
        max="200"
      />
    </div>

    <div class="flex items-start justify-between gap-1 mb-1">
      <div class="flex flex-col gap-1">
        <template v-if="def.type === 'portfolioInput'">
          <div v-for="(weight, idx) in data.weights" :key="'in-' + idx" class="flex items-center gap-1 relative pl-3">
            <Handle type="target" :position="Position.Left" :id="`in${idx}`" class="w-2 h-2 !bg-[#2979ff] !border-0" :style="{ position:'absolute', left:'0px', top:'50%' }" />
            <span class="text-[9px] text-[#bbb]">In{{ idx + 1 }}</span>
          </div>
        </template>
        <template v-else>
          <div v-for="(inp, i) in def.inputs" :key="'in-' + i" class="flex items-center gap-1 relative pl-3">
            <Handle type="target" :position="Position.Left" :id="inp.id" class="w-2 h-2 !bg-[#2979ff] !border-0" :style="{ position:'absolute', left:'0px', top:'50%' }" />
            <span class="text-[9px] text-[#bbb]">{{ inp.label }}</span>
          </div>
        </template>
      </div>
      <div class="flex flex-col gap-1">
        <div v-for="(out, i) in def.outputs" :key="'out-' + i" class="flex items-center gap-1 relative pr-3">
          <span class="text-[9px] text-[#bbb]">{{ out.label }}</span>
          <Handle type="source" :position="Position.Right" :id="out.id" class="w-2 h-2 !bg-[#00c853] !border-0" :style="{ position:'absolute', right:'0px', top:'50%' }" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import { nodeDefinitions, currencies } from '../../../utils/pipeline/nodeDefinitions'
import { computed, ref, onMounted, nextTick } from 'vue'

const props = defineProps({
  id: { type: String, required: true },
  data: { type: Object, default: () => ({}) },
})

const def = computed(() => nodeDefinitions.find(n => n.type === props.data.type) || nodeDefinitions[0])
const label = computed(() => props.data.label || def.value.label)
const color = computed(() => def.value.color)

const editing = ref(false)
const editLabel = ref('')
const inputEl = ref<HTMLInputElement>()

function startEdit() {
  editLabel.value = label.value
  editing.value = true
  nextTick(() => inputEl.value?.focus())
}

function saveLabel() {
  if (editLabel.value.trim()) {
    props.data.label = editLabel.value.trim()
  }
  editing.value = false
}

function cancelLabel() {
  editing.value = false
}

onMounted(() => {
  if (def.value.type === 'portfolioInput' && (!props.data.weights || props.data.weights.length === 0)) {
    props.data.weights = [1, 1]
  }
})

const addInput = () => {
  if (def.value.dynamicInputs && props.data.weights) {
    props.data.weights.push(1)
  }
}
</script>
