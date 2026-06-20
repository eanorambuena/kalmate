import { readFileSync } from 'fs'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

const FILE = new URL('../composables/useScrollReveal.ts', import.meta.url).pathname

describe('useScrollReveal', () => {
  it('debe hacer disconnect del observer en onUnmounted', () => {
    const content = readFileSync(FILE, 'utf-8')
    const hasObserve = content.includes('observer.observe')
    const hasUnmountedDisconnect = content.includes('onUnmounted') && content.includes('disconnect')

    assert.ok(hasObserve, 'debe existir observer.observe(target)')
    assert.ok(
      hasUnmountedDisconnect,
      'debe llamar observer.disconnect() en onUnmounted para evitar leak'
    )
  })
})
