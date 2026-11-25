import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  edgeId,
  graphSignature,
  connectionAllowed,
  withConnection,
  stripResults,
  normalizeConnection,
  stripEdges,
} from '../utils/pipeline/graph.ts'

const node = (id: string, type: string, data: Record<string, any> = {}, position = { x: 0, y: 0 }) => ({
  id,
  type: 'custom',
  position,
  data: { type, label: `${type} ${id}`, ...data },
})

const sym = node('sym-1', 'symbolInput', { symbol: 'AAPL' })
const feed = node('priceFeed-2', 'priceFeed')
const sma = node('smaIndicator-3', 'smaIndicator', { period: 20 })
const chart = node('chartOutput-4', 'chartOutput')
const wavg = node('portfolioInput-5', 'portfolioInput', { weights: [1, 1] })
const scalar = node('scalarInput-6', 'scalarInput', { value: 2 })

describe('edgeId', () => {
  it('builds e-<source>-<sourceHandle>-<target>-<targetHandle>', () => {
    assert.equal(edgeId('a', 'out', 'b', 'in'), 'e-a-out-b-in')
  })

  it('differs for two edges between the same pair of nodes with different handles', () => {
    assert.notEqual(
      edgeId('feed', 'priceSeries', 'chart', 'mainSeries'),
      edgeId('feed', 'candleSeries', 'chart', 'overlayA'),
    )
    assert.notEqual(
      edgeId('feed', 'priceSeries', 'chart', 'mainSeries'),
      edgeId('feed', 'priceSeries', 'chart', 'overlayA'),
    )
  })
})

describe('graphSignature', () => {
  const edges = [
    { id: 'x', source: 'sym-1', sourceHandle: 'symbol', target: 'priceFeed-2', targetHandle: 'symbol' },
    { id: 'y', source: 'priceFeed-2', sourceHandle: 'priceSeries', target: 'smaIndicator-3', targetHandle: 'priceSeries' },
  ]

  it('is stable for identical input', () => {
    assert.equal(graphSignature([sym, feed], edges), graphSignature([sym, feed], edges))
  })

  it('ignores node positions, labels, results and the pro flag', () => {
    const base = graphSignature([sym, feed, sma], edges)
    const moved = [
      { ...sym, position: { x: 999, y: -4 } },
      { ...feed, data: { ...feed.data, label: 'Renamed', result: { price: 1 }, pro: true } },
      sma,
    ]
    assert.equal(graphSignature(moved, edges), base)
  })

  it('ignores edge ids and styles', () => {
    const base = graphSignature([sym, feed], edges)
    const restyled = edges.map(e => ({ ...e, id: 'other', style: { stroke: 'red' } }))
    assert.equal(graphSignature([sym, feed], restyled), base)
  })

  it('changes when a parameter that affects results changes', () => {
    const a = graphSignature([sma], [])
    const b = graphSignature([{ ...sma, data: { ...sma.data, period: 50 } }], [])
    assert.notEqual(a, b)
  })

  it('changes when a node is added or removed', () => {
    assert.notEqual(graphSignature([sym], []), graphSignature([sym, feed], []))
  })

  it('changes when a node type changes', () => {
    assert.notEqual(
      graphSignature([node('n', 'smaIndicator')], []),
      graphSignature([node('n', 'emaIndicator')], []),
    )
  })

  it('changes when an edge is added, removed or rewired', () => {
    const base = graphSignature([sym, feed, sma], edges)
    assert.notEqual(graphSignature([sym, feed, sma], edges.slice(0, 1)), base)
    const rewired = [edges[0], { ...edges[1], targetHandle: 'other' }]
    assert.notEqual(graphSignature([sym, feed, sma], rewired), base)
  })

  it('does not depend on edge order', () => {
    assert.equal(graphSignature([sym, feed, sma], edges), graphSignature([sym, feed, sma], [...edges].reverse()))
  })

  it('does not depend on object key order inside data', () => {
    const a = node('n', 'zScore', { window: 252, extra: { b: 1, a: 2 } })
    const b = { ...node('n', 'zScore'), data: { extra: { a: 2, b: 1 }, window: 252, type: 'zScore', label: 'other' } }
    assert.equal(graphSignature([a], []), graphSignature([b], []))
  })
})

