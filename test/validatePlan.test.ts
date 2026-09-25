import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { validatePipelinePlan } from '../utils/pipeline/validatePlan.ts'
import { nodeDefinitions } from '../utils/pipeline/nodeDefinitions.ts'

describe('validatePipelinePlan', () => {
  it('passes a well-formed plan through unchanged, with no warnings', () => {
    const plan = {
      nodes: [
        { type: 'symbolInput', data: { symbol: 'AAPL' } },
        { type: 'priceFeed', data: {} },
        { type: 'chartOutput', data: {} },
      ],
      edges: [
        { source: 0, target: 1, sourceHandle: 'symbol', targetHandle: 'symbol' },
        { source: 1, target: 2, sourceHandle: 'priceSeries', targetHandle: 'mainSeries' },
      ],
    }
    const result = validatePipelinePlan(plan, nodeDefinitions)
    assert.equal(result.nodes.length, 3)
    assert.equal(result.edges.length, 2)
    assert.deepEqual(result.warnings, [])
  })

  it('drops a node with an invented type and warns', () => {
    const plan = {
      nodes: [
        { type: 'symbolInput', data: { symbol: 'AAPL' } },
        { type: 'macdIndicator', data: {} }, // hallucinated — doesn't exist
        { type: 'chartOutput', data: {} },
      ],
      edges: [],
    }
    const result = validatePipelinePlan(plan, nodeDefinitions)
    assert.equal(result.nodes.length, 2)
    assert.ok(result.nodes.every(n => n.type !== 'macdIndicator'))
    assert.ok(result.warnings.some(w => w.includes('macdIndicator')))
  })

  it('drops edges to/from a dropped node and reindexes the surviving edges', () => {
    const plan = {
      nodes: [
        { type: 'symbolInput', data: { symbol: 'AAPL' } },
        { type: 'fakeNode', data: {} }, // index 1, gets dropped
        { type: 'priceFeed', data: {} }, // index 2 -> becomes index 1
        { type: 'chartOutput', data: {} }, // index 3 -> becomes index 2
      ],
      edges: [
        { source: 0, target: 1, sourceHandle: 'symbol', targetHandle: 'whatever' }, // references dropped node -> dropped
        { source: 0, target: 2, sourceHandle: 'symbol', targetHandle: 'symbol' }, // 0->2 becomes 0->1
        { source: 2, target: 3, sourceHandle: 'priceSeries', targetHandle: 'mainSeries' }, // 2->3 becomes 1->2
      ],
    }
    const result = validatePipelinePlan(plan, nodeDefinitions)
    assert.equal(result.nodes.length, 3)
    assert.equal(result.nodes[0].type, 'symbolInput')
    assert.equal(result.nodes[1].type, 'priceFeed')
    assert.equal(result.nodes[2].type, 'chartOutput')
    assert.equal(result.edges.length, 2)
    assert.deepEqual(result.edges[0], { source: 0, target: 1, sourceHandle: 'symbol', targetHandle: 'symbol' })
    assert.deepEqual(result.edges[1], { source: 1, target: 2, sourceHandle: 'priceSeries', targetHandle: 'mainSeries' })
  })

  it('drops an edge whose sourceHandle does not exist on the source node type', () => {
    const plan = {
      nodes: [
        { type: 'priceFeed', data: {} },
        { type: 'chartOutput', data: {} },
      ],
      edges: [
        { source: 0, target: 1, sourceHandle: 'closePrice', targetHandle: 'mainSeries' }, // priceFeed has no "closePrice" output
      ],
    }
    const result = validatePipelinePlan(plan, nodeDefinitions)
    assert.equal(result.edges.length, 0)
    assert.ok(result.warnings.some(w => w.includes('closePrice')))
  })

  it('drops an edge whose targetHandle does not exist on the target node type', () => {
    const plan = {
      nodes: [
        { type: 'priceFeed', data: {} },
        { type: 'chartOutput', data: {} },
      ],
      edges: [
        { source: 0, target: 1, sourceHandle: 'priceSeries', targetHandle: 'overlayZ' }, // chartOutput has no "overlayZ" input
      ],
    }
    const result = validatePipelinePlan(plan, nodeDefinitions)
    assert.equal(result.edges.length, 0)
    assert.ok(result.warnings.some(w => w.includes('overlayZ')))
  })

  it('accepts dynamic operandC/operandD handles on portfolioInput even though not statically listed', () => {
    const plan = {
      nodes: [
        { type: 'scalarInput', data: { value: 1 } },
        { type: 'portfolioInput', data: { weights: [1, 1, 1] } },
      ],
      edges: [
        { source: 0, target: 1, sourceHandle: 'scalar', targetHandle: 'operandC' },
      ],
    }
    const result = validatePipelinePlan(plan, nodeDefinitions)
    assert.equal(result.edges.length, 1)
    assert.deepEqual(result.warnings, [])
  })

  it('still rejects a non-operand handle on portfolioInput', () => {
    const plan = {
      nodes: [
        { type: 'scalarInput', data: { value: 1 } },
        { type: 'portfolioInput', data: { weights: [1, 1] } },
      ],
      edges: [
        { source: 0, target: 1, sourceHandle: 'scalar', targetHandle: 'notAnOperand' },
      ],
    }
    const result = validatePipelinePlan(plan, nodeDefinitions)
    assert.equal(result.edges.length, 0)
  })

  it('drops malformed edges (missing numeric source/target) without throwing', () => {
    const plan = {
      nodes: [{ type: 'priceFeed', data: {} }, { type: 'chartOutput', data: {} }],
      edges: [{ source: 'zero', target: 1, sourceHandle: 'priceSeries', targetHandle: 'mainSeries' }],
    }
    const result = validatePipelinePlan(plan as any, nodeDefinitions)
    assert.equal(result.edges.length, 0)
  })

  it('handles a plan with no nodes/edges gracefully', () => {
    const result = validatePipelinePlan({ nodes: [], edges: [] }, nodeDefinitions)
    assert.deepEqual(result, { nodes: [], edges: [], warnings: [] })
  })

  it('handles malformed top-level input (missing arrays) without throwing', () => {
    const result = validatePipelinePlan({} as any, nodeDefinitions)
    assert.deepEqual(result.nodes, [])
    assert.deepEqual(result.edges, [])
  })
})
