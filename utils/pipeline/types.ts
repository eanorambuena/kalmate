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

export interface NodePort {
  id: string
  label: string
  type: 'any' | 'symbol' | 'price' | 'series' | 'signal'
}

export interface NodeDefinition {
  type: string
  label: string
  category: 'input' | 'process' | 'output'
  color: string
  pro: boolean
  inputs: NodePort[]
  outputs: NodePort[]
  defaultData: Record<string, any>
}

export interface ExecutionContext {
  nodeId: string
  inputs: Record<string, any>
  data: Record<string, any>
}

export type NodeExecutor = (ctx: ExecutionContext) => any | Promise<any>
