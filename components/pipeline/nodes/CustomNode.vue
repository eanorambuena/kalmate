<template>
  <div
    class="group relative bg-[#111] border border-[#333] rounded-xl p-3 w-[220px] cursor-grab active:cursor-grabbing"
    :style="{ borderLeft: '3px solid ' + color }"
  >
    <button
      type="button"
      class="nodrag absolute top-1.5 right-1.5 z-10 w-4 h-4 flex items-center justify-center rounded text-[#888] hover:text-white hover:bg-[#333] text-xs leading-none opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
      title="Remove node"
      aria-label="Remove node"
      @click.stop="removeSelf"
    >×</button>

    <div class="flex items-center gap-2 mb-1 pr-5">
      <div class="w-2 h-2 rounded-full flex-shrink-0" :style="{ backgroundColor: color }" />
      <span class="text-[10px] font-bold text-[#bbb] uppercase tracking-wider">{{ def.category }}</span>
      <span
        v-if="def.pro"
        class="ml-auto bg-[#ff69b4] text-black text-[8px] font-bold px-1 py-px rounded leading-tight"
      >PRO</span>
    </div>

    <p v-if="!editing" class="nodrag text-white text-xs font-medium mb-0.5 cursor-pointer hover:text-[#00c853] truncate" :title="label" @click="startEdit">{{ label }}</p>
    <input
      v-else
      ref="inputEl"
      v-model="editLabel"
      class="nodrag bg-[#1a1a1a] border border-[#444] rounded px-1 py-0.5 text-xs text-white w-full mb-0.5 outline-none"
      @blur="saveLabel"
      @keydown.enter="saveLabel"
      @keydown.escape="cancelLabel"
    />
    <p class="text-[#bbb] text-[10px] mb-2 line-clamp-2 leading-snug">{{ def.description }}</p>

    <!-- Parameters defined by the node definition -->
    <div v-for="p in def.params ?? []" :key="p.key" class="mb-2">
      <label class="block text-[9px] text-[#888] mb-0.5">{{ p.label }}</label>
      <select
        v-if="p.kind === 'select'"
        v-model="data[p.key]"
        class="nodrag w-full bg-[#222] border border-[#444] rounded px-1.5 py-1 text-white text-[10px] font-mono outline-none focus:border-[#00c853] cursor-pointer"
      >
        <option v-for="o in p.options ?? []" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
      <input
        v-else-if="p.kind === 'number'"
        v-model.number="data[p.key]"
        type="number"
        :min="p.min"
        :max="p.max"
        :step="p.step ?? 'any'"
        class="nodrag w-full bg-[#222] border border-[#444] rounded px-2 py-1 text-white text-[10px] font-mono outline-none focus:border-[#00c853]"
      />
      <input
        v-else-if="p.kind === 'date'"
        v-model="data[p.key]"
        type="date"
        class="nodrag w-full bg-[#222] border border-[#444] rounded px-2 py-1 text-white text-[10px] font-mono outline-none focus:border-[#00c853] color-scheme-dark"
      />
      <input
        v-else
        v-model="data[p.key]"
        type="text"
        :placeholder="p.placeholder"
        class="nodrag w-full bg-[#222] border border-[#444] rounded px-2 py-1 text-white text-[10px] font-mono outline-none focus:border-[#00c853]"
      />
    </div>

    <!-- Currency pair: from and to -->
    <div v-if="def.type === 'currencyInput'" class="mb-2 space-y-1.5">
      <div class="flex items-center gap-1">
        <span class="text-[9px] text-[#bbb] w-6">From</span>
        <select
          v-model="data.from"
          class="nodrag flex-1 bg-[#222] border border-[#444] rounded px-1.5 py-1 text-white text-[10px] font-mono outline-none focus:border-[#00c853] cursor-pointer"
        >
          <option v-for="c in currencies" :key="c.code" :value="c.code">{{ c.code }}</option>
        </select>
      </div>
      <div class="flex items-center gap-1">
        <span class="text-[9px] text-[#bbb] w-6">To</span>
        <select
          v-model="data.to"
          class="nodrag flex-1 bg-[#222] border border-[#444] rounded px-1.5 py-1 text-white text-[10px] font-mono outline-none focus:border-[#00c853] cursor-pointer"
        >
          <option v-for="c in currencies" :key="c.code" :value="c.code">{{ c.code }}</option>
        </select>
      </div>
      <p class="text-[#bbb] text-[9px] text-center">{{ data.from }}{{ data.to }}=X</p>
    </div>

    <!-- Result -->
    <div class="mb-1.5 min-h-[28px] flex flex-col items-center justify-center text-center gap-1">
      <p v-if="result?.error" class="text-[#ff1744] text-[10px] leading-snug line-clamp-2 break-words">{{ result.error }}</p>
      <p v-else-if="headline" class="font-mono text-sm font-bold" :class="headline.cls">{{ headline.text }}</p>
      <span
        v-if="alert"
        class="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded border"
        :class="alert.triggered ? 'bg-[#ff1744]/15 text-[#ff1744] border-[#ff1744]/40' : 'bg-[#1a1a1a] text-[#888] border-[#333]'"
      >{{ alert.triggered ? 'Triggered' : 'Watching' }}</span>
    </div>

    <div v-if="!result?.error && extras.length" class="mb-1.5 space-y-0.5 min-w-0">
      <p
        v-for="(line, i) in extras"
        :key="i"
        class="text-[9px] leading-snug"
        :class="line.cls"
        :title="line.text"
      >{{ line.text }}</p>
    </div>

    <!-- Handles: inputs on the left, outputs on the right. Weighted Average rows are its inputs and weights. -->
    <div class="flex items-start justify-between gap-2">
      <div class="flex flex-col gap-1 min-w-0">
        <template v-if="def.type === 'portfolioInput'">
          <div v-for="(weight, idx) in data.weights" :key="'in-' + idx" class="flex items-center gap-1 relative pl-3">
            <Handle type="target" :position="Position.Left" :id="`in${idx}`" class="w-2 h-2 !bg-[#2979ff] !border-0" :style="{ position: 'absolute', left: '0px', top: '50%' }" />
            <Handle type="source" :position="Position.Left" :id="`left:in${idx}`" class="w-2 h-2 !bg-[#2979ff] !border-0 !opacity-0" :style="{ position: 'absolute', left: '0px', top: '50%' }" />
            <span class="text-[9px] text-[#bbb] w-7 flex-shrink-0">In{{ idx + 1 }}</span>
            <input
              v-model.number="data.weights[idx]"
              type="number"
              step="0.1"
              min="0"
              :title="`Weight of input ${idx + 1}`"
              class="nodrag w-12 bg-[#222] border border-[#444] rounded px-1.5 py-0.5 text-white text-[10px] font-mono outline-none focus:border-[#00c853]"
            />
          </div>
          <button
            type="button"
            class="nodrag text-[9px] text-[#888] hover:text-[#00c853] text-left pl-3"
            @click="addWeight"
          >+ Add input</button>
        </template>
        <template v-else>
          <div v-for="(inp, i) in def.inputs" :key="'in-' + i" class="flex items-center gap-1 relative pl-3">
            <Handle type="target" :position="Position.Left" :id="inp.id" class="w-2 h-2 !bg-[#2979ff] !border-0" :style="{ position: 'absolute', left: '0px', top: '50%' }" />
            <Handle type="source" :position="Position.Left" :id="'left:' + inp.id" class="w-2 h-2 !bg-[#2979ff] !border-0 !opacity-0" :style="{ position: 'absolute', left: '0px', top: '50%' }" />
            <span class="text-[9px] text-[#bbb]">{{ inp.label }}</span>
          </div>
        </template>
      </div>
      <div class="flex flex-col gap-1 items-end flex-shrink-0">
        <div v-for="(out, i) in def.outputs" :key="'out-' + i" class="flex items-center gap-1 relative pr-3">
          <span class="text-[9px] text-[#bbb]">{{ out.label }}</span>
          <Handle type="source" :position="Position.Right" :id="out.id" class="w-2 h-2 !bg-[#00c853] !border-0" :style="{ position: 'absolute', right: '0px', top: '50%' }" />
          <Handle type="target" :position="Position.Right" :id="'right:' + out.id" class="w-2 h-2 !bg-[#00c853] !border-0 !opacity-0" :style="{ position: 'absolute', right: '0px', top: '50%' }" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import { nodeDefinitions, currencies } from '../../../utils/pipeline/nodeDefinitions'
