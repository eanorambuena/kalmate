// Idempotent infrastructure provisioning for CI.
// Ensures the Pages project, the KV namespace and the D1 database exist,
// then writes wrangler.toml with their real ids (the committed file keeps no ids).
// Requires CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID in the environment.
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

const PROJECT = 'kalmate'
const KV_TITLE = 'KALMATE_KV'
const D1_NAME = 'kalmate-tickers'

function wrangler(args) {
  return execFileSync('npx', ['--no-install', 'wrangler', ...args], {
    encoding: 'utf8',
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

function json(args) {
  const out = wrangler([...args, '--json'])
  const start = out.search(/[\[{]/)
  return JSON.parse(out.slice(start))
}

function ensurePagesProject() {
  try {
    wrangler(['pages', 'project', 'create', PROJECT, '--production-branch', 'main'])
    console.log(`pages project created: ${PROJECT}`)
  } catch {
    console.log(`pages project exists: ${PROJECT}`)
  }
}

function ensureKv() {
  const list = json(['kv', 'namespace', 'list'])
  let ns = list.find(n => n.title === KV_TITLE || n.title?.endsWith(`-${KV_TITLE}`))
  if (!ns) {
    const created = json(['kv', 'namespace', 'create', KV_TITLE])
    ns = created.id ? created : list.find(n => n.title?.endsWith(KV_TITLE))
    console.log(`kv namespace created: ${KV_TITLE}`)
  } else {
    console.log(`kv namespace exists: ${KV_TITLE}`)
  }
  return ns.id
}

function ensureD1() {
  const list = json(['d1', 'list'])
  let db = list.find(d => d.name === D1_NAME)
  if (!db) {
    db = json(['d1', 'create', D1_NAME])
    console.log(`d1 database created: ${D1_NAME}`)
  } else {
    console.log(`d1 database exists: ${D1_NAME}`)
  }
  return db.uuid ?? db.id ?? db.database_id
}

const kvId = ensureKv()
const d1Id = ensureD1()
ensurePagesProject()

const base = readFileSync('wrangler.toml', 'utf8').replace(/# Ticker cache[\s\S]*$/m, '').trimEnd()
const bindings = `

[[kv_namespaces]]
binding = "KALMATE_KV"
id = "${kvId}"

[[d1_databases]]
binding = "TICKERS_DB"
database_name = "${D1_NAME}"
database_id = "${d1Id}"
`
writeFileSync('wrangler.toml', base + bindings)
console.log('wrangler.toml rendered with provisioned ids')
