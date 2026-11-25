import { nodeDefinitions } from './nodeDefinitions.ts'
import type { NodeDefinition, NodePort } from './types.ts'
import { canConnect } from './values.ts'

/** A pipeline plan as produced by the local generator or the AI endpoint. */
export interface PlanNode {
  type: string
  data?: Record<string, any>
}

export interface PlanEdge {
  source: number
  target: number
  sourceHandle: string
  targetHandle: string
}

export interface Plan {
  nodes: PlanNode[]
  edges: PlanEdge[]
}

export type PlanCheck = { ok: true } | { ok: false; reason: string }

const definitions = new Map<string, NodeDefinition>(nodeDefinitions.map(d => [d.type, d]))

/** portfolioInput accepts any number of inputs named in0, in1, ... */
const WEIGHTED_INPUT = /^in\d+$/

function findInput(def: NodeDefinition, handle: string): NodePort | undefined {
  const declared = def.inputs.find(p => p.id === handle)
  if (declared) return declared
  if (def.dynamicInputs && WEIGHTED_INPUT.test(handle)) return { id: handle, label: handle, type: 'any' }
  return undefined
}

function isPlainObject(x: unknown): x is Record<string, any> {
  return typeof x === 'object' && x !== null && !Array.isArray(x)
}

/**
 * Checks a plan against the node definitions: known node types, declared ports,
 * compatible port types, valid indices, and at most one edge per input.
 */
export function validatePlan(plan: any): PlanCheck {
  if (!isPlainObject(plan)) return { ok: false, reason: 'Plan is not an object' }
  const { nodes, edges } = plan
  if (!Array.isArray(nodes) || nodes.length === 0) return { ok: false, reason: 'Plan has no nodes' }
  if (!Array.isArray(edges)) return { ok: false, reason: 'Plan has no edge list' }

  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i]
    if (!isPlainObject(n) || typeof n.type !== 'string') return { ok: false, reason: `Node ${i} has no type` }
    if (!definitions.has(n.type)) return { ok: false, reason: `Unknown node type "${n.type}"` }
    if (n.data !== undefined && !isPlainObject(n.data)) return { ok: false, reason: `Node ${i} data is not an object` }
  }

  const taken = new Set<string>()
  for (let i = 0; i < edges.length; i++) {
    const e = edges[i]
    if (!isPlainObject(e)) return { ok: false, reason: `Edge ${i} is not an object` }
    const valid = (x: unknown) => Number.isInteger(x) && (x as number) >= 0 && (x as number) < nodes.length
    if (!valid(e.source) || !valid(e.target)) return { ok: false, reason: `Edge ${i} points outside the node list` }
    if (e.source === e.target) return { ok: false, reason: `Edge ${i} connects a node to itself` }

    const srcDef = definitions.get(nodes[e.source].type)!
    const tgtDef = definitions.get(nodes[e.target].type)!

    const out = typeof e.sourceHandle === 'string' ? srcDef.outputs.find(p => p.id === e.sourceHandle) : undefined
    if (!out) return { ok: false, reason: `"${srcDef.type}" has no output "${e.sourceHandle}"` }

    const inp = typeof e.targetHandle === 'string' ? findInput(tgtDef, e.targetHandle) : undefined
    if (!inp) return { ok: false, reason: `"${tgtDef.type}" has no input "${e.targetHandle}"` }

    if (!canConnect(out.type, inp.type)) {
      return { ok: false, reason: `Cannot connect ${out.type} to ${inp.type} (${srcDef.type}.${out.id} → ${tgtDef.type}.${inp.id})` }
    }

    const key = `${e.target}:${e.targetHandle}`
    if (taken.has(key)) return { ok: false, reason: `Input "${e.targetHandle}" of node ${e.target} has two edges` }
    taken.add(key)
  }

  return { ok: true }
}

function describePort(p: NodePort): string {
  return `${p.id} (${p.type}${p.unit ? `, ${p.unit}` : ''})`
}

function describeParam(p: NonNullable<NodeDefinition['params']>[number]): string {
  const parts = [`${p.key}: ${p.kind}`]
  if (p.options) parts.push(`one of ${p.options.map(o => o.value).join(', ')}`)
  if (p.min !== undefined || p.max !== undefined) parts.push(`range ${p.min ?? '-'}..${p.max ?? '-'}`)
  return parts.join(', ')
}

/**
 * The node catalogue for the AI prompt, generated from nodeDefinitions so the
 * handle ids and params always match what the editor and executors use.
 */
export function buildNodeCatalog(): string {
  return nodeDefinitions.map(def => {
    const ins = def.inputs.length ? def.inputs.map(describePort).join('; ') : 'none'
    const outs = def.outputs.length ? def.outputs.map(describePort).join('; ') : 'none'
    const params = def.params?.length ? def.params.map(describeParam).join(' | ') : 'none'
    const defaults = JSON.stringify(def.defaultData)
    return [
      `- type "${def.type}" (${def.label}, ${def.category}): ${def.description}`,
      `    inputs: ${ins}`,
      `    outputs: ${outs}`,
      `    params: ${params}; defaults ${defaults}`,
    ].join('\n')
  }).join('\n')
}