describe('normalizeConnection', () => {
  it('leaves a plain output-to-input connection unchanged', () => {
    assert.deepEqual(
      normalizeConnection({ source: 'a', sourceHandle: 'out', target: 'b', targetHandle: 'in' }),
      { source: 'a', sourceHandle: 'out', target: 'b', targetHandle: 'in' },
    )
  })

  it('swaps a drag that started on an input (left:) handle', () => {
    assert.deepEqual(
      normalizeConnection({ source: 'b', sourceHandle: 'left:priceSeries', target: 'a', targetHandle: 'right:smaSeries' }),
      { source: 'a', sourceHandle: 'smaSeries', target: 'b', targetHandle: 'priceSeries' },
    )
  })

  it('strips a hidden prefix when only the target is a hidden handle', () => {
    assert.deepEqual(
      normalizeConnection({ source: 'a', sourceHandle: 'smaSeries', target: 'b', targetHandle: 'left:priceSeries' }),
      { source: 'a', sourceHandle: 'smaSeries', target: 'b', targetHandle: 'priceSeries' },
    )
  })
})

describe('connectionAllowed', () => {
  const nodes = [sym, feed, sma, chart, wavg, scalar]

  it('allows a symbol into a price feed', () => {
    assert.equal(connectionAllowed({ source: 'sym-1', sourceHandle: 'symbol', target: 'priceFeed-2', targetHandle: 'symbol' }, nodes), true)
  })

  it('allows a price series into an indicator and into a chart overlay', () => {
    assert.equal(connectionAllowed({ source: 'priceFeed-2', sourceHandle: 'priceSeries', target: 'smaIndicator-3', targetHandle: 'priceSeries' }, nodes), true)
    assert.equal(connectionAllowed({ source: 'priceFeed-2', sourceHandle: 'priceSeries', target: 'chartOutput-4', targetHandle: 'overlayA' }, nodes), true)
  })

  it('refuses a self connection', () => {
    assert.equal(connectionAllowed({ source: 'sma', sourceHandle: 'smaSeries', target: 'sma', targetHandle: 'priceSeries' }, nodes), false)
    assert.equal(connectionAllowed({ source: 'sym-1', sourceHandle: 'symbol', target: 'sym-1', targetHandle: 'symbol' }, nodes), false)
  })

  it('refuses a source handle that the node does not have', () => {
    assert.equal(connectionAllowed({ source: 'priceFeed-2', sourceHandle: 'nope', target: 'smaIndicator-3', targetHandle: 'priceSeries' }, nodes), false)
  })

  it('refuses a target handle that the node does not have', () => {
    assert.equal(connectionAllowed({ source: 'priceFeed-2', sourceHandle: 'priceSeries', target: 'smaIndicator-3', targetHandle: 'nope' }, nodes), false)
  })

  it('refuses incompatible port types (a series into a symbol input)', () => {
    assert.equal(connectionAllowed({ source: 'priceFeed-2', sourceHandle: 'priceSeries', target: 'priceFeed-2', targetHandle: 'symbol' }, nodes), false)
    assert.equal(connectionAllowed({ source: 'sym-1', sourceHandle: 'symbol', target: 'smaIndicator-3', targetHandle: 'priceSeries' }, nodes), false)
  })

  it('allows numeric-family types to meet (scalar into signal-typed input is not needed; scalar into any is)', () => {
    assert.equal(connectionAllowed({ source: 'scalarInput-6', sourceHandle: 'scalar', target: 'portfolioInput-5', targetHandle: 'in0' }, nodes), true)
  })

  it('accepts any in<N> handle on the Weighted Average node, but not other names', () => {
    assert.equal(connectionAllowed({ source: 'scalarInput-6', sourceHandle: 'scalar', target: 'portfolioInput-5', targetHandle: 'in7' }, nodes), true)
    assert.equal(connectionAllowed({ source: 'scalarInput-6', sourceHandle: 'scalar', target: 'portfolioInput-5', targetHandle: 'inX' }, nodes), false)
  })

  it('accepts a dragged connection that started on an input handle', () => {
    assert.equal(connectionAllowed({ source: 'smaIndicator-3', sourceHandle: 'left:priceSeries', target: 'priceFeed-2', targetHandle: 'right:priceSeries' }, nodes), true)
  })

  it('refuses unknown nodes', () => {
    assert.equal(connectionAllowed({ source: 'ghost', sourceHandle: 'x', target: 'chartOutput-4', targetHandle: 'mainSeries' }, nodes), false)
  })
})

