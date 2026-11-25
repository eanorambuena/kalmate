import { readFileSync } from 'fs'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

const FILE = new URL('../utils/yahoo.ts', import.meta.url).pathname

describe('yahoo fetch', () => {
  it('apiFetch debe usar AbortSignal.timeout para evitar cuelgues', () => {
    const content = readFileSync(FILE, 'utf-8')
    const lines = content.split('\n')

    const apiFetchLines = lines
      .map((l, i) => ({ line: l, idx: i }))
      .filter(({ line }) => line.includes('fetch(url,'))

    assert.ok(
      apiFetchLines.length > 0,
      'Debe existir al menos un fetch(url, ...)'
    )

    const hasSignal = apiFetchLines.some(({ line }) =>
      line.includes('AbortSignal.timeout') || line.includes('signal:')
    )

    assert.ok(
      hasSignal,
      `fetch(url, { ... }) debe incluir signal con timeout. Lineas encontradas:\n${
        apiFetchLines.map(({ line, idx }) => `  ${idx + 1}: ${line.trim()}`).join('\n')
      }`
    )
  })
})
