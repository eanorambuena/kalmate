export interface PipelineNode {
  id: string
  type: string
  position: { x: number; y: number }
  data: Record<string, any>
}

export interface PipelineEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
}

export interface PipelineSpec {
  nodes: PipelineNode[]
  edges: PipelineEdge[]
}

export type PortType = 'any' | 'symbol' | 'price' | 'series' | 'signal' | 'scalar'

/** How a value should be read and displayed. `percent` values are fractions (0.0234 = 2.34%). */
export type Unit = 'price' | 'percent' | 'ratio' | 'index' | 'number' | 'money' | 'text'

export interface NodePort {
  id: string
  label: string
  type: PortType
  unit?: Unit
}

export interface NodeParam {
  key: string
  label: string
  kind: 'number' | 'text' | 'select' | 'date'
  options?: { value: string; label: string }[]
  min?: number
  max?: number
  step?: number
  placeholder?: string
}

export interface NodeDefinition {
  type: string
  label: string
  description: string
  category: 'input' | 'process' | 'output'
  color: string
  pro: boolean
  inputs: NodePort[]
  outputs: NodePort[]
  defaultData: Record<string, any>
  params?: NodeParam[]
  /** Result key shown as the node's headline value, and its unit. */
  primary?: { key: string; unit: Unit }
  /** When true, the node UI lets the user add/remove inputs (see CustomNode.vue). */
  dynamicInputs?: boolean
}

/** Unit and human label of a value connected to one target handle. */
export interface InputMeta {
  unit?: Unit
  label: string
}

export interface ExecutionContext {
  nodeId: string
  inputs: Record<string, any>
  data: Record<string, any>
  /** Per target handle: unit and human label ("<source node label> · <port label>") of what is connected. */
  meta?: Record<string, InputMeta>
}

export type NodeExecutor = (ctx: ExecutionContext) => any | Promise<any>
