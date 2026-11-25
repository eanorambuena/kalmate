export interface QuoteData {
  symbol: string
  shortName?: string
  longName?: string
  regularMarketPrice: number
  regularMarketChange: number
  regularMarketChangePercent: number
  regularMarketPreviousClose: number
  regularMarketOpen?: number
  regularMarketDayHigh?: number
  regularMarketDayLow?: number
  regularMarketVolume?: number
  marketCap?: number
  fiftyTwoWeekHigh?: number
  fiftyTwoWeekLow?: number
  currency?: string
  exchangeName?: string
  quoteType?: string
}

export interface HistoryData {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface PortfolioHolding {
  id: string
  symbol: string
  shares: number
  avgPrice: number
  notes?: string
  createdAt: string
}

export interface PortfolioData {
  holdings: PortfolioHolding[]
}

export interface AlertCondition {
  id: string
  symbol: string
  type: 'above' | 'below'
  targetPrice: number
  triggered: boolean
  createdAt: string
  lastChecked?: string
}

export interface ChileIndicator {
  codigo: string
  nombre: string
  unidad_medida: string
  fecha: string
  valor: number
}
