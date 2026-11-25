import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { nodeDefinitions } from '../utils/pipeline/nodeDefinitions.ts'

const root = fileURLToPath(new URL('..', import.meta.url))
const read = (rel: string) => readFileSync(`${root}${rel}`, 'utf8')

/** Every file that describes pipeline nodes to visitors. */
const FILES = [
  'pages/blog/pipeline-nodes-reference.vue',
  'pages/blog/advanced-pipeline-mean-reversion.vue',
  'pages/blog/first-pipeline-tutorial.vue',
  'pages/blog/understanding-market-indicators.vue',
  'pages/blog/what-is-a-financial-terminal.vue',
  'pages/blog/index.vue',
  'pages/index.vue',
  'pages/terminal/pipeline.vue',
  'pages/terminal/pricing.vue',
  'components/pipeline/PipelineAI.vue',
  'components/pipeline/PipelineTutorial.vue',
  'components/pipeline/ProModal.vue',
]

const REMOVED_STRINGS = [
  'Telegram',
  'Multi Symbol',
  'Value Score',
  'multiSymbolInput',
  'telegramOutput',
  'emailOutput',
  'valueScore',
  'Holt',
  'ARIMA',
]

describe('pipeline node documentation', () => {
  it('the node reference documents every node label in nodeDefinitions', () => {
    const page = read('pages/blog/pipeline-nodes-reference.vue')
    for (const def of nodeDefinitions) {
      assert.ok(page.includes(def.label), `pipeline-nodes-reference.vue is missing "${def.label}" (${def.type})`)
    }
  })

  for (const file of FILES) {
    it(`${file} does not mention removed nodes or old names`, () => {
      const text = read(file)
      for (const s of REMOVED_STRINGS) {
        assert.ok(!text.includes(s), `${file} contains "${s}"`)
      }
    })

    it(`${file} does not describe Email as a node or feature`, () => {
      const text = read(file)
      assert.ok(!/Email (node|output|alerts?|reports?)/i.test(text), `${file} describes an Email feature`)
      assert.ok(!/email node/i.test(text), `${file} mentions an email node`)
    })
  }
})