describe('withConnection', () => {
  it('adds an edge with an edgeId and the standard style', () => {
    const out = withConnection([], { source: 'a', sourceHandle: 'out', target: 'b', targetHandle: 'in' })
    assert.equal(out.length, 1)
    assert.equal(out[0].id, 'e-a-out-b-in')
    assert.equal(out[0].source, 'a')
    assert.equal(out[0].target, 'b')
    assert.equal(out[0].sourceHandle, 'out')
    assert.equal(out[0].targetHandle, 'in')
    assert.deepEqual(out[0].style, { stroke: '#555', strokeWidth: 2 })
  })

  it('replaces an existing edge into the same input (one edge per input)', () => {
    const before = withConnection([], { source: 'a', sourceHandle: 'out', target: 'chart', targetHandle: 'mainSeries' })
    const after = withConnection(before, { source: 'b', sourceHandle: 'out2', target: 'chart', targetHandle: 'mainSeries' })
    assert.equal(after.length, 1)
    assert.equal(after[0].source, 'b')
    assert.equal(after[0].id, 'e-b-out2-chart-mainSeries')
  })

  it('keeps edges into other inputs of the same node', () => {
    const before = withConnection([], { source: 'a', sourceHandle: 'out', target: 'chart', targetHandle: 'mainSeries' })
    const after = withConnection(before, { source: 'b', sourceHandle: 'out', target: 'chart', targetHandle: 'overlayA' })
    assert.equal(after.length, 2)
  })

  it('does not mutate the input array', () => {
    const before = withConnection([], { source: 'a', sourceHandle: 'out', target: 'b', targetHandle: 'in' })
    const copy = JSON.stringify(before)
    withConnection(before, { source: 'c', sourceHandle: 'out', target: 'b', targetHandle: 'in' })
    assert.equal(JSON.stringify(before), copy)
  })

  it('swaps a reversed drag before storing it', () => {
    const out = withConnection([], { source: 'b', sourceHandle: 'left:priceSeries', target: 'a', targetHandle: 'right:smaSeries' })
    assert.equal(out[0].source, 'a')
    assert.equal(out[0].target, 'b')
    assert.equal(out[0].targetHandle, 'priceSeries')
  })
})

describe('stripResults', () => {
  it('removes data.result and keeps everything else', () => {
    const withResult = {
      ...feed,
      data: { ...feed.data, result: { priceSeries: Array.from({ length: 1000 }, (_, i) => ({ timestamp: i, value: i })) } },
    }
    const [out] = stripResults([withResult])
    assert.equal('result' in out.data, false)
    assert.equal(out.id, feed.id)
    assert.deepEqual(out.position, feed.position)
    assert.equal(out.data.type, 'priceFeed')
    assert.equal(out.data.label, feed.data.label)
  })

  it('does not mutate the input nodes', () => {
    const withResult = { ...feed, data: { ...feed.data, result: { price: 1 } } }
    stripResults([withResult])
    assert.deepEqual(withResult.data.result, { price: 1 })
  })

  it('leaves nodes without a result unchanged in content', () => {
    const [out] = stripResults([sma])
    assert.deepEqual(out.data, sma.data)
  })
})

describe('stripEdges', () => {
  it('keeps only the persisted fields, dropping Vue Flow bookkeeping such as sourceNode', () => {
    const withBookkeeping = {
      id: 'e-a-out-b-in',
      source: 'a',
      target: 'b',
      sourceHandle: 'out',
      targetHandle: 'in',
      style: { stroke: '#555', strokeWidth: 2 },
      type: 'default',
      sourceNode: { id: 'a', data: { result: { series: Array.from({ length: 1000 }, (_, i) => i) } } },
      targetNode: { id: 'b', data: {} },
      sourceX: 10,
      events: { click: () => {} },
    }
    const out = stripEdges([withBookkeeping])
    assert.deepEqual(out, [{ id: 'e-a-out-b-in', source: 'a', target: 'b', sourceHandle: 'out', targetHandle: 'in' }])
    assert.equal(JSON.stringify(out).includes('series'), false)
  })

  it('keeps null handles as null', () => {
    const [out] = stripEdges([{ id: 'x', source: 'a', target: 'b', sourceHandle: null, targetHandle: undefined }])
    assert.deepEqual(out, { id: 'x', source: 'a', target: 'b', sourceHandle: null, targetHandle: null })
  })
})
