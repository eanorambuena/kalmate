import { nodeDefinitions } from './nodeDefinitions.ts'
import { isForecastModel } from '../forecasting.ts'

/** Handles renamed since pipelines were saved, keyed by node type, then by old handle. */
const RENAMED_TARGETS: Record<string, Record<string, string>> = {
  chartOutput: { series: 'mainSeries', overlay1: 'overlayA', overlay2: 'overlayB', overlay3: 'overlayC' },
  candleChart: { overlay1: 'overlayA', overlay2: 'overlayB', overlay3: 'overlayC' },
  alertOutput: { signal: 'value' },
}

const RENAMED_SOURCES: Record<string, Record<string, string>> = {
  kalmanFilter: { trend: 'smoothed' },
}

export interface MigratedPipeline {
  nodes: any[]
  edges: any[]
  counter: number
  autorun: boolean
}

const OPERAND = /^operand([A-Z])$/i
const INDEXED = /^in\d+$/

function renameTarget(type: string, handle: unknown): unknown {
  if (typeof handle !== 'string') return handle
  if (type === 'portfolioInput') {
    const m = OPERAND.exec(handle)
    if (m) return `in${m[1]!.toUpperCase().charCodeAt(0) - 65}`
  }
  return RENAMED_TARGETS[type]?.[handle] ?? handle
}

/**
 * Brings a saved pipeline up to the current node set. Results are never
 * persisted, removed node types are dropped with their edges, renamed
 * handles are mapped, and edges that no longer match a definition are
 * removed. Running it twice gives the same result as running it once.
 */
export function migratePipeline(saved: any): MigratedPipeline {
  const savedNodes: any[] = Array.isArray(saved?.nodes) ? saved.nodes : []
  const savedEdges: any[] = Array.isArray(saved?.edges) ? saved.edges : []
  const defs = new Map(nodeDefinitions.map(d => [d.type, d]))

  const nodes: any[] = []
  for (const n of savedNodes) {
    const type = n?.data?.type
    if (typeof n?.id !== 'string' || typeof type !== 'string' || !defs.has(type)) continue
    const { result: _result, ...data } = n.data
    if (type === 'forecastNode') {
      if (!isForecastModel(data.model)) data.model = isForecastModel(data.algorithm) ? data.algorithm : 'auto'
      delete data.algorithm
    }
    nodes.push({ ...n, data })
  }

  const nodeById = new Map(nodes.map(n => [n.id, n]))
  const edges: { id: string; source: string; target: string; sourceHandle: string; targetHandle: string }[] = []
  for (const e of savedEdges) {
    if (typeof e?.source !== 'string' || typeof e?.target !== 'string') continue
    const src = nodeById.get(e.source)
    const tgt = nodeById.get(e.target)
    if (!src || !tgt) continue
    const srcType: string = src.data.type
    const tgtType: string = tgt.data.type
    const sourceHandle = (RENAMED_SOURCES[srcType]?.[e.sourceHandle] ?? e.sourceHandle) as unknown
    const targetHandle = renameTarget(tgtType, e.targetHandle)
    if (typeof sourceHandle !== 'string' || typeof targetHandle !== 'string') continue
    const srcDef = defs.get(srcType)!
    const tgtDef = defs.get(tgtType)!
    if (!srcDef.outputs.some(o => o.id === sourceHandle)) continue
    const accepted = tgtDef.inputs.some(i => i.id === targetHandle)
      || (tgtDef.dynamicInputs === true && INDEXED.test(targetHandle))
    if (!accepted) continue
    edges.push({
      id: `e-${e.source}-${sourceHandle}-${e.target}-${targetHandle}`,
      source: e.source,
      target: e.target,
      sourceHandle,
      targetHandle,
    })
  }

  // Keep only the last edge into each (target, targetHandle), as the editor does.
  const keyOf = (e: { target: string; targetHandle: string }) => `${e.target}\u0000${e.targetHandle}`
  const lastIndex = new Map<string, number>()
  edges.forEach((e, i) => lastIndex.set(keyOf(e), i))
  const kept = edges.filter((e, i) => lastIndex.get(keyOf(e)) === i)

  let counter = Number.isFinite(saved?.counter) ? saved.counter : 0
  for (const n of savedNodes) {
    const m = /-(\d+)$/.exec(String(n?.id ?? ''))
    if (m) counter = Math.max(counter, Number(m[1]))
  }

  return {
    nodes,
    edges: kept,
    counter,
    autorun: typeof saved?.autorun === 'boolean' ? saved.autorun : true,
  }
}
