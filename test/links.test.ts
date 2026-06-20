import { readFileSync, globSync } from 'fs'
import { describe, it } from 'node:test'
import assert from 'node:assert'

const ROOT = new URL('..', import.meta.url).pathname

describe('navigation links', () => {
  const vueFiles = globSync(`${ROOT}/{components,pages}/**/*.vue`)
  const regex = /:to\s*=\s*(['"`])\s*`?\s*\/stock\//g
  const broken: string[] = []

  for (const file of vueFiles) {
    const content = readFileSync(file, 'utf-8')
    for (const match of content.matchAll(regex)) {
      const lineStart = content.lastIndexOf('\n', match.index) + 1
      const lineEnd = content.indexOf('\n', match.index)
      const line = content.slice(lineStart, lineEnd).trim()
      if (line.includes('/terminal/stock/')) continue
      broken.push(`${file.replace(ROOT, '')}: ${line}`)
    }
  }

  it('no debe haber links a /stock/ sin prefijo /terminal/', () => {
    assert.strictEqual(broken.length, 0, broken.join('\n'))
  })
})
