// Pure helpers for scripts/provision.mjs, kept separate so they can be tested.

/** Extracts the first JSON document from CLI output that may carry banners or warnings. */
export function extractJson(text) {
  const lines = text.split('\n')
  let offset = 0
  for (const line of lines) {
    const first = line.trimStart()[0]
    if (first === '[' || first === '{') {
      const tail = text.slice(offset)
      const end = Math.max(tail.lastIndexOf(']'), tail.lastIndexOf('}'))
      if (end !== -1) {
        try { return JSON.parse(tail.slice(0, end + 1)) } catch { /* keep scanning */ }
      }
    }
    offset += line.length + 1
  }
  throw new Error('No JSON found in wrangler output')
}

/** Finds the KV namespace by title. Older wrangler versions prefixed the title with the project name. */
export function findKvNamespace(list, title) {
  return list.find(n => n.title === title)
    ?? list.find(n => typeof n.title === 'string' && n.title.endsWith(`-${title}`))
    ?? null
}

export function findD1Database(list, name) {
  const db = list.find(d => d.name === name)
  if (!db) return null
  const id = db.uuid ?? db.database_id ?? db.id
  return id ? { name: db.name, id } : null
}

export function hasPagesProject(list, name) {
  return list.some(p => (p['Project Name'] ?? p.name) === name)
}

/** True when wrangler failed because the API token lacks access to that product. */
export function isPermissionError(message) {
  return /Authentication error|code: 10000|not authorized|permission/i.test(message)
}

/** Appends resolved bindings to the committed wrangler.toml, replacing any previous rendered block. */
export function renderWranglerToml(base, { kvId, d1Name, d1Id }) {
  const marker = '# --- provisioned bindings (generated in CI, do not commit) ---'
  const clean = base.split(marker)[0].trimEnd()
  const blocks = []
  if (kvId) blocks.push(`[[kv_namespaces]]\nbinding = "KALMATE_KV"\nid = "${kvId}"`)
  if (d1Id) blocks.push(`[[d1_databases]]\nbinding = "TICKERS_DB"\ndatabase_name = "${d1Name}"\ndatabase_id = "${d1Id}"\nmigrations_dir = "migrations"`)
  return `${clean}\n\n${marker}\n${blocks.join('\n\n')}${blocks.length ? '\n' : ''}`
}
