export const DEFAULT_WATCHLIST = [
  'SPY', 'QQQ', 'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA',
]

export const MAJOR_INDICES = [
  { symbol: '^GSPC', name: 'S&P 500' },
  { symbol: '^IXIC', name: 'NASDAQ' },
  { symbol: '^DJI', name: 'DOW JONES' },
  { symbol: '^N225', name: 'NIKKEI 225' },
]

export const FOREX_PAIRS = [
  { symbol: 'USDEUR=X', name: 'USD/EUR' },
  { symbol: 'USDCLP=X', name: 'USD/CLP' },
  { symbol: 'USDBRL=X', name: 'USD/BRL' },
]

export const BONDS = [
  { symbol: '^TNX', name: 'US 10Y' },
  { symbol: '^TYX', name: 'US 30Y' },
  { symbol: '^FVX', name: 'US 5Y' },
  { symbol: '^IRX', name: 'US 3M' },
]

export const COMMODITIES = [
  { symbol: 'GC=F', name: 'GOLD' },
  { symbol: 'SI=F', name: 'SILVER' },
  { symbol: 'CL=F', name: 'CRUDE OIL' },
  { symbol: 'NG=F', name: 'NATURAL GAS' },
  { symbol: 'HG=F', name: 'COPPER' },
]

export const CRYPTO = [
  { symbol: 'BTC-USD', name: 'BITCOIN' },
  { symbol: 'ETH-USD', name: 'ETHEREUM' },
  { symbol: 'SOL-USD', name: 'SOLANA' },
  { symbol: 'USDT-USD', name: 'USDT/USD' },
]

export const ALL_MARKETS = {
  'EQUITIES': DEFAULT_WATCHLIST.map(s => ({ symbol: s, name: s })),
  'INDICES': MAJOR_INDICES,
  'FOREX': FOREX_PAIRS,
  'BONDS': BONDS,
  'COMMODITIES': COMMODITIES,
  'CRYPTO': CRYPTO,
}

export const DATA_PATH = '../data'