import { formatValue } from '../../../utils/pipeline/values'

const props = defineProps({
  id: { type: String, required: true },
  data: { type: Object, default: () => ({}) },
})

const { removeNodes } = useVueFlow()

const def = computed(() => nodeDefinitions.find(n => n.type === props.data.type) || nodeDefinitions[0]!)
const label = computed(() => props.data.label || def.value.label)
const color = computed(() => def.value.color)
const result = computed<any>(() => props.data?.result)

type Tone = 'text-white' | 'text-[#00c853]' | 'text-[#ff1744]'
const GREEN = 'text-[#00c853]'
const RED = 'text-[#ff1744]'

/** Percent values are green when positive and red when negative. */
function toneFor(unit: string | undefined, raw: unknown): Tone {
  if (unit !== 'percent' || typeof raw !== 'number' || !Number.isFinite(raw)) return 'text-white'
  if (raw > 0) return GREEN
  if (raw < 0) return RED
  return 'text-white'
}

const headline = computed<{ text: string; cls: string } | null>(() => {
  const r = result.value
  if (!r || r.error) return null
  if (def.value.type === 'display') {
    if (r.text == null) return null
    return { text: String(r.text), cls: toneFor(r.unit, r.value) }
  }
  if (def.value.type === 'alertOutput') {
    return r.value == null ? null : { text: formatValue(r.value), cls: 'text-white' }
  }
  const p = def.value.primary
  if (!p || !(p.key in r)) return null
  const unit: string = r.unit ?? p.unit
  return { text: formatValue(r[p.key], unit), cls: toneFor(unit, r[p.key]) }
})

