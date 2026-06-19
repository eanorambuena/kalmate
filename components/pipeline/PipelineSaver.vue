<template>
  <div class="absolute inset-0 z-20 pointer-events-none">
    <div class="absolute top-3 left-3 w-72 bg-[#111] border border-[#333] rounded-xl p-3 pointer-events-auto shadow-2xl">
      <div class="flex items-center justify-between mb-2">
        <span class="text-[10px] font-bold text-[#2979ff] uppercase tracking-wider">{{ $t('pipeline.saver.heading') }}</span>
        <button class="text-[#bbb] hover:text-white text-[9px]" @click="$emit('close')">✕</button>
      </div>

      <div class="flex gap-1 mb-2">
        <input
          v-model="newName"
          type="text"
          :placeholder="$t('pipeline.saver.placeholder')"
          class="flex-1 bg-[#222] border border-[#444] rounded px-2 py-1 text-white text-[10px] font-mono outline-none focus:border-[#2979ff]"
          @keydown.enter="saveCurrent"
        />
        <button class="bg-[#2979ff] hover:bg-[#2962ff] text-white text-[10px] font-bold px-2 py-1 rounded-lg transition-colors disabled:opacity-40" :disabled="!newName.trim()" @click="saveCurrent">
          {{ $t('pipeline.saver.save') }}
        </button>
      </div>

      <div v-if="savedPipelines.length === 0" class="text-[#666] text-[10px] text-center py-4">
        {{ $t('pipeline.saver.empty') }}
      </div>

      <div v-for="(p, idx) in savedPipelines" :key="p.name" class="flex items-center gap-1 py-1.5 border-b border-[#222] last:border-0 group">
        <div v-if="editing === p.name" class="flex-1 flex gap-1">
          <input
            v-model="renameValue"
            class="flex-1 bg-[#222] border border-[#444] rounded px-1.5 py-0.5 text-white text-[10px] font-mono outline-none"
            @keydown.enter="doRename(p.name)"
            @keydown.escape="editing = ''"
          />
          <button class="text-[#00c853] text-[9px]" @click="doRename(p.name)">{{ $t('common.ok') }}</button>
        </div>
        <template v-else>
          <button class="flex-1 text-left text-[10px] text-[#bbb] hover:text-white truncate" @click="loadPipeline(p.name)">
            {{ p.name }}
          </button>
          <button class="text-[#666] hover:text-[#2979ff] text-[9px] hidden group-hover:inline" @click="startRename(p.name)" :title="$t('common.rename')">✎</button>
          <button class="text-[#666] hover:text-[#2979ff] text-[9px] hidden group-hover:inline" @click="downloadPipeline(p.name)" :title="$t('common.download')">↓</button>
          <button class="text-[#666] hover:text-[#ff1744] text-[9px] hidden group-hover:inline" @click="deletePipeline(p.name)" :title="$t('common.delete')">✕</button>
        </template>
      </div>

      <div v-if="savedPipelines.length > 0" class="mt-2 pt-2 border-t border-[#222] flex gap-1">
        <button class="flex-1 text-[9px] text-[#bbb] hover:text-white py-1 rounded bg-[#1a1a1a] hover:bg-[#222] transition-colors" @click="importPipeline">
          {{ $t('common.import') }}
        </button>
        <input ref="fileInput" type="file" accept=".json" class="hidden" @change="onFileSelected" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const emit = defineEmits<{
  load: [data: { nodes: any[]; edges: any[]; results: any; counter: number; autorun: boolean }]
  close: []
}>()

const STORAGE_KEY = 'kalmate-pipelines'
const ACTIVE_KEY = 'kalmate-pipeline'

type SavedPipeline = {
  name: string
  data: string
  savedAt: string
}

const newName = ref('')
const editing = ref('')
const renameValue = ref('')
const fileInput = ref<HTMLInputElement>()
const savedPipelines = ref<SavedPipeline[]>([])

onMounted(() => {
  loadList()
})

function loadList() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    savedPipelines.value = raw ? JSON.parse(raw) : []
  } catch {
    savedPipelines.value = []
  }
}

function saveList() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedPipelines.value))
}

function saveCurrent() {
  const name = newName.value.trim()
  if (!name) return
  const current = localStorage.getItem(ACTIVE_KEY)
  if (!current) return
  const existing = savedPipelines.value.findIndex(p => p.name === name)
  const entry: SavedPipeline = { name, data: current, savedAt: new Date().toISOString() }
  if (existing >= 0) {
    savedPipelines.value[existing] = entry
  } else {
    savedPipelines.value.push(entry)
  }
  saveList()
  newName.value = ''
}

function loadPipeline(name: string) {
  const p = savedPipelines.value.find(p => p.name === name)
  if (!p) return
  try {
    const data = JSON.parse(p.data)
    localStorage.setItem(ACTIVE_KEY, p.data)
    emit('load', data)
  } catch {}
}

function deletePipeline(name: string) {
  savedPipelines.value = savedPipelines.value.filter(p => p.name !== name)
  saveList()
}

function startRename(name: string) {
  editing.value = name
  renameValue.value = name
}

function doRename(oldName: string) {
  const newN = renameValue.value.trim()
  if (!newN) return
  const p = savedPipelines.value.find(p => p.name === oldName)
  if (p) p.name = newN
  saveList()
  editing.value = ''
}

function downloadPipeline(name: string) {
  const p = savedPipelines.value.find(p => p.name === name)
  if (!p) return
  const blob = new Blob([p.data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${name.replace(/[^a-zA-Z0-9_-]/g, '_')}.pipeline.json`
  a.click()
  URL.revokeObjectURL(url)
}

function importPipeline() {
  fileInput.value?.click()
}

function onFileSelected(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    const content = reader.result as string
    try {
      JSON.parse(content)
      const name = file.name.replace(/\.pipeline\.json$/, '').replace(/_/g, ' ')
      const entry: SavedPipeline = { name, data: content, savedAt: new Date().toISOString() }
      savedPipelines.value.push(entry)
      saveList()
    } catch {}
  }
  reader.readAsText(file)
  ;(e.target as HTMLInputElement).value = ''
}
</script>
