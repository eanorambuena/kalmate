import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { templates } from '../utils/pipeline/templates.ts'
import { nodeDefinitions } from '../utils/pipeline/nodeDefinitions.ts'
import { connectionAllowed } from '../utils/pipeline/graph.ts'
import { executePipeline } from '../utils/pipeline/runner.ts'

const DAY_S = 86_400
const START_S = Date.UTC(2024, 0, 2) / 1000

/** 400 daily candles with timestamps in seconds, as the history route returns them. */
function candles(n = 400) {
  const out: { timestamp: number; open: number; high: number; low: number; close: number }[] = []
  let price = 100
  for (let i = 0; i < n; i++) {
    price *= 1 + 0.002 * Math.sin(i / 9) + 0.0006
    out.push({
      timestamp: START_S + i * DAY_S,
      open: price * 0.99,
      high: price * 1.01,
      low: price * 0.98,
      close: price,
    })
  }
  return out
}

/** 24 quarterly fundamentals points, plus the current values. */
function fundamentalsHistory() {
  const points = Array.from({ length: 24 }, (_, i) => {
    const year = 2020 + Math.floor(i / 4)
    const month = ['03-31', '06-30', '09-30', '12-31'][i % 4]
    return { asOf: `${year}-${month}`, eps: 1 + i * 0.05, bookValuePerShare: 10 + i * 0.2 }
  })
  return { points, current: { eps: 2.5, bookValuePerShare: 15 } }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

const originalFetch = globalThis.fetch

before(() => {
  globalThis.fetch = (async (input: any) => {
    const url = String(input)
    if (url.startsWith('/api/history')) return jsonResponse(candles())
    if (url.startsWith('/api/fundamentals/history')) return jsonResponse(fundamentalsHistory())
    return jsonResponse({ statusMessage: `Unmocked ${url}` }, 404)
  }) as typeof fetch
})

after(() => {
  globalThis.fetch = originalFetch
})

/** Turns a template plan into the node and edge lists the editor would create. */
function materialize(plan: (typeof templates)[number]['plan']) {
  const nodes = plan.nodes.map((n, i) => ({
    id: `${n.type}-${i + 1}`,
    type: 'custom',
    position: { x: 0, y: i * 10 },
    data: { ...(nodeDefinitions.find(d => d.type === n.type)?.defaultData ?? {}), ...(n.data ?? {}), type: n.type },
  }))
  const edges = plan.edges.map(e => ({
    id: `e-${nodes[e.source]!.id}-${e.sourceHandle}-${nodes[e.target]!.id}-${e.targetHandle}`,
    source: nodes[e.source]!.id,
    target: nodes[e.target]!.id,
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
  }))
  return { nodes, edges }
}

describe('pipeline templates', () => {
  it('provides the four templates with unique ids', () => {
    assert.deepEqual(
      templates.map(t => t.id),
      ['price-and-trend', 'forecast', 'valuation', 'compare-two-assets'],
    )
    assert.equal(new Set(templates.map(t => t.id)).size, templates.length)
  })

  for (const t of templates) {
    describe(t.name, () => {
      it('has a name and a one-line description', () => {
        assert.ok(t.name.trim().length > 0)
        assert.ok(t.description.trim().length > 0)
        assert.ok(!t.description.includes('\n'))
      })

      it('uses only node types that exist', () => {
        for (const n of t.plan.nodes) {
          assert.ok(nodeDefinitions.some(d => d.type === n.type), `unknown node type ${n.type}`)
        }
      })

      it('connects only existing handles with compatible port types', () => {
        const { nodes, edges } = materialize(t.plan)
        for (const e of edges) {
          const ok = connectionAllowed(
            { source: e.source, sourceHandle: e.sourceHandle, target: e.target, targetHandle: e.targetHandle },
            nodes,
          )
          assert.equal(ok, true, `edge ${e.id} is not allowed`)
        }
      })

      it('has at most one edge into each input', () => {
        const seen = new Set<string>()
        for (const e of t.plan.edges) {
          const key = `${e.target}:${e.targetHandle}`
          assert.ok(!seen.has(key), `two edges into ${key}`)
          seen.add(key)
        }
      })

      it('is marked pro exactly when it uses a pro node', () => {
        const usesPro = t.plan.nodes.some(n => nodeDefinitions.find(d => d.type === n.type)?.pro === true)
        assert.equal(t.pro, usesPro)
      })

      it('runs with no node returning an error', async () => {
        const { nodes, edges } = materialize(t.plan)
        const results = await executePipeline({
          nodes: nodes.map(n => ({ id: n.id, type: n.data.type, position: n.position, data: n.data })),
          edges,
        })
        for (const n of nodes) {
          const r = results[n.id]
          assert.ok(r, `no result for ${n.id}`)
          assert.equal(r.error, undefined, `${n.id} (${n.data.type}) failed: ${r.error}`)
        }
      })
    })
  }
})
