import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
// @ts-ignore plain ESM helper used by the CI provisioning script
import { extractJson, findKvNamespace, findD1Database, hasPagesProject, renderWranglerToml } from '../scripts/provision-lib.mjs'

describe('provisioning helpers', () => {
  it('extracts JSON after a wrangler banner and warnings', () => {
    const out = '\n ⛅️ wrangler 4.157.0\n───────────────\n▲ [WARNING] something\n\n[\n  { "id": "abc", "title": "KALMATE_KV" }\n]\n'
    assert.deepEqual(extractJson(out), [{ id: 'abc', title: 'KALMATE_KV' }])
  })

  it('throws when the output has no JSON', () => {
    assert.throws(() => extractJson('✘ [ERROR] Unknown argument: json'))
  })

  it('reuses an existing KV namespace, including the legacy prefixed title', () => {
    assert.equal(findKvNamespace([{ id: '1', title: 'other' }, { id: '2', title: 'KALMATE_KV' }], 'KALMATE_KV')?.id, '2')
    assert.equal(findKvNamespace([{ id: '3', title: 'kalmate-KALMATE_KV' }], 'KALMATE_KV')?.id, '3')
    assert.equal(findKvNamespace([{ id: '4', title: 'NOT_KALMATE_KV_X' }], 'KALMATE_KV'), null)
  })

  it('reads the D1 id from the uuid field', () => {
    assert.deepEqual(findD1Database([{ name: 'kalmate-tickers', uuid: 'u-1' }], 'kalmate-tickers'), { name: 'kalmate-tickers', id: 'u-1' })
    assert.equal(findD1Database([{ name: 'x', uuid: 'u-2' }], 'kalmate-tickers'), null)
  })

  it('detects an existing Pages project', () => {
    assert.equal(hasPagesProject([{ 'Project Name': 'kalmate' }], 'kalmate'), true)
    assert.equal(hasPagesProject([{ 'Project Name': 'other' }], 'kalmate'), false)
  })

  it('renders bindings once, even when run twice', () => {
    const base = 'name = "kalmate"\n'
    const once = renderWranglerToml(base, { kvId: 'k', d1Name: 'kalmate-tickers', d1Id: 'd' })
    const twice = renderWranglerToml(once, { kvId: 'k', d1Name: 'kalmate-tickers', d1Id: 'd' })
    assert.equal(once, twice)
    assert.equal(once.match(/\[\[d1_databases\]\]/g)?.length, 1)
    assert.match(once, /binding = "KALMATE_KV"\nid = "k"/)
  })

  it('the provisioning script only uses flags that wrangler accepts', () => {
    const src = readFileSync('scripts/provision.mjs', 'utf8')
    assert.doesNotMatch(src, /'kv', 'namespace', 'list', '--json'/)
    assert.doesNotMatch(src, /'create', [A-Z0-9_]+, '--json'/)
  })
})
