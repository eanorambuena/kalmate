import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

describe('cache', () => {
  it('no debe exceder MAX_SIZE (evicta la mas vieja)', async () => {
    const mod = await import('../utils/cache.ts')

    // Llenar el cache con mas entradas del limite
    for (let i = 0; i < 150; i++) {
      mod.setCache(`key-${i}`, { id: i }, 60_000)
    }

    // Verificar que las mas recientes existen
    assert.ok(mod.getCached('key-149'), 'key-149 debe existir')
    assert.ok(mod.getCached('key-140'), 'key-140 debe existir')

    // Verificar que las mas viejas se evictaron
    const oldest = mod.getCached('key-0')
    const oldest2 = mod.getCached('key-1')

    // Al menos las primeras 50 deberian haber sido eliminadas
    assert.strictEqual(oldest, null, 'key-0 deberia haber sido evictada')
  })
})
