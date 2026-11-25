import { nodeDefinitions } from './nodeDefinitions.ts'
import type { NodeDefinition } from './types.ts'
import { canConnect } from './values.ts'

/** Minimal node/edge shapes shared by the editor and the pure helpers. */
export interface GraphNode {
  id: string
  type?: string
  position?: { x: number; y: number }
  data?: Record<string, any>
  [key: string]: any
}

export interface GraphEdge {
  id?: string
  source: string
  target: string
  sourceHandle?: string | null
  targetHandle?: string | null
  [key: string]: any
}

export interface Connection {
  source: string
  target: string
  sourceHandle?: string | null
  targetHandle?: string | null
}

const SIGNATURE_EXCLUDED_KEYS = ['label', 'result', 'pro'] as const
/** Vue Flow bookkeeping that must not be persisted. */
const VUE_FLOW_INTERNAL_KEYS = ['dimensions', 'handleBounds', 'computedPosition', 'positionAbsolute', 'selected', 'dragging', 'resizing', 'initialized', 'isParent'] as const
const WEIGHTED_INPUT = /^in\d+$/

export function edgeId(source: string, sourceHandle: string | null | undefined, target: string, targetHandle: string | null | undefined): string {
  return `e-${source}-${sourceHandle}-${target}-${targetHandle}`
}

const stripHiddenPrefix = (handle: string | null | undefined): string => (handle ?? '').replace(/^(left|right):/, '')

/**
 * Vue Flow reports a few drags with the hidden `left:` / `right:` handles
 * (a drag that starts on an input). Those are turned into the regular
 * output-to-input direction, so the stored edge is always source → target.
 */
export function normalizeConnection(conn: Connection): Connection {
  const sh = conn.sourceHandle ?? ''
  const th = conn.targetHandle ?? ''
  if (sh.startsWith('left:') || th.startsWith('right:')) {
    return {
      source: conn.target,
      target: conn.source,
      sourceHandle: stripHiddenPrefix(th),
      targetHandle: stripHiddenPrefix(sh),
    }
  }
  return {
    source: conn.source,
    target: conn.target,
    sourceHandle: stripHiddenPrefix(sh),
    targetHandle: stripHiddenPrefix(th),
  }
}

function stableStringify(value: any): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null'
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  const keys = Object.keys(value).sort()
  return `{${keys.map(k => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`
}

/**
 * A string that changes only when something that affects results changes:
 * node ids, types and parameters, and edge endpoints. Positions, labels,
 * results and the pro flag are left out, as is the order of the edges.
 */
export function graphSignature(nodes: GraphNode[], edges: GraphEdge[]): string {
  const ns = nodes
    .map(n => {
      const data: Record<string, any> = {}
      for (const [k, v] of Object.entries(n.data ?? {})) {
        if (!(SIGNATURE_EXCLUDED_KEYS as readonly string[]).includes(k) && k !== 'type') data[k] = v
      }
      return { id: n.id, type: n.data?.type ?? n.type ?? null, data }
    })
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
  const es = edges
    .map(e => [e.source, e.sourceHandle ?? null, e.target, e.targetHandle ?? null])
    .map(e => stableStringify(e))
    .sort()
  return stableStringify({ nodes: ns, edges: es })
}

function definitionOf(node: GraphNode | undefined): NodeDefinition | undefined {
  const type = node?.data?.type ?? node?.type
  return type ? nodeDefinitions.find(d => d.type === type) : undefined
}

/**
 * Whether a connection may be created. Refuses self connections, handles the
 * node does not have, and incompatible port types. Weighted Average accepts
 * any `in<N>` input.
 */
export function connectionAllowed(conn: Connection, nodes: GraphNode[], _edges: GraphEdge[] = []): boolean {
  const c = normalizeConnection(conn)
  if (!c.source || !c.target || c.source === c.target) return false
  const sourceDef = definitionOf(nodes.find(n => n.id === c.source))
  const targetDef = definitionOf(nodes.find(n => n.id === c.target))
  if (!sourceDef || !targetDef) return false

  const output = sourceDef.outputs.find(o => o.id === c.sourceHandle)
  if (!output) return false

  const input = targetDef.inputs.find(i => i.id === c.targetHandle)
  const indexed = targetDef.dynamicInputs === true && WEIGHTED_INPUT.test(c.targetHandle ?? '')
  if (!input && !indexed) return false

  return canConnect(output.type, input?.type ?? 'any')
}

/**
 * Adds a connection and enforces one edge per input: an existing edge into
 * the same (target, targetHandle) is replaced. Returns a new array.
 */
export function withConnection<E extends GraphEdge>(edges: E[], conn: Connection): (E | GraphEdge)[] {
  const c = normalizeConnection(conn)
  const id = edgeId(c.source, c.sourceHandle, c.target, c.targetHandle)
  const kept = edges.filter(e => e.id !== id && !(e.target === c.target && e.targetHandle === c.targetHandle))
  return [
    ...kept,
    {
      id,
      source: c.source,
      target: c.target,
      sourceHandle: c.sourceHandle,
      targetHandle: c.targetHandle,
      style: { stroke: '#555', strokeWidth: 2 },
    },
  ]
}

/** Nodes as they are saved: results and Vue Flow bookkeeping removed. Input is not mutated. */
export function stripResults<N extends GraphNode>(nodes: N[]): N[] {
  return nodes.map(n => {
    const out: Record<string, any> = { ...n }
    for (const k of VUE_FLOW_INTERNAL_KEYS) delete out[k]
    if (n.data && 'result' in n.data) {
      const { result: _result, ...data } = n.data
      out.data = data
    }
    return out as N
  })
}

/**
 * Edges as they are saved: only the endpoints and handles. Vue Flow attaches
 * the full source and target node objects (with their results) to each edge,
 * so saving edges as they are would store every result again.
 */
export function stripEdges<E extends GraphEdge>(edges: E[]): { id: string; source: string; target: string; sourceHandle: string | null; targetHandle: string | null }[] {
  return edges.map(e => ({
    id: e.id ?? edgeId(e.source, e.sourceHandle, e.target, e.targetHandle),
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle ?? null,
    targetHandle: e.targetHandle ?? null,
  }))
}