const alert = computed(() => {
  const r = result.value
  if (!r || r.error || def.value.type !== 'alertOutput') return null
  return { triggered: r.triggered === true }
})

type Line = { text: string; cls: string }

/** Small text under the headline, by node type. */
const extras = computed<Line[]>(() => {
  const r = result.value
  if (!r) return []
  switch (def.value.type) {
    case 'forecastNode': {
      const out: Line[] = []
      if (typeof r.verdict === 'string' && r.verdict) {
        out.push({
          text: r.verdict,
          cls: (r.verdict.startsWith('Beat') ? GREEN : 'text-[#ffab00]') + ' line-clamp-2',
        })
      }
      if (typeof r.n === 'number' && r.n >= 4 && typeof r.hitRate === 'number') {
        out.push({ text: `hit rate ${Math.round(r.hitRate * 100)}% · n=${r.n}`, cls: 'text-[#888]' })
      }
      return out
    }
    case 'newsOutput':
      return (Array.isArray(r.headlines) ? r.headlines : [])
        .slice(0, 3)
        .map((h: string) => ({ text: h, cls: 'text-[#bbb] truncate' }))
    case 'compareReference':
      return r.label ? [{ text: String(r.label), cls: 'text-[#bbb] truncate' }] : []
    case 'fairValue': {
      const parts: string[] = []
      if (r.fairValue != null) parts.push(`Fair value ${formatValue(r.fairValue, 'price')}`)
      if (r.pe != null) {
        const pe = `P/E ${formatValue(r.pe, 'ratio')}`
        parts.push(r.medianPe != null ? `${pe} vs median ${formatValue(r.medianPe, 'ratio')}` : pe)
      }
      return parts.length ? [{ text: parts.join(' · '), cls: 'text-[#bbb] line-clamp-2' }] : []
    }
    case 'kalmanFilter':
      if (r.signal === 1) return [{ text: 'Below trend', cls: GREEN }]
      if (r.signal === -1) return [{ text: 'Above trend', cls: RED }]
      return []
    default:
      return []
  }
})

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

function removeSelf() {
  removeNodes([props.id], true)
}

function addWeight() {
  if (Array.isArray(props.data.weights)) props.data.weights.push(1)
}

if (def.value.type === 'portfolioInput' && !Array.isArray(props.data.weights)) {
  props.data.weights = [1, 1]
}
</script>

<style scoped>
.color-scheme-dark {
  color-scheme: dark;
}
</style>
