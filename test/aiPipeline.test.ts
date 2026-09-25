import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { useAIPipeline } from '../composables/useAIPipeline.ts'

// useAIPipeline.generate() tries $fetch('/api/generate-pipeline') (Groq) first.
// $fetch is a Nuxt auto-import that doesn't exist in this plain node:test
// runtime, so the call throws, is swallowed, and generate() falls back to
// the local keyword parser — exactly what happens in production when Groq
// is unavailable or GROQ_API_KEY isn't set. These tests exercise that
// fallback path.
describe('useAIPipeline (keyword fallback)', () => {
  const { generate } = useAIPipeline()

  it('still wires forecastNode from a forecast query', async () => {
    const plan = await generate('forecast AAPL 20 days') as any
    const types = plan.nodes.map((n: any) => n.type)
    assert.ok(types.includes('forecastNode'))
    const fcIdx = types.indexOf('forecastNode')
    const wired = plan.edges.some((e: any) => e.target === fcIdx && e.sourceHandle === 'priceSeries')
    assert.ok(wired, 'forecastNode should receive priceSeries from priceFeed')
  })

  it('a recommendation query pulls in kalman, rsi, and fundamentals automatically', async () => {
    const plan = await generate('recomiendame TSLA') as any
    const types = plan.nodes.map((n: any) => n.type)
    for (const t of ['kalmanFilter', 'rsiIndicator', 'incomeStatement', 'fundamentalAnalysis', 'recommendationNode']) {
      assert.ok(types.includes(t), `expected ${t} in the generated pipeline, got: ${types.join(', ')}`)
    }
  })

  it('recommendationNode is wired to trend, cycle, rsiValue and fundamentalScore', async () => {
    const plan = await generate('should I buy or sell NVDA') as any
    const types = plan.nodes.map((n: any) => n.type)
    const recIdx = types.indexOf('recommendationNode')
    const kalmanIdx = types.indexOf('kalmanFilter')
    const rsiIdx = types.indexOf('rsiIndicator')
    const faIdx = types.indexOf('fundamentalAnalysis')
    assert.ok(recIdx >= 0)

    const targetHandles = plan.edges.filter((e: any) => e.target === recIdx).map((e: any) => e.targetHandle).sort()
    assert.deepEqual(targetHandles, ['cycle', 'fundamentalScore', 'rsiValue', 'trend'])

    assert.ok(plan.edges.some((e: any) => e.source === kalmanIdx && e.target === recIdx && e.sourceHandle === 'trend'))
    assert.ok(plan.edges.some((e: any) => e.source === kalmanIdx && e.target === recIdx && e.sourceHandle === 'cycle'))
    assert.ok(plan.edges.some((e: any) => e.source === rsiIdx && e.target === recIdx && e.sourceHandle === 'rsiValue'))
    assert.ok(plan.edges.some((e: any) => e.source === faIdx && e.target === recIdx && e.sourceHandle === 'fundamentalScore'))
  })

  it('incomeStatement is wired from symbolInput and feeds fundamentalAnalysis', async () => {
    const plan = await generate('estado de resultados de AAPL') as any
    const types = plan.nodes.map((n: any) => n.type)
    const symIdx = types.indexOf('symbolInput')
    const isIdx = types.indexOf('incomeStatement')
    const faIdx = types.indexOf('fundamentalAnalysis')
    assert.ok(isIdx >= 0 && faIdx >= 0)
    assert.ok(plan.edges.some((e: any) => e.source === symIdx && e.target === isIdx && e.sourceHandle === 'symbol'))
    assert.ok(plan.edges.some((e: any) => e.source === isIdx && e.target === faIdx && e.sourceHandle === 'fundamentals'))
  })

  it('a fundamentals-only query does not force a full recommendation node', async () => {
    const plan = await generate('estado de resultados de AAPL') as any
    const types = plan.nodes.map((n: any) => n.type)
    assert.ok(!types.includes('recommendationNode'))
  })

  it('a plain chart query is unaffected by the new node types', async () => {
    const plan = await generate('grafico AAPL') as any
    const types = plan.nodes.map((n: any) => n.type)
    assert.deepEqual(types, ['symbolInput', 'priceFeed', 'chartOutput'])
  })
})
