import { nodeDefinitions } from '../../utils/pipeline/nodeDefinitions'

const GROQ_API = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

function buildPrompt(query: string): string {
  const nodeList = nodeDefinitions
    .filter(n => !n.pro)
    .map(n => {
      const ins = n.inputs.map(i => `${i.id}(${i.type})`).join(', ') || 'none'
      const outs = n.outputs.map(o => `${o.id}(${o.type})`).join(', ') || 'none'
      return `  - ${n.type}: "${n.label}" | inputs: [${ins}] | outputs: [${outs}] | desc: ${n.description}`
    })
    .join('\n')

  return `You are an assistant that generates financial pipelines. You have these nodes available:
${nodeList}
Each node is identified by its "type". "Input" nodes provide data, "process" nodes transform it, "output" nodes display it.

The user query may be in Spanish or English. Generate a pipeline for: "${query}"

Return ONLY valid JSON without markdown, without explanations, with this structure:
{
  "nodes": [
    { "type": "symbolInput", "data": { "symbol": "AAPL" } },
    { "type": "priceFeed", "data": {} },
    { "type": "candleChart", "data": {} }
  ],
  "edges": [
    { "source": 0, "target": 1, "sourceHandle": "source", "targetHandle": "source" },
    { "source": 1, "target": 2, "sourceHandle": "ohlc", "targetHandle": "seriesA" }
  ]
}

RULES:
- source and target in edges are indices of the nodes array (0, 1, 2...)
- sourceHandle must match an output id of the source node
- targetHandle must match an input id of the target node
- Nodes must connect in logical order: inputs -> process -> outputs
- A symbolInput node must always connect to a priceFeed
- A priceFeed can connect to multiple nodes`
}

const VALID_WORDS = [
  'chart', 'candle', 'sma', 'ema', 'rsi', 'kalman', 'forecast',
  'price', 'symbol', 'show', 'track', 'filter', 'signal',
  'linea', 'grafico', 'vela', 'media', 'promedio', 'prediccion',
  'mostrar', 'compar', 'suave', 'filtro', 'relativo',
]

function isValidQuery(q: string): boolean {
  const s = q.trim()
  if (s.length < 2) return false
  const lowered = s.toLowerCase()
  if (/[A-Z]{2,5}/.test(s)) return true
  return VALID_WORDS.some(w => lowered.includes(w))
}

export default defineEventHandler(async (event) => {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return { error: 'GROQ_API_KEY not configured' }
  }

  const body = await readBody<{ query?: string }>(event)
  const query = body?.query?.trim()
  if (!query) {
    return { error: 'Describe qué pipeline quieres construir' }
  }
  if (!isValidQuery(query)) {
    return { error: 'Describe qué pipeline quieres construir. Ej: "grafico AAPL con media 20" o "velas BTC"' }
  }

  const prompt = buildPrompt(query)

  try {
    const res = await fetch(GROQ_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: 'You are a financial pipeline generator. Always respond with valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 512,
      }),
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      if (res.status === 429) {
        return { error: 'Rate limited. Try again in a moment.' }
      }
      return { error: `Groq API error ${res.status}: ${errText}` }
    }

    const data = await res.json()
    const text = data.choices?.[0]?.message?.content || ''

    const jsonStart = text.indexOf('{')
    const jsonEnd = text.lastIndexOf('}')
    if (jsonStart === -1 || jsonEnd === -1) {
      return { error: 'AI response contained no JSON' }
    }

    const jsonStr = text.substring(jsonStart, jsonEnd + 1)
    const plan = JSON.parse(jsonStr)

    if (!plan.nodes || !Array.isArray(plan.nodes) || !plan.edges || !Array.isArray(plan.edges)) {
      return { error: 'Invalid pipeline structure from AI' }
    }

    return plan
  } catch (error: any) {
    return { error: error.message || 'Failed to generate pipeline' }
  }
})
