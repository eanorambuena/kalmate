import { readFileSync } from 'fs'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

const FILE = new URL('../nuxt.config.ts', import.meta.url).pathname

describe('nuxt config', () => {
  it('devtools debe estar deshabilitado en produccion', () => {
    const content = readFileSync(FILE, 'utf-8')
    const hasConditionalDevtools = content.includes('process.env') && content.includes('devtools')
    const hasHardcodedTrue = content.includes('devtools: { enabled: true }')
    const hasHardcodedFalse = content.includes('devtools: { enabled: false }')

    assert.ok(
      hasConditionalDevtools || hasHardcodedFalse,
      'devtools debe ser condicional (process.env) o false, no hardcoded true'
    )
    assert.ok(
      !hasHardcodedTrue,
      'devtools no debe estar hardcoded a true'
    )
  })
})
