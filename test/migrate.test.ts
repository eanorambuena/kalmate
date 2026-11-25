import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { migratePipeline } from '../utils/pipeline/migrate.ts'

const node = (id: string, type: string, data: Record<string, any> = {}) => ({
  id, type: 'custom', position: { x: 0, y: 0 }, data: { type, label: id, ...data },
})
const edge = (source: string, target: string, sourceHandle?: string, targetHandle?: string) => ({
  id: `old-${source}-${target}`, source, target, sourceHandle, targetHandle,
})

describe('migratePipeline', () => {
  it('returns an empty pipeline for missing or invalid input', () => {
    for (const bad of [null, undefined, 'x', 42]) {
      const out = migratePipeline(bad)
      assert.deepEqual(out.nodes, [])
      assert.deepEqual(out.edges, [])
      assert.equal(out.counter, 0)
      assert.equal(out.autorun, true)
    }
  })

  it('strips persisted results from every node', () => {
    const saved = {
      nodes: [node('s1', 'symbolInput', { symbol: 'AAPL', result: { symbol: 'AAPL' } })],
      edges: [],
    }
    const out = migratePipeline(saved)
    assert.equal('result' in out.nodes[0].data, false)
    assert.equal(out.nodes[0].data.symbol, 'AAPL')
  })

  it('drops nodes of removed or unknown types and every edge touching them', () => {
    const saved = {
      nodes: [
        node('s1', 'symbolInput'),
        node('t1', 'telegramOutput'),
        node('v1', 'valueScore'),
        node('p1', 'priceFeed'),
        node('d1', 'display'),
      ],
      edges: [
        edge('s1', 'p1', 'symbol', 'symbol'),
        edge('p1', 't1', 'price', 'signal'),
        edge('v1', 'd1', 'score', 'value'),
        edge('p1', 'd1', 'price', 'value'),
      ],
    }
    const out = migratePipeline(saved)
    assert.deepEqual(out.nodes.map(n => n.id), ['s1', 'p1', 'd1'])
    assert.deepEqual(out.edges.map(e => [e.source, e.target]), [['s1', 'p1'], ['p1', 'd1']])
  })

  it('renames chart target handles to the current names', () => {
    const saved = {
      nodes: [node('p1', 'priceFeed'), node('c1', 'chartOutput')],
      edges: [
        edge('p1', 'c1', 'priceSeries', 'series'),
        edge('p1', 'c1', 'priceSeries', 'overlay1'),
        edge('p1', 'c1', 'priceSeries', 'overlay2'),
        edge('p1', 'c1', 'priceSeries', 'overlay3'),
      ],
    }
    const out = migratePipeline(saved)
    assert.deepEqual(out.edges.map(e => e.targetHandle), ['mainSeries', 'overlayA', 'overlayB', 'overlayC'])
  })

  it('renames the kalman trend output to smoothed', () => {
    const saved = {
      nodes: [node('p1', 'priceFeed'), node('k1', 'kalmanFilter'), node('c1', 'chartOutput')],
      edges: [
        edge('p1', 'k1', 'priceSeries', 'priceSeries'),
        edge('k1', 'c1', 'trend', 'overlayA'),
      ],
    }
    const out = migratePipeline(saved)
    const e = out.edges.find(x => x.target === 'c1')!
    assert.equal(e.sourceHandle, 'smoothed')
    assert.equal(e.id, 'e-k1-smoothed-c1-overlayA')
  })

  it('renames the alert signal input to value', () => {
    const saved = {
      nodes: [node('k1', 'kalmanFilter'), node('a1', 'alertOutput')],
      edges: [edge('k1', 'a1', 'signal', 'signal')],
    }
    const out = migratePipeline(saved)
    assert.deepEqual(out.edges.map(e => [e.sourceHandle, e.targetHandle]), [['signal', 'value']])
  })

  it('renames portfolio operand handles to indexed inputs', () => {
    const saved = {
      nodes: [node('a', 'scalarInput'), node('b', 'scalarInput'), node('c', 'scalarInput'), node('p', 'portfolioInput')],
      edges: [
        edge('a', 'p', 'scalar', 'operandA'),
        edge('b', 'p', 'scalar', 'operandB'),
        edge('c', 'p', 'scalar', 'operandC'),
      ],
    }
    const out = migratePipeline(saved)
    assert.deepEqual(out.edges.map(e => e.targetHandle), ['in0', 'in1', 'in2'])
  })

  it('keeps indexed portfolio inputs beyond the initial two', () => {
    const saved = {
      nodes: [node('a', 'scalarInput'), node('p', 'portfolioInput')],
      edges: [edge('a', 'p', 'scalar', 'in5')],
    }
    const out = migratePipeline(saved)
    assert.deepEqual(out.edges.map(e => e.targetHandle), ['in5'])
  })

  it('moves a forecast algorithm to model; unknown values become auto', () => {
    const saved = {
      nodes: [
        node('p1', 'priceFeed'),
        node('f1', 'forecastNode', { algorithm: 'kalman', steps: 15 }),
        node('f2', 'forecastNode', { algorithm: 'drift' }),
        node('f3', 'forecastNode', { model: 'drift', algorithm: 'holt' }),
      ],
      edges: [],
    }
    const out = migratePipeline(saved)
    const [, f1, f2, f3] = out.nodes
    assert.equal(f1.data.model, 'auto')
    assert.equal(f1.data.steps, 15)
    assert.equal('algorithm' in f1.data, false)
    assert.equal(f2.data.model, 'drift')
    assert.equal(f3.data.model, 'drift')
    assert.equal('algorithm' in f3.data, false)
  })

  it('drops edges whose handle no longer exists on the node definition', () => {
    const saved = {
      nodes: [node('p1', 'priceFeed'), node('f1', 'forecastNode'), node('fv', 'fairValue'), node('d1', 'display'), node('c1', 'chartOutput')],
      edges: [
        edge('p1', 'f1', 'priceSeries', 'priceSeries'),
        edge('f1', 'c1', 'confidenceSeries', 'overlayB'),
        edge('fv', 'd1', 'gapPct', 'value'),
        edge('fv', 'c1', 'fairValueSeries', 'overlayA'),
        edge('p1', 'c1', 'priceSeries', 'nonexistent'),
      ],
    }
    const out = migratePipeline(saved)
    assert.deepEqual(
      out.edges.map(e => `${e.source}.${e.sourceHandle}->${e.target}.${e.targetHandle}`),
      ['p1.priceSeries->f1.priceSeries', 'fv.fairValueSeries->c1.overlayA'],
    )
  })

  it('drops edges without handles and edges to missing nodes', () => {
    const saved = {
      nodes: [node('p1', 'priceFeed'), node('c1', 'chartOutput')],
      edges: [
        edge('p1', 'c1'),
        edge('p1', 'ghost', 'priceSeries', 'priceSeries'),
        edge('p1', 'c1', 'priceSeries', 'mainSeries'),
      ],
    }
    const out = migratePipeline(saved)
    assert.equal(out.edges.length, 1)
    assert.equal(out.edges[0].targetHandle, 'mainSeries')
  })

  it('keeps only the last edge for each target handle', () => {
    const saved = {
      nodes: [node('p1', 'priceFeed'), node('p2', 'priceFeed'), node('c1', 'chartOutput')],
      edges: [
        edge('p1', 'c1', 'priceSeries', 'mainSeries'),
        edge('p2', 'c1', 'priceSeries', 'mainSeries'),
        edge('p1', 'c1', 'priceSeries', 'overlayA'),
      ],
    }
    const out = migratePipeline(saved)
    assert.deepEqual(out.edges.map(e => [e.source, e.targetHandle]), [['p2', 'mainSeries'], ['p1', 'overlayA']])
  })

  it('rebuilds edge ids from their endpoints', () => {
    const saved = {
      nodes: [node('p1', 'priceFeed'), node('s1', 'smaIndicator')],
      edges: [{ id: 'anything', source: 'p1', target: 's1', sourceHandle: 'priceSeries', targetHandle: 'priceSeries' }],
    }
    const out = migratePipeline(saved)
    assert.equal(out.edges[0].id, 'e-p1-priceSeries-s1-priceSeries')
  })

  it('keeps the saved counter but never below the highest node id suffix', () => {
    const saved = {
      counter: 3,
      nodes: [node('priceFeed-7', 'priceFeed'), node('display-2', 'display')],
      edges: [],
    }
    assert.equal(migratePipeline(saved).counter, 7)
    assert.equal(migratePipeline({ counter: 12, nodes: [], edges: [] }).counter, 12)
  })

  it('keeps autorun when saved and defaults it to on', () => {
    assert.equal(migratePipeline({ nodes: [], edges: [], autorun: false }).autorun, false)
    assert.equal(migratePipeline({ nodes: [], edges: [] }).autorun, true)
  })

  it('is idempotent', () => {
    const saved = {
      counter: 4,
      nodes: [node('p1', 'priceFeed', { result: { price: 1 } }), node('f1', 'forecastNode', { algorithm: 'holt' }), node('c1', 'chartOutput')],
      edges: [edge('p1', 'f1', 'priceSeries', 'priceSeries'), edge('f1', 'c1', 'forecastSeries', 'series')],
    }
    const once = migratePipeline(saved)
    const twice = migratePipeline(once)
    assert.deepEqual(twice, once)
  })
})
