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

/** A stock split: `ratio` new shares per old share, effective on `date` (YYYY-MM-DD). */
export interface StockSplit {
  date: string
  ratio: number
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
  freeCashFlowPerShare: number | null
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

/** Latest end first; on equal ends, the latest filing first. */
function newestFirst(a: XbrlFact, b: XbrlFact): number {
  return (a.end < b.end ? 1 : a.end > b.end ? -1 : 0) || (a.filed < b.filed ? 1 : a.filed > b.filed ? -1 : 0)
}

/** Product of the ratios of every split effective after the filing date. */
function splitFactor(filed: string, splits: StockSplit[]): number {
  let f = 1
  for (const s of splits) if (s.date > filed) f *= s.ratio
  return f
}

/**
 * Restates per-share and share-count facts in today's share basis. Yahoo
 * prices are adjusted for splits, SEC facts are not. Other facts are returned
 * unchanged.
 */
function adjustForSplits(facts: XbrlFact[], kind: 'perShare' | 'count', splits: StockSplit[]): XbrlFact[] {
  if (!splits.length) return facts
  return facts.map(f => {
    const factor = splitFactor(f.filed, splits)
    if (factor === 1) return f
    return { ...f, val: kind === 'perShare' ? f.val / factor : f.val * factor }
  })
}

/**
 * Trailing-twelve-month value for a flow item (income, cash flow, EPS):
 *   TTM = latest annual + current year-to-date - same year-to-date one year earlier.
 * Without any annual fact it sums four quarters when they are available.
 * Balance-sheet items are point values and use `latestPoint`.
 */
function ttmFlow(known: XbrlFact[]): number | null {
  const annuals = known
    .filter(f => f.start && days(f.start, f.end) >= 340 && days(f.start, f.end) <= 380)
    .sort(newestFirst)
  const annual = annuals[0]
  if (!annual) return quarterSum(known)

  const ytds = known
    .filter(f => f.start && days(f.start, f.end) < 340 && f.end > annual.end
      && days(annual.end, f.start) >= 0 && days(annual.end, f.start) <= 10)
    .sort(newestFirst)
  const current = ytds[0]
  if (!current) return annual.val

  const duration = days(current.start!, current.end)
  const priorEnd = Date.parse(current.end) - 365 * DAY
  const prior = known
    .filter(f => f.start && Math.abs(days(f.start, f.end) - duration) <= 10
      && Math.abs(Date.parse(f.end) - priorEnd) <= 15 * DAY)
    .sort(newestFirst)[0]
  if (!prior) return annual.val
  return annual.val + current.val - prior.val
}

/** Sum of the four latest quarters (duration 80-100 days), if they span at most 300 days. */
function quarterSum(known: XbrlFact[]): number | null {
  const quarters = known.filter(f => f.start && days(f.start, f.end) >= 80 && days(f.start, f.end) <= 100)
  // Keep one value per quarter end (latest filing wins, i.e. the restated one known at asOf).
  const byEnd = new Map<string, XbrlFact>()
  for (const q of quarters) {
    const prev = byEnd.get(q.end)
    if (!prev || q.filed > prev.filed) byEnd.set(q.end, q)
  }
  const last4 = [...byEnd.values()].sort(newestFirst).slice(0, 4)
  if (last4.length === 4 && days(last4[3].end, last4[0].end) <= 300) {
    return last4.reduce((s, q) => s + q.val, 0)
  }
  return null
}

function latestPoint(known: XbrlFact[]): number | null {
  const sorted = [...known].sort(newestFirst)
  return sorted[0]?.val ?? null
}

/** Builds what was publicly known about a company at `asOf` (YYYY-MM-DD). */
export function snapshotAt(cf: CompanyFacts, asOf: string, splits: StockSplit[] = []): FundamentalsSnapshot {
  const netIncome = ttmFlow(knownBy(factsFor(cf, CONCEPTS.netIncome), asOf))
  const eps = ttmFlow(adjustForSplits(knownBy(factsFor(cf, CONCEPTS.eps), asOf), 'perShare', splits))
  const equity = latestPoint(knownBy(factsFor(cf, CONCEPTS.equity), asOf))
  const shares = latestPoint(adjustForSplits(knownBy(factsFor(cf, CONCEPTS.shares), asOf), 'count', splits))
  const ocf = ttmFlow(knownBy(factsFor(cf, CONCEPTS.operatingCashFlow), asOf))
  const capexRaw = ttmFlow(knownBy(factsFor(cf, CONCEPTS.capex), asOf))
  // Capex is reported as a positive payment in XBRL; subtract its magnitude.
  const capex = capexRaw === null ? null : Math.abs(capexRaw)
  const fcf = ocf !== null && capex !== null ? ocf - capex : null
  const bvps = equity !== null && shares && shares > 0 ? equity / shares : null
  const fcfps = fcf !== null && shares && shares > 0 ? fcf / shares : null
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
    freeCashFlowPerShare: fcfps,
    coverage: values.filter(v => v !== null).length / values.length,
  }
}

/** Snapshot at each date in `dates`, for a backtest over filing history. */
export function snapshotSeries(cf: CompanyFacts, dates: string[], splits: StockSplit[] = []): FundamentalsSnapshot[] {
  return dates.map(d => snapshotAt(cf, d, splits))
}

const QUARTER_END_MD = ['12-31', '09-30', '06-30', '03-31'] as const

/** The last `count` calendar quarter-ends strictly before `today` (YYYY-MM-DD), oldest first. */
export function quarterEnds(count: number, today: string): string[] {
  const out: string[] = []
  let year = Number(today.slice(0, 4))
  while (out.length < count && year > 1900) {
    for (const md of QUARTER_END_MD) {
      const d = `${year}-${md}`
      if (d < today && out.length < count) out.push(d)
    }
    year--
  }
  return out.reverse()
}

// Concepts the snapshot uses. Keeping only these makes a company's facts small
// enough to cache in a D1 row (the full companyfacts file is several MB).
const KEPT_CONCEPTS = new Set<string>([...CONCEPTS.netIncome, ...CONCEPTS.eps, ...CONCEPTS.equity, ...CONCEPTS.shares, ...CONCEPTS.operatingCashFlow, ...CONCEPTS.capex])

export function reduceCompanyFacts(cf: CompanyFacts): CompanyFacts {
  const gaap = cf.facts?.['us-gaap'] ?? {}
  const kept: Record<string, { units?: Record<string, XbrlFact[]> }> = {}
  for (const k of Object.keys(gaap)) if (KEPT_CONCEPTS.has(k)) kept[k] = gaap[k]
  return { facts: { 'us-gaap': kept } }
}
