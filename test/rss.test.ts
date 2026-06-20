import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

// Mock Nitro/H3 globals for test context
globalThis.defineEventHandler = (fn: any) => fn
let capturedType = ''
globalThis.setHeader = (event: any, name: string, value: string) => {
  capturedType = value
}

describe('RSS feed', () => {
  it('defineEventHandler recibe event y retorna XML valido', async () => {
    const { default: handler } = await import('../server/api/rss.get.ts')
    const result = await handler({})

    assert.ok(typeof result === 'string', 'debe retornar string')
    assert.ok(result.startsWith('<?xml'), 'debe comenzar con XML declaration')
    assert.ok(result.includes('<rss'), 'debe contener tag RSS')
    assert.ok(result.includes('<channel>'), 'debe contener channel')
    assert.strictEqual(capturedType, 'application/rss+xml; charset=utf-8')
  })
})
