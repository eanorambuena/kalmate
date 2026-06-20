import { readFileSync, globSync } from 'fs'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

const ROOT = new URL('..', import.meta.url).pathname

describe('ARIA attributes', () => {
  const vueFiles = globSync(`${ROOT}/{components,pages}/**/*.vue`)
  const broken: string[] = []

  for (const file of vueFiles) {
    const content = readFileSync(file, 'utf-8')
    // Match aria-expanded="..." WITHOUT the : prefix (literal string, not expression)
    const regex = /\saria-expanded=(['"])(?!\s*\{)([^'"]+)\1/g
    for (const match of content.matchAll(regex)) {
      const lineStart = content.lastIndexOf('\n', match.index) + 1
      const lineEnd = content.indexOf('\n', match.index)
      const line = content.slice(lineStart, lineEnd).trim()
      // Skip if it's actually a static true/false or the file is test-generated
      if (match[2] === 'true' || match[2] === 'false') continue
      broken.push(`${file.replace(ROOT, '')}: ${line}`)
    }
  }

  it('aria-expanded debe usar :bind para expresiones JS, no strings literales', () => {
    assert.strictEqual(broken.length, 0, broken.join('\n'))
  })
})
