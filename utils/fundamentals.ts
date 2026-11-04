// Point-in-time fundamentals from SEC EDGAR XBRL company facts.
//
// Every fact carries `filed`, the date the report was published. A snapshot
// "as of D" only uses facts with filed <= D, so a backtest never sees numbers
// the market did not yet have (no look-ahead, no restatements leaking back).

export interface XbrlFact {
  start?: string
  end: string
  val: number
  form: string
  fy?: number
  fp?: string
  filed: string
}

export interface CompanyFacts {
  facts?: { 'us-gaap'?: Record<string, { units?: Record<string, XbrlFact[]> }> }
}

export interface FundamentalsSnapshot {
  asOf: string
  eps: number | null
  netIncome: number | null
  equity: number | null
  shares: number | null
  bookValuePerShare: number | null
  operatingCashFlow: number | null
  capex: number | null
  freeCashFlow: number | null
  /** Fraction of the values above that were available (0..1). */
  coverage: number
}

const CONCEPTS = {
  netIncome: ['NetIncomeLoss', 'ProfitLoss'],
  eps: ['EarningsPerShareDiluted', 'EarningsPerShareBasic'],
  equity: ['StockholdersEquity'],
  shares: ['WeightedAverageNumberOfDilutedSharesOutstanding', 'WeightedAverageNumberOfSharesOutstandingBasic'],
  operatingCashFlow: ['NetCashProvidedByUsedInOperatingActivities'],
  capex: ['PaymentsToAcquirePropertyPlantAndEquipment'],
} as const

const DAY = 86_400_000

function days(a: string, b: string): number {
  return (Date.parse(b) - Date.parse(a)) / DAY
}

function factsFor(cf: CompanyFacts, concepts: readonly string[]): XbrlFact[] {
  const gaap = cf.facts?.['us-gaap'] ?? {}
  for (const c of concepts) {
    const units = gaap[c]?.units
    if (!units) continue
    const all = Object.values(units).flat()
    if (all.length) return all
  }
  return []
}

/** Facts published on or before `asOf`, the only ones usable at that date. */
function knownBy(facts: XbrlFact[], asOf: string): XbrlFact[] {
  return facts.filter(f => f.filed <= asOf && Number.isFinite(f.val))
}

/**
 * Trailing-twelve-month sum for a flow item (income, cash flow). Uses the most
 * recent four quarters when they are available, otherwise the latest annual
 * 10-K value. Balance-sheet items are point values and use `latestPoint`.
 */
function ttmFlow(known: XbrlFact[]): number | null {
  const quarters = known
    .filter(f => f.start && f.form.startsWith('10-Q') && days(f.start, f.end) >= 80 && days(f.start, f.end) <= 100)
    .sort((a, b) => (a.end < b.end ? 1 : -1))
  // Keep one value per quarter end (latest filing wins, i.e. the restated one known at asOf).
  const byEnd = new Map<string, XbrlFact>()
  for (const q of quarters) {
    const prev = byEnd.get(q.end)
    if (!prev || q.filed > prev.filed) byEnd.set(q.end, q)
  }
  const last4 = [...byEnd.values()].sort((a, b) => (a.end < b.end ? 1 : -1)).slice(0, 4)
  if (last4.length === 4 && days(last4[3].end, last4[0].end) <= 300) {
    return last4.reduce((s, q) => s + q.val, 0)
  }
  const annual = known
    .filter(f => f.form.startsWith('10-K') && f.start && days(f.start, f.end) >= 340)
    .sort((a, b) => (a.end < b.end ? 1 : -1) || (a.filed < b.filed ? 1 : -1))
  return annual[0]?.val ?? null
}

function latestPoint(known: XbrlFact[]): number | null {
  const sorted = [...known].sort((a, b) => (a.end < b.end ? 1 : -1) || (a.filed < b.filed ? 1 : -1))
  return sorted[0]?.val ?? null
}

function latestPerShare(known: XbrlFact[]): number | null {
  // Per-share values: prefer the latest 10-K/10-Q annual or quarterly point.
  const sorted = [...known].sort((a, b) => (a.end < b.end ? 1 : -1) || (a.filed < b.filed ? 1 : -1))
  return sorted[0]?.val ?? null
}

/** Builds what was publicly known about a company at `asOf` (YYYY-MM-DD). */
export function snapshotAt(cf: CompanyFacts, asOf: string): FundamentalsSnapshot {
  const netIncome = ttmFlow(knownBy(factsFor(cf, CONCEPTS.netIncome), asOf))
  const eps = ttmEps(knownBy(factsFor(cf, CONCEPTS.eps), asOf))
  const equity = latestPoint(knownBy(factsFor(cf, CONCEPTS.equity), asOf))
  const shares = latestPoint(knownBy(factsFor(cf, CONCEPTS.shares), asOf))
  const ocf = ttmFlow(knownBy(factsFor(cf, CONCEPTS.operatingCashFlow), asOf))
  const capexRaw = ttmFlow(knownBy(factsFor(cf, CONCEPTS.capex), asOf))
  // Capex is reported as a positive payment in XBRL; subtract its magnitude.
  const capex = capexRaw === null ? null : Math.abs(capexRaw)
  const fcf = ocf !== null && capex !== null ? ocf - capex : null
  const bvps = equity !== null && shares && shares > 0 ? equity / shares : null
  const values = [eps, netIncome, equity, shares, ocf, capex, fcf]
  return {
    asOf,
    eps,
    netIncome,
    equity,
    shares,
    bookValuePerShare: bvps,
    operatingCashFlow: ocf,
    capex,
    freeCashFlow: fcf,
    coverage: values.filter(v => v !== null).length / values.length,
  }
}

/** EPS does not add across quarters reliably, so it uses the latest TTM-style annual value. */
function ttmEps(known: XbrlFact[]): number | null {
  const annual = known
    .filter(f => f.form.startsWith('10-K') && f.start && days(f.start, f.end) >= 340)
    .sort((a, b) => (a.end < b.end ? 1 : -1) || (a.filed < b.filed ? 1 : -1))
  if (annual[0]) return annual[0].val
  return latestPerShare(known)
}

/** Snapshot at each date in `dates`, for a backtest over filing history. */
export function snapshotSeries(cf: CompanyFacts, dates: string[]): FundamentalsSnapshot[] {
  return dates.map(d => snapshotAt(cf, d))
}
