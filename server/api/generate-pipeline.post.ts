import { nodeDefinitions } from '../../utils/pipeline/nodeDefinitions'

const GROQ_API = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

function buildPrompt(query: string): string {
  const nodeList = nodeDefinitions
    .map(n => {
      const ins = n.inputs.map(i => `${i.id}(${i.type})`).join(', ') || 'none'
      const outs = n.outputs.map(o => `${o.id}(${o.type})`).join(', ') || 'none'
      return `  - ${n.type}: "${n.label}" | inputs: [${ins}] | outputs: [${outs}] | desc: ${n.description}`
    })
    .join('\n')

  return `You are an assistant that generates financial pipelines as JSON. You have ONLY these node types available — never invent a type, id, or handle name that isn't listed here:
${nodeList}
Each node is identified by its exact "type" string (copy it verbatim, do not translate or reword it). "Input" nodes provide data, "process" nodes transform it, "output" nodes display it.

EXAMPLES (study the exact node/handle names used):

Query: "grafico AAPL"
{"nodes":[{"type":"symbolInput","data":{"symbol":"AAPL"}},{"type":"priceFeed","data":{}},{"type":"chartOutput","data":{}}],"edges":[{"source":0,"target":1,"sourceHandle":"symbol","targetHandle":"symbol"},{"source":1,"target":2,"sourceHandle":"priceSeries","targetHandle":"mainSeries"}]}

Query: "AAPL with SMA 20 and RSI"
{"nodes":[{"type":"symbolInput","data":{"symbol":"AAPL"}},{"type":"priceFeed","data":{}},{"type":"smaIndicator","data":{"period":20}},{"type":"rsiIndicator","data":{"period":14}},{"type":"chartOutput","data":{}}],"edges":[{"source":0,"target":1,"sourceHandle":"symbol","targetHandle":"symbol"},{"source":1,"target":2,"sourceHandle":"priceSeries","targetHandle":"priceSeries"},{"source":1,"target":3,"sourceHandle":"priceSeries","targetHandle":"priceSeries"},{"source":1,"target":4,"sourceHandle":"priceSeries","targetHandle":"mainSeries"},{"source":2,"target":4,"sourceHandle":"smaSeries","targetHandle":"overlayA"}]}

Query: "forecast TSLA 30 days"
{"nodes":[{"type":"symbolInput","data":{"symbol":"TSLA"}},{"type":"priceFeed","data":{}},{"type":"forecastNode","data":{"steps":30,"algorithm":"kalman"}},{"type":"chartOutput","data":{}}],"edges":[{"source":0,"target":1,"sourceHandle":"symbol","targetHandle":"symbol"},{"source":1,"target":2,"sourceHandle":"priceSeries","targetHandle":"priceSeries"},{"source":1,"target":3,"sourceHandle":"priceSeries","targetHandle":"mainSeries"},{"source":2,"target":3,"sourceHandle":"forecastSeries","targetHandle":"overlayA"},{"source":2,"target":3,"sourceHandle":"confidenceSeries","targetHandle":"overlayB"}]}

Query: "should I buy NVDA" (a recommendation needs trend+cycle from Kalman, timing from RSI, and a fundamentals score — always include all four, even if the user only asked for "a recommendation")
{"nodes":[{"type":"symbolInput","data":{"symbol":"NVDA"}},{"type":"priceFeed","data":{}},{"type":"kalmanFilter","data":{}},{"type":"rsiIndicator","data":{"period":14}},{"type":"incomeStatement","data":{}},{"type":"fundamentalAnalysis","data":{}},{"type":"recommendationNode","data":{}}],"edges":[{"source":0,"target":1,"sourceHandle":"symbol","targetHandle":"symbol"},{"source":1,"target":2,"sourceHandle":"priceSeries","targetHandle":"priceSeries"},{"source":1,"target":3,"sourceHandle":"priceSeries","targetHandle":"priceSeries"},{"source":0,"target":4,"sourceHandle":"symbol","targetHandle":"symbol"},{"source":4,"target":5,"sourceHandle":"fundamentals","targetHandle":"fundamentals"},{"source":2,"target":6,"sourceHandle":"trend","targetHandle":"trend"},{"source":2,"target":6,"sourceHandle":"cycle","targetHandle":"cycle"},{"source":3,"target":6,"sourceHandle":"rsiValue","targetHandle":"rsiValue"},{"source":5,"target":6,"sourceHandle":"fundamentalScore","targetHandle":"fundamentalScore"}]}

The user query may be in Spanish or English. Generate a pipeline for: "${query}"

Respond with ONLY the JSON object, no markdown fences, no explanation before or after it, matching this shape:
{ "nodes": [{ "type": "...", "data": {...} }, ...], "edges": [{ "source": 0, "target": 1, "sourceHandle": "...", "targetHandle": "..." }, ...] }

RULES:
- source and target in edges are indices into the nodes array (0, 1, 2, ...), never node types or ids
- sourceHandle must be copied verbatim from an output id of the source node's type (see the node list above)
- targetHandle must be copied verbatim from an input id of the target node's type
- Every node type you use must be one of the exact strings in the node list above — never invent one
- Nodes must connect in logical order: inputs -> process -> outputs
- A symbolInput node must always connect to a priceFeed (and to incomeStatement, if used, directly by "symbol")
- A priceFeed can connect to multiple process nodes
- Prefer the smallest pipeline that satisfies the query; don't add nodes the query didn't ask for, except: a recommendation/buy-or-sell query always needs the full kalmanFilter+rsiIndicator+incomeStatement+fundamentalAnalysis+recommendationNode chain as shown in the example above`
}

const VALID_WORDS = [
  'chart', 'candle', 'sma', 'ema', 'rsi', 'kalman', 'forecast',
  'price', 'symbol', 'show', 'track', 'filter', 'signal',
  'fundamental', 'recommendation', 'buy', 'sell', 'hold',
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
          { role: 'system', content: 'You are a financial pipeline generator. Always respond with a single valid JSON object and nothing else — no markdown, no commentary.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 1024,
        // Groq's OpenAI-compatible JSON mode — guarantees a syntactically
        // valid JSON response instead of relying on prompt instructions alone.
        response_format: { type: 'json_object' },
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
