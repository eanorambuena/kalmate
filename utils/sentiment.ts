const POSITIVE = new Set([
  'surge', 'surges', 'soar', 'soars', 'jump', 'jumps', 'gain', 'gains', 'rally', 'rallies',
  'beat', 'beats', 'record', 'profit', 'profits', 'upgrade', 'upgrades', 'upgraded',
  'growth', 'strong', 'bullish', 'outperform', 'outperforms', 'rise', 'rises', 'rose',
  'wins', 'win', 'boost', 'boosts', 'boosted', 'climb', 'climbs', 'advance', 'advances',
  'optimistic', 'exceeds', 'exceed', 'upbeat', 'dividend', 'raises', 'raised', 'expands',
  'expansion', 'approval', 'approved', 'breakthrough', 'high', 'highs', 'momentum', 'buy',
  'top', 'tops', 'accelerates', 'accelerate', 'recovers', 'recovery', 'soaring', 'thriving',
])

const NEGATIVE = new Set([
  'plunge', 'plunges', 'plunged', 'drop', 'drops', 'dropped', 'fall', 'falls', 'slump', 'slumps',
  'miss', 'misses', 'missed', 'loss', 'losses', 'downgrade', 'downgrades', 'downgraded',
  'lawsuit', 'lawsuits', 'probe', 'probes', 'weak', 'weakness', 'bearish', 'cut', 'cuts',
  'layoffs', 'layoff', 'fraud', 'recall', 'recalls', 'warning', 'warns', 'decline', 'declines',
  'declined', 'sink', 'sinks', 'tumble', 'tumbles', 'crash', 'crashes', 'slide', 'slides',
  'underperform', 'underperforms', 'selloff', 'sell-off', 'default', 'bankruptcy', 'halt',
  'investigation', 'penalty', 'fine', 'fined', 'downturn', 'concerns', 'hit', 'hits', 'lower',
])

/** Sentiment of one headline in [-1, 1]: (positive - negative) / (positive + negative). */
export function headlineSentiment(text: string): number {
  const words = String(text ?? '').toLowerCase().match(/[a-z][a-z-]*/g) ?? []
  let pos = 0
  let neg = 0
  for (const w of words) {
    if (POSITIVE.has(w)) pos++
    else if (NEGATIVE.has(w)) neg++
  }
  if (pos + neg === 0) return 0
  return (pos - neg) / (pos + neg)
}

/** Mean of per-headline sentiment scores; 0 for an empty list. */
export function averageSentiment(headlines: string[]): number {
  if (!headlines.length) return 0
  let total = 0
  for (const h of headlines) total += headlineSentiment(h)
  return total / headlines.length
}
