import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const deploy = readFileSync('.github/workflows/deploy.yml', 'utf8')

describe('deploy workflow guards', () => {
  it('pins the pnpm version used by pnpm/action-setup', () => {
    const block = deploy.slice(deploy.indexOf('pnpm/action-setup'), deploy.indexOf('pnpm/action-setup') + 120)
    assert.match(block, /version:\s*['"]?\d+\.\d+/)
  })

  it('runs the test suite before provisioning and deploying', () => {
    const test = deploy.indexOf('pnpm test')
    const provision = deploy.indexOf('scripts/provision.mjs')
    const publish = deploy.indexOf('wrangler pages deploy')
    assert.ok(test > 0 && test < provision && provision < publish)
  })

  it('runs only one deploy at a time', () => {
    assert.match(deploy, /concurrency:/)
  })
})

describe('wrangler is a pinned project dependency', () => {
  it('declares wrangler in devDependencies so CI never downloads an unpinned version', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
    assert.match(pkg.devDependencies?.wrangler ?? '', /^\d+\.\d+\.\d+$/)
  })
})
