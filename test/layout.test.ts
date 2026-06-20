import { readFileSync } from 'fs'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

const FILE = new URL('../layouts/default.vue', import.meta.url).pathname

describe('default layout', () => {
  it('<main> debe tener aria-label dinamico segun ruta, no hardcoded', () => {
    const content = readFileSync(FILE, 'utf-8')
    const hasHardcoded = /aria-label="Market data"/.test(content)
    const hasDynamic = content.includes('aria-label') && (content.includes('route') || content.includes('computed') || content.includes(':aria-label'))

    assert.ok(
      !hasHardcoded,
      'aria-label no debe ser hardcoded "Market data"'
    )
    assert.ok(
      hasDynamic,
      'aria-label debe ser reactivo (usar :aria-label con computed basado en route)'
    )
  })
})
