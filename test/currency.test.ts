import { readFileSync } from 'fs'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

const FILE = new URL('../composables/useCurrency.ts', import.meta.url).pathname

describe('useCurrency', () => {
  it('localStorage debe leerse dentro de onMounted, no en module scope', () => {
    const content = readFileSync(FILE, 'utf-8')
    const hasModuleLevelRead = content.includes('localStorage.getItem') && !content.includes('onMounted')
    const hasMountedRead = content.includes('onMounted') && content.includes('localStorage.getItem')

    assert.ok(
      hasMountedRead,
      'localStorage.getItem debe estar dentro de onMounted para SSR safety'
    )
    assert.ok(
      !hasModuleLevelRead,
      'no debe haber localStorage.getItem en module scope (solo en onMounted)'
    )
  })
})
