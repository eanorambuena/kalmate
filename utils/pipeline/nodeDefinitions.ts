import type { NodeDefinition } from './types'

export const nodeDefinitions: NodeDefinition[] = [
  {
    type: 'symbolInput',
    label: 'Symbol Input',
    category: 'input',
    color: '#2979ff',
    inputs: [],
    outputs: [{ id: 'symbol', label: 'Symbol', type: 'symbol' }],
    defaultData: { symbol: 'AAPL' },
  },
  {
    type: 'priceFeed',
    label: 'Price Feed',
    category: 'input',
    color: '#2979ff',
    inputs: [{ id: 'symbol', label: 'Symbol', type: 'symbol' }],
    outputs: [
      { id: 'price', label: 'Price', type: 'price' },
      { id: 'history', label: 'History', type: 'series' },
    ],
    defaultData: {},
  },
  {
    type: 'kalmanFilter',
    label: 'Kalman Filter',
    category: 'process',
    color: '#00c853',
    inputs: [{ id: 'series', label: 'Price Series', type: 'series' }],
    outputs: [
      { id: 'smoothed', label: 'Smoothed', type: 'series' },
      { id: 'trend', label: 'Trend', type: 'series' },
      { id: 'signal', label: 'Signal', type: 'signal' },
    ],
    defaultData: {},
  },
  {
    type: 'chartOutput',
    label: 'Chart',
    category: 'output',
    color: '#ff69b4',
    inputs: [
      { id: 'price', label: 'Price', type: 'price' },
      { id: 'smoothed', label: 'Smoothed', type: 'series' },
      { id: 'trend', label: 'Trend', type: 'series' },
    ],
    outputs: [],
    defaultData: {},
  },
  {
    type: 'priceDisplay',
    label: 'Price Display',
    category: 'output',
    color: '#ff69b4',
    inputs: [{ id: 'price', label: 'Price', type: 'price' }],
    outputs: [],
    defaultData: {},
  },
  {
    type: 'alertOutput',
    label: 'Alert',
    category: 'output',
    color: '#ff69b4',
    inputs: [{ id: 'signal', label: 'Signal', type: 'signal' }],
    outputs: [],
    defaultData: { threshold: 0.02 },
  },
]
