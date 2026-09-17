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

export interface FundamentalsData {
  symbol: string
  totalRevenue?: number
  netIncome?: number
  grossProfit?: number
  operatingIncome?: number
  netMargin?: number
  grossMargin?: number
  operatingMargin?: number
  revenueGrowth?: number
  earningsGrowth?: number
  returnOnEquity?: number
  debtToEquity?: number
  currentRatio?: number
  trailingPE?: number
  forwardPE?: number
  priceToBook?: number
  marketCap?: number
  incomeStatementHistory: Array<{
    endDate?: string
    totalRevenue?: number
    netIncome?: number
    grossProfit?: number
    operatingIncome?: number
  }>
}

export interface ChileIndicator {
  codigo: string
  nombre: string
  unidad_medida: string
  fecha: string
  valor: number
}
