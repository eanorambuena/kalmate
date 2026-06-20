import { readFileSync } from 'fs'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

const FILE = new URL('../components/PortfolioTable.vue', import.meta.url).pathname

describe('PortfolioTable', () => {
  it('addToast debe usar variable local, no newSymbol.value (que ya se limpio)', () => {
    const content = readFileSync(FILE, 'utf-8')
    const lines = content.split('\n')

    const addToastLine = lines.findIndex(l => l.includes('addToast') && l.includes('added'))
    const clearLine = lines.findIndex(l => l.includes("newSymbol.value = ''"))
    const saveLine = lines.findIndex(l => l.includes('const symbol = newSymbol'))

    assert.ok(
      saveLine >= 0,
      'Debe existir un capture: const symbol = newSymbol.value.toUpperCase() antes de limpiar'
    )
    assert.ok(
      saveLine < clearLine,
      `const symbol (linea ${saveLine + 1}) debe estar antes de newSymbol.value = '' (linea ${clearLine + 1})`
    )
    assert.ok(
      addToastLine > clearLine,
      `addToast (linea ${addToastLine + 1}) debe estar despues de newSymbol.value = '' (linea ${clearLine + 1})`
    )
    assert.ok(
      lines[addToastLine].includes('symbol') || lines[addToastLine].includes('`${symbol'),
      `addToast debe usar la variable local 'symbol' no 'newSymbol.value'`
    )
  })
})
