// Idempotent infrastructure provisioning for CI.
// Ensures the Pages project, the KV namespace and the D1 database exist, then
// writes wrangler.toml with their real ids (the committed file keeps no ids).
// Requires CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID in the environment.
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { extractJson, findKvNamespace, findD1Database, hasPagesProject, renderWranglerToml } from './provision-lib.mjs'

const PROJECT = 'kalmate'
const KV_TITLE = 'KALMATE_KV'
const D1_NAME = 'kalmate-tickers'

function wrangler(args) {
  try {
    return execFileSync('./node_modules/.bin/wrangler', args, { encoding: 'utf8', env: process.env, stdio: ['ignore', 'pipe', 'pipe'] })
  } catch (err) {
    const detail = `${err.stdout ?? ''}\n${err.stderr ?? ''}`.trim().split('\n').slice(-15).join('\n')
    throw new Error(`wrangler ${args.join(' ')} failed:\n${detail}`)
  }
}

// `kv namespace list` prints JSON by default; `d1 list` and `pages project list` need --json.
const listKv = () => extractJson(wrangler(['kv', 'namespace', 'list']))
const listD1 = () => extractJson(wrangler(['d1', 'list', '--json']))
const listPages = () => extractJson(wrangler(['pages', 'project', 'list', '--json']))

function ensureKv() {
  let ns = findKvNamespace(listKv(), KV_TITLE)
  if (!ns) {
    wrangler(['kv', 'namespace', 'create', KV_TITLE])
    ns = findKvNamespace(listKv(), KV_TITLE)
    if (!ns) throw new Error(`KV namespace ${KV_TITLE} not found after create`)
    console.log(`kv namespace created: ${ns.title}`)
  } else {
    console.log(`kv namespace exists: ${ns.title}`)
  }
  return ns.id
}

function ensureD1() {
  let db = findD1Database(listD1(), D1_NAME)
  if (!db) {
    wrangler(['d1', 'create', D1_NAME])
    db = findD1Database(listD1(), D1_NAME)
    if (!db) throw new Error(`D1 database ${D1_NAME} not found after create`)
    console.log(`d1 database created: ${D1_NAME}`)
  } else {
    console.log(`d1 database exists: ${D1_NAME}`)
  }
  return db.id
}

function ensurePagesProject() {
  if (hasPagesProject(listPages(), PROJECT)) {
    console.log(`pages project exists: ${PROJECT}`)
    return
  }
  wrangler(['pages', 'project', 'create', PROJECT, '--production-branch', 'main'])
  console.log(`pages project created: ${PROJECT}`)
}

ensurePagesProject()
const kvId = ensureKv()
const d1Id = ensureD1()
writeFileSync('wrangler.toml', renderWranglerToml(readFileSync('wrangler.toml', 'utf8'), { kvId, d1Name: D1_NAME, d1Id }))
console.log('wrangler.toml rendered with provisioned ids')
