import { buildNodeCatalog, validatePlan } from '../../utils/pipeline/plan'

const GROQ_API = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

function buildPrompt(query: string): string {
  return `You are an assistant that generates financial pipelines for a visual node editor. These are the only nodes available, with their exact handle ids and params:
${buildNodeCatalog()}

Each node is identified by its "type". Input nodes provide data, process nodes transform it, output nodes display it.
Each input handle accepts at most one edge. Port types must match: "any" accepts everything; "series", "price", "scalar", "signal" and "symbol" connect to the same kind, and numeric kinds (price, scalar, signal) connect to each other.

The user query may be in Spanish or English. Generate a pipeline for: "${query}"

Return ONLY valid JSON without markdown and without explanations, with this structure:
{
  "nodes": [
    { "type": "symbolInput", "data": { "symbol": "AAPL" } },
    { "type": "priceFeed", "data": {} },
    { "type": "chartOutput", "data": {} }
  ],
  "edges": [
    { "source": 0, "target": 1, "sourceHandle": "symbol", "targetHandle": "symbol" },
    { "source": 1, "target": 2, "sourceHandle": "priceSeries", "targetHandle": "mainSeries" }
  ]
}

RULES:
- source and target in edges are indices of the nodes array (0, 1, 2...), and source must differ from target
- sourceHandle must be an output id listed for the source node's type
- targetHandle must be an input id listed for the target node's type (Weighted Average accepts in0, in1, ...)
- Every input handle may appear in at most one edge
- Only use the params listed for each node in its data; use the defaults when unsure
- A symbolInput node connects to a priceFeed (symbol -> symbol); a priceFeed feeds indicators, forecasts and charts through its priceSeries output
- Connect the price series to the chart's mainSeries and indicator outputs to overlayA, overlayB or overlayC
- Do not use nodes that are not listed above`
}

const VALID_WORDS = [
  'chart', 'candle', 'sma', 'ema', 'rsi', 'kalman', 'forecast', 'zscore', 'z-score',
  'price', 'symbol', 'show', 'track', 'filter', 'signal',
  'linea', 'grafico', 'vela', 'media', 'promedio', 'prediccion', 'pronostico',
  'mostrar', 'compar', 'suave', 'filtro', 'relativo',
  // valuation
  'value', 'valor', 'valuation', 'valoracion', 'undervalued', 'overvalued', 'infravalorado', 'caro', 'barato', 'fair',
  // fundamentals
  'fundamental', 'eps', 'earnings', 'utilidad', 'book',
  // comparison
  'versus', 'vs', 'contra',
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

    const check = validatePlan(plan)
    if (!check.ok) {
      return { error: `Invalid pipeline from AI: ${check.reason}` }
    }

    return plan
  } catch (error: any) {
    return { error: error.message || 'Failed to generate pipeline' }
  }
})
