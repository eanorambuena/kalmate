import { describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'
import { getAllMarketSymbols, distributeQuotes } from '../utils/quotePoller.ts'
import { ALL_MARKETS } from '../utils/constants.ts'

describe('quotePoller', () => {
  it('getAllMarketSymbols returns symbols from all 6 categories', () => {
    const symbols = getAllMarketSymbols(ALL_MARKETS)
    const all = symbols.join(',')
    // Equities
    assert.ok(symbols.includes('SPY'))
    assert.ok(symbols.includes('AAPL'))
    // Indices
    assert.ok(symbols.includes('^GSPC'))
    assert.ok(symbols.includes('^IXIC'))
    // Forex
    assert.ok(symbols.includes('USDEUR=X'))
    assert.ok(symbols.includes('USDCLP=X'))
    // Bonds
    assert.ok(symbols.includes('^TNX'))
    assert.ok(symbols.includes('^TYX'))
    // Commodities
    assert.ok(symbols.includes('GC=F'))
    assert.ok(symbols.includes('CL=F'))
    // Crypto
    assert.ok(symbols.includes('BTC-USD'))
    assert.ok(symbols.includes('ETH-USD'))
    // Total unique symbols
    assert.equal(symbols.length, new Set(symbols).size, 'All symbols must be unique')
  })

  it('distributeQuotes returns correct shape with all categories', () => {
    const mockQuotes = [
      { symbol: 'SPY', regularMarketPrice: 500, regularMarketChange: 5, regularMarketChangePercent: 1 },
      { symbol: 'AAPL', regularMarketPrice: 200, regularMarketChange: -2, regularMarketChangePercent: -1 },
      { symbol: '^GSPC', regularMarketPrice: 5500, regularMarketChange: 10, regularMarketChangePercent: 0.2 },
      { symbol: 'USDEUR=X', regularMarketPrice: 0.85, regularMarketChange: 0.01, regularMarketChangePercent: 1.2 },
      { symbol: '^TNX', regularMarketPrice: 4.5, regularMarketChange: 0.05, regularMarketChangePercent: 1.1 },
      { symbol: 'GC=F', regularMarketPrice: 2000, regularMarketChange: 20, regularMarketChangePercent: 1.0 },
      { symbol: 'BTC-USD', regularMarketPrice: 60000, regularMarketChange: 1000, regularMarketChangePercent: 1.7 },
    ]
    const result = distributeQuotes(mockQuotes, ALL_MARKETS)

    // Result has all categories
    assert.ok(Array.isArray(result))
    assert.equal(result.length, Object.keys(ALL_MARKETS).length)

    // Each entry has title and items
    const equities = result.find(r => r.title === 'EQUITIES')
    assert.ok(equities)
    assert.equal(equities.title, 'EQUITIES')
    assert.ok(Array.isArray(equities.items))
    assert.ok(equities.items.length > 0)

    // Items have correct shape with null-safe defaults
    const spy = equities.items.find(i => i.symbol === 'SPY')
    assert.ok(spy)
    assert.equal(spy.price, 500)
    assert.equal(spy.change, 5)
    assert.equal(spy.changePercent, 1)

    // Missing symbols get null values
    const msft = equities.items.find(i => i.symbol === 'MSFT')
    assert.ok(msft)
    assert.equal(msft.price, null)
    assert.equal(msft.change, null)
    assert.equal(msft.changePercent, null)
  })

  it('distributeQuotes handles empty API response', () => {
    const result = distributeQuotes([], ALL_MARKETS)
    assert.equal(result.length, Object.keys(ALL_MARKETS).length)
    for (const cat of result) {
      for (const item of cat.items) {
        assert.equal(item.price, null)
        assert.equal(item.change, null)
        assert.equal(item.changePercent, null)
      }
    }
  })
})
