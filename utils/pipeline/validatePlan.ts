import type { NodeDefinition } from './types.ts'

export interface RawPlanNode {
  type: string
  data: Record<string, any>
}

export interface RawPlanEdge {
  source: number
  target: number
  sourceHandle: string
  targetHandle: string
}

export interface RawPlan {
  nodes: RawPlanNode[]
  edges: RawPlanEdge[]
}

export interface ValidatedPlan {
  nodes: RawPlanNode[]
  edges: RawPlanEdge[]
  warnings: string[]
}

// portfolioInput accepts extra operandC/operandD/... beyond its static
// definition (dynamicInputs: true) — anything matching this shape is valid
// on that node type regardless of what's listed in its NodeDefinition.
const DYNAMIC_OPERAND = /^operand[A-Za-z]$/

// An LLM-generated pipeline is not trustworthy input: it may reference node
// types that don't exist, or handle ids that don't belong to the node it
// named. This never throws — it drops whatever doesn't check out and
// reindexes edges to the surviving nodes, the same "degrade, don't crash"
// approach the pipeline executor itself already uses for bad input.
export function validatePipelinePlan(plan: RawPlan, nodeDefinitions: NodeDefinition[]): ValidatedPlan {
  const defsByType = new Map(nodeDefinitions.map(d => [d.type, d]))
  const warnings: string[] = []

  const rawNodes = Array.isArray(plan?.nodes) ? plan.nodes : []
  const rawEdges = Array.isArray(plan?.edges) ? plan.edges : []

  const nodes: RawPlanNode[] = []
  const oldToNewIndex = new Map<number, number>()

  rawNodes.forEach((node, i) => {
    if (!node || typeof node.type !== 'string' || !defsByType.has(node.type)) {
      warnings.push(`Dropped node at index ${i}: unknown type ${JSON.stringify(node?.type)}`)
      return
    }
    oldToNewIndex.set(i, nodes.length)
    nodes.push({ type: node.type, data: (node.data && typeof node.data === 'object') ? node.data : {} })
  })

  const edges: RawPlanEdge[] = []

  for (const edge of rawEdges) {
    if (!edge || typeof edge.source !== 'number' || typeof edge.target !== 'number') {
      warnings.push(`Dropped malformed edge: ${JSON.stringify(edge)}`)
      continue
    }
    const newSource = oldToNewIndex.get(edge.source)
    const newTarget = oldToNewIndex.get(edge.target)
    if (newSource === undefined || newTarget === undefined) {
      warnings.push(`Dropped edge ${edge.source}->${edge.target}: references a dropped or out-of-range node`)
      continue
    }

    const sourceDef = defsByType.get(rawNodes[edge.source].type)!
    const targetDef = defsByType.get(rawNodes[edge.target].type)!

    const validSourceHandle = sourceDef.outputs.some(o => o.id === edge.sourceHandle)
    if (!validSourceHandle) {
      warnings.push(`Dropped edge: "${edge.sourceHandle}" is not an output of ${sourceDef.type} (valid: ${sourceDef.outputs.map(o => o.id).join(', ') || 'none'})`)
      continue
    }

    const validTargetHandle = targetDef.inputs.some(i => i.id === edge.targetHandle)
      || (targetDef.dynamicInputs && DYNAMIC_OPERAND.test(edge.targetHandle))
    if (!validTargetHandle) {
      warnings.push(`Dropped edge: "${edge.targetHandle}" is not an input of ${targetDef.type} (valid: ${targetDef.inputs.map(i => i.id).join(', ') || 'none'})`)
      continue
    }

    edges.push({ source: newSource, target: newTarget, sourceHandle: edge.sourceHandle, targetHandle: edge.targetHandle })
  }

  return { nodes, edges, warnings }
}
