import { readFileSync } from 'fs'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

const FILE = new URL('../composables/useToast.ts', import.meta.url).pathname

describe('useToast', () => {
  it('debe usar crypto.randomUUID() en vez de Math.random() para IDs', () => {
    const content = readFileSync(FILE, 'utf-8')
    assert.ok(content.includes('crypto.randomUUID'), 'debe usar crypto.randomUUID()')
    assert.ok(!content.includes('Math.random'), 'no debe usar Math.random() para IDs')
  })
})
