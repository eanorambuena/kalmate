import { readFileSync } from 'fs'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

const FILE = new URL('../plugins/keyboard.client.ts', import.meta.url).pathname

describe('keyboard plugin', () => {
  it('tecla R no debe usar window.location.reload()', () => {
    const content = readFileSync(FILE, 'utf-8')
    const hasWindowReload = content.includes('window.location.reload')
    const hasRouterGo = content.includes('router.go') || content.includes('refreshNuxtData')

    assert.ok(!hasWindowReload, 'no debe usar window.location.reload()')
    assert.ok(hasRouterGo, 'debe usar router.go(0) o refreshNuxtData()')
  })
})
