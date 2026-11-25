/** A starter pipeline. Uses the same plan shape the AI generator produces. */
export interface PipelineTemplate {
  id: string
  name: string
  description: string
  /** Pro templates use at least one pro-only node. */
  pro: boolean
  plan: {
    nodes: { type: string; data?: Record<string, any> }[]
    /** Indices into `plan.nodes`. */
    edges: { source: number; target: number; sourceHandle: string; targetHandle: string }[]
  }
}

export const templates: PipelineTemplate[] = [
  {
    id: 'price-and-trend',
    name: 'Price and trend',
    description: 'The price of a stock with its smoothed trend line from a Kalman filter.',
    pro: false,
    plan: {
      nodes: [
        { type: 'symbolInput', data: { symbol: 'AAPL' } }, // 0
        { type: 'priceFeed' }, // 1
        { type: 'chartOutput' }, // 2
        { type: 'kalmanFilter', data: { smoothing: 'balanced' } }, // 3
      ],
      edges: [
        { source: 0, target: 1, sourceHandle: 'symbol', targetHandle: 'symbol' },
        { source: 1, target: 2, sourceHandle: 'priceSeries', targetHandle: 'mainSeries' },
        { source: 1, target: 3, sourceHandle: 'priceSeries', targetHandle: 'priceSeries' },
        { source: 3, target: 2, sourceHandle: 'smoothed', targetHandle: 'overlayA' },
      ],
    },
  },
  {
    id: 'forecast',
    name: 'Forecast',
    description: 'The price with a 30-day forecast band and the expected return over that horizon.',
    pro: true,
    plan: {
      nodes: [
        { type: 'symbolInput', data: { symbol: 'AAPL' } }, // 0
        { type: 'priceFeed' }, // 1
        { type: 'chartOutput' }, // 2
        { type: 'forecastNode', data: { model: 'auto', steps: 30 } }, // 3
        { type: 'display' }, // 4
      ],
      edges: [
        { source: 0, target: 1, sourceHandle: 'symbol', targetHandle: 'symbol' },
        { source: 1, target: 2, sourceHandle: 'priceSeries', targetHandle: 'mainSeries' },
        { source: 1, target: 3, sourceHandle: 'priceSeries', targetHandle: 'priceSeries' },
        { source: 3, target: 2, sourceHandle: 'forecastSeries', targetHandle: 'overlayA' },
        { source: 3, target: 4, sourceHandle: 'expectedReturn', targetHandle: 'value' },
      ],
    },
  },
  {
    id: 'valuation',
    name: 'Valuation',
    description: 'The price against a valuation reference built from the company’s own historical P/E and P/B. A reference point, not a forecast. US-listed tickers only.',
    pro: false,
    plan: {
      nodes: [
        { type: 'symbolInput', data: { symbol: 'AAPL' } }, // 0
        { type: 'priceFeed' }, // 1
        { type: 'fairValue' }, // 2
        { type: 'chartOutput' }, // 3
        { type: 'display' }, // 4
      ],
      edges: [
        { source: 0, target: 1, sourceHandle: 'symbol', targetHandle: 'symbol' },
        { source: 0, target: 2, sourceHandle: 'symbol', targetHandle: 'symbol' },
        { source: 1, target: 2, sourceHandle: 'priceSeries', targetHandle: 'priceSeries' },
        { source: 2, target: 4, sourceHandle: 'upsidePct', targetHandle: 'value' },
        { source: 1, target: 3, sourceHandle: 'priceSeries', targetHandle: 'mainSeries' },
        { source: 2, target: 3, sourceHandle: 'fairValueSeries', targetHandle: 'overlayA' },
      ],
    },
  },
  {
    id: 'compare-two-assets',
    name: 'Compare two assets',
    description: 'Two stocks rebased to 100 at the start of the year, so their moves can be compared on one chart.',
    pro: false,
    plan: {
      nodes: [
        { type: 'symbolInput', data: { symbol: 'AAPL' } }, // 0
        { type: 'symbolInput', data: { symbol: 'MSFT' } }, // 1
        { type: 'priceFeed' }, // 2
        { type: 'priceFeed' }, // 3
        { type: 'normalize', data: { window: '1Y', label: 'AAPL' } }, // 4
        { type: 'normalize', data: { window: '1Y', label: 'MSFT' } }, // 5
        { type: 'chartOutput' }, // 6
      ],
      edges: [
        { source: 0, target: 2, sourceHandle: 'symbol', targetHandle: 'symbol' },
        { source: 1, target: 3, sourceHandle: 'symbol', targetHandle: 'symbol' },
        { source: 2, target: 4, sourceHandle: 'priceSeries', targetHandle: 'priceSeries' },
        { source: 3, target: 5, sourceHandle: 'priceSeries', targetHandle: 'priceSeries' },
        { source: 4, target: 6, sourceHandle: 'normalized', targetHandle: 'mainSeries' },
        { source: 5, target: 6, sourceHandle: 'normalized', targetHandle: 'overlayA' },
      ],
    },
  },
]
