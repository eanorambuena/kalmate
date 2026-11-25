// Price forecasting models and their out-of-sample evaluation.
//
// Every model works on log prices, so forecasts are multiplicative and never
// negative. A fitted model returns, for each step ahead, the expected log
// price and the standard deviation of the forecast error, which gives the
// median path and the confidence band.
//
// None of these models is trusted on faith: `backtest` replays the model over
// the series' own history (fit on the past only, forecast, compare with what
// happened) and reports how it did against the naive "price stays the same"
// forecast. The node shows that number next to the forecast.

export type ForecastModel = 'auto' | 'drift' | 'ar' | 'meanReversion'

export const FORECAST_MODELS: { id: ForecastModel; label: string; summary: string }[] = [
  { id: 'auto', label: 'Auto (best blend)', summary: 'Blends the models below and the no-change forecast, weighting each by how well it forecast this series in the past.' },
  { id: 'drift', label: 'Trend (drift)', summary: 'Projects the long-run growth rate of the series. Best for assets with a persistent trend.' },
  { id: 'ar', label: 'Autoregressive (AR)', summary: 'Uses how daily returns depend on the previous days. Best for short horizons.' },
  { id: 'meanReversion', label: 'Mean reversion (Kalman)', summary: 'Splits price into a long-run level and a temporary deviation that decays. Best for ranging assets such as currencies.' },
]

export interface FittedModel {
  /** Expected log price at steps 1..h. */
  mean: number[]
  /** Standard deviation of the log-price forecast error at steps 1..h. */
  sd: number[]
}

export interface ForecastPath {
  /** Median price path, steps 1..h. */
  values: number[]
  /** 95% band. */
  lower: number[]
  upper: number[]
}

export interface BacktestResult {
  /** 1 - MAE(model) / MAE(naive). Positive means the model beat "no change". */
  skill: number
  /** Share of forecasts that got the direction right. */
  hitRate: number
  /** Share of outcomes that fell inside the 95% band. */
  coverage: number
  /** Number of forecast origins evaluated. */
  n: number
}

export type AutoWeights = Record<'drift' | 'ar' | 'meanReversion' | 'naive', number>

const Z95 = 1.959964
const MAX_HISTORY = 1260 // five years of trading days
const MIN_HISTORY = 60
/** Origins replayed when forecasting in auto mode. */
const FORECAST_ORIGINS = 16
/** Most recent known outcomes used to weight the automatic blend. */
const WEIGHT_WINDOW = 12
/** Below this many known outcomes the blend uses equal weights. */
const MIN_WEIGHT_RECORDS = 4

// ---------- helpers ----------

function logSeries(prices: number[]): number[] {
  const out: number[] = []
  for (const p of prices) if (p > 0 && Number.isFinite(p)) out.push(Math.log(p))
  return out.length > MAX_HISTORY ? out.slice(out.length - MAX_HISTORY) : out
}

function diff(y: number[]): number[] {
  const r: number[] = []
  for (let i = 1; i < y.length; i++) r.push(y[i]! - y[i - 1]!)
  return r
}

function mean(xs: number[]): number {
  let s = 0
  for (const x of xs) s += x
  return xs.length ? s / xs.length : 0
}

function variance(xs: number[], m = mean(xs)): number {
  let s = 0
  for (const x of xs) s += (x - m) ** 2
  return xs.length > 1 ? s / (xs.length - 1) : 0
}

/** Derivative-free minimiser (Nelder-Mead). Small problems only. */
export function nelderMead(f: (x: number[]) => number, start: number[], opts: { maxIter?: number; step?: number; tol?: number } = {}): number[] {
  const n = start.length
  const maxIter = opts.maxIter ?? 200
  const step = opts.step ?? 0.5
  const tol = opts.tol ?? 1e-7
  let simplex = [start.slice()]
  for (let i = 0; i < n; i++) {
    const p = start.slice()
    p[i] = p[i]! + step
    simplex.push(p)
  }
  let values = simplex.map(f)
  for (let iter = 0; iter < maxIter; iter++) {
    const order = values.map((v, i) => i).sort((a, b) => values[a]! - values[b]!)
    simplex = order.map(i => simplex[i]!)
    values = order.map(i => values[i]!)
    if (Math.abs(values[n]! - values[0]!) < tol * (Math.abs(values[0]!) + tol)) break
    const centroid = new Array(n).fill(0)
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) centroid[j] += simplex[i]![j]! / n
    const worst = simplex[n]!
    const at = (t: number) => centroid.map((c, j) => c + t * (worst[j]! - c))
    const xr = at(-1)
    const fr = f(xr)
    if (fr < values[0]!) {
      const xe = at(-2)
      const fe = f(xe)
      if (fe < fr) { simplex[n] = xe; values[n] = fe } else { simplex[n] = xr; values[n] = fr }
    } else if (fr < values[n - 1]!) {
      simplex[n] = xr; values[n] = fr
    } else {
      const xc = at(fr < values[n]! ? -0.5 : 0.5)
      const fc = f(xc)
      if (fc < Math.min(fr, values[n]!)) {
        simplex[n] = xc; values[n] = fc
      } else {
        for (let i = 1; i <= n; i++) {
          simplex[i] = simplex[i]!.map((v, j) => simplex[0]![j]! + 0.5 * (v - simplex[0]![j]!))
          values[i] = f(simplex[i]!)
        }
      }
    }
  }
  let best = 0
  for (let i = 1; i < values.length; i++) if (values[i]! < values[best]!) best = i
  return simplex[best]!
}

const logistic = (x: number) => 1 / (1 + Math.exp(-x))

// ---------- models ----------

/**
 * Random walk with drift. The drift estimate from a few years of daily data is
 * noisy, so it is shrunk toward zero by how statistically distinguishable it
 * is from zero (positive-part James-Stein factor 1 - 1/t^2).
 */
export function fitDrift(y: number[], h: number): FittedModel {
  const r = diff(y)
  const mu = mean(r)
  const s2 = variance(r, mu)
  const t2 = s2 > 0 ? (mu * mu) / (s2 / r.length) : 0
  const shrink = t2 > 1 ? 1 - 1 / t2 : 0
  const drift = mu * shrink
  const last = y[y.length - 1]!
  const out: FittedModel = { mean: [], sd: [] }
  for (let k = 1; k <= h; k++) {
    out.mean.push(last + drift * k)
    out.sd.push(Math.sqrt(s2 * k))
  }
  return out
}

/** Solves the normal equations for an AR(p) with intercept by Gaussian elimination. */
function olsAR(r: number[], p: number): { coef: number[]; intercept: number; s2: number } | null {
  const n = r.length - p
  if (n < p + 5) return null
  const k = p + 1
  const xtx = Array.from({ length: k }, () => new Array(k).fill(0))
  const xty = new Array(k).fill(0)
  for (let t = p; t < r.length; t++) {
    const row = [1]
    for (let j = 1; j <= p; j++) row.push(r[t - j]!)
    for (let a = 0; a < k; a++) {
      xty[a] += row[a]! * r[t]!
      for (let b = 0; b < k; b++) xtx[a]![b] += row[a]! * row[b]!
    }
  }
  for (let i = 0; i < k; i++) {
    let piv = i
    for (let j = i + 1; j < k; j++) if (Math.abs(xtx[j]![i]) > Math.abs(xtx[piv]![i])) piv = j
    if (Math.abs(xtx[piv]![i]) < 1e-14) return null
    ;[xtx[i], xtx[piv]] = [xtx[piv]!, xtx[i]!]
    ;[xty[i], xty[piv]] = [xty[piv], xty[i]]
    for (let j = i + 1; j < k; j++) {
      const f = xtx[j]![i] / xtx[i]![i]
      for (let c = i; c < k; c++) xtx[j]![c] -= f * xtx[i]![c]
      xty[j] -= f * xty[i]
    }
  }
  const b = new Array(k).fill(0)
  for (let i = k - 1; i >= 0; i--) {
    let s = xty[i]
    for (let j = i + 1; j < k; j++) s -= xtx[i]![j] * b[j]
    b[i] = s / xtx[i]![i]
  }
  let sse = 0
  for (let t = p; t < r.length; t++) {
    let pred = b[0]
    for (let j = 1; j <= p; j++) pred += b[j] * r[t - j]!
    sse += (r[t]! - pred) ** 2
  }
  return { coef: b.slice(1), intercept: b[0], s2: sse / n }
}

/** AR(p) on daily log returns, order chosen by BIC among 0..5. */
export function fitAR(y: number[], h: number): FittedModel {
  const r = diff(y)
  let best: { coef: number[]; intercept: number; s2: number } = { coef: [], intercept: mean(r), s2: variance(r) }
  let bestBic = r.length * Math.log(best.s2 || 1e-12) + Math.log(r.length)
  for (let p = 1; p <= 5; p++) {
    const fit = olsAR(r, p)
    if (!fit) continue
    const n = r.length - p
    const bic = n * Math.log(fit.s2 || 1e-12) + (p + 1) * Math.log(n)
    // Compare on a per-observation basis so different sample sizes are fair.
    if (bic / n < bestBic / r.length) { best = fit; bestBic = bic * (r.length / n) }
  }
  const p = best.coef.length
  const hist = r.slice(r.length - p)
  const out: FittedModel = { mean: [], sd: [] }
  // psi weights of the return process, accumulated to get the price process.
  const psi: number[] = [1]
  let level = y[y.length - 1]!
  let cumPsi = 0
  let varSum = 0
  const rets = hist.slice()
  for (let k = 1; k <= h; k++) {
    let pred = best.intercept
    for (let j = 1; j <= p; j++) pred += best.coef[j - 1]! * (rets[rets.length - j] ?? 0)
    rets.push(pred)
    level += pred
    out.mean.push(level)
    if (k > 1) {
      let w = 0
      for (let j = 1; j <= Math.min(p, k - 1); j++) w += best.coef[j - 1]! * psi[k - 1 - j]!
      psi.push(w)
    }
    cumPsi += psi[k - 1]!
    varSum += cumPsi * cumPsi
    out.sd.push(Math.sqrt(best.s2 * varSum))
  }
  return out
}

export interface MeanReversionParams {
  /** Daily persistence of the temporary deviation (0..1). */
  phi: number
  /** Daily drift of the long-run level. */
  mu: number
  sigmaChi: number
  sigmaXi: number
  logLikelihood: number
}

/**
 * Two-factor filter (Schwartz-Smith form): log price = chi + xi, where chi is
 * a temporary deviation that decays (AR(1) with persistence phi) and xi is the
 * long-run level, a random walk with drift. Written with scalars for speed.
 */
function twoFactorFilter(y: number[], phi: number, mu: number, qChi: number, qXi: number) {
  let chi = 0
  let xi = y[0]!
  // Diffuse-ish prior: the split between the two states is unknown at the start.
  let p00 = qChi / Math.max(1e-9, 1 - phi * phi)
  let p01 = 0
  let p11 = qXi * 50 + 1e-6
  let ll = 0
  for (let i = 1; i < y.length; i++) {
    const chiP = phi * chi
    const xiP = xi + mu
    const a00 = phi * phi * p00 + qChi
    const a01 = phi * p01
    const a11 = p11 + qXi
    const f = a00 + 2 * a01 + a11
    const v = y[i]! - (chiP + xiP)
    const k0 = (a00 + a01) / f
    const k1 = (a01 + a11) / f
    chi = chiP + k0 * v
    xi = xiP + k1 * v
    p00 = a00 - k0 * (a00 + a01)
    p01 = a01 - k0 * (a01 + a11)
    p11 = a11 - k1 * (a01 + a11)
    ll += -0.5 * (Math.log(2 * Math.PI * f) + (v * v) / f)
  }
  return { chi, xi, p00, p01, p11, ll }
}

/** Maximum-likelihood fit of the two-factor model (phi and the two variances). */
export function calibrateMeanReversion(y: number[]): MeanReversionParams {
  const r = diff(y)
  const mu = mean(r)
  const s2 = Math.max(variance(r, mu), 1e-12)
  // Parameters: persistence phi in (0.5, 0.9995); share of return variance that
  // is temporary in (0, 1); total variance scale around the sample variance.
  const decode = (p: number[]) => {
    const phi = 0.5 + 0.4995 * logistic(p[0]!)
    const share = logistic(p[1]!)
    const total = s2 * Math.exp(p[2]!)
    return { phi, qChi: total * share, qXi: total * (1 - share) }
  }
  const nll = (p: number[]) => {
    const { phi, qChi, qXi } = decode(p)
    const ll = twoFactorFilter(y, phi, mu, qChi, qXi).ll
    return Number.isFinite(ll) ? -ll : 1e12
  }
  // Two starts: mostly permanent shocks, and a sizeable temporary component.
  const a = nelderMead(nll, [2, -2, 0], { maxIter: 150, step: 1 })
  const b = nelderMead(nll, [3, 0, 0], { maxIter: 150, step: 1 })
  const best = nll(a) <= nll(b) ? a : b
  const { phi, qChi, qXi } = decode(best)
  return { phi, mu, sigmaChi: Math.sqrt(qChi), sigmaXi: Math.sqrt(qXi), logLikelihood: -nll(best) }
}

export function fitMeanReversion(y: number[], h: number, params = calibrateMeanReversion(y)): FittedModel {
  const { phi, mu } = params
  const qChi = params.sigmaChi ** 2
  const qXi = params.sigmaXi ** 2
  const st = twoFactorFilter(y, phi, mu, qChi, qXi)
  // The filter's level already matches the last observation (no observation noise),
  // so the path starts at the last price.
  const out: FittedModel = { mean: [], sd: [] }
  let chi = st.chi
  let xi = st.xi
  let p00 = st.p00
  let p01 = st.p01
  let p11 = st.p11
  for (let k = 1; k <= h; k++) {
    chi = phi * chi
    xi = xi + mu
    p00 = phi * phi * p00 + qChi
    p01 = phi * p01
    p11 = p11 + qXi
    out.mean.push(chi + xi)
    out.sd.push(Math.sqrt(Math.max(0, p00 + 2 * p01 + p11)))
  }
  return out
}

// ---------- fitting, weighting, evaluation ----------

/** The candidates the automatic mode blends: the three models and the no-change forecast. */
type Candidate = keyof AutoWeights
const CANDIDATES: Candidate[] = ['drift', 'ar', 'meanReversion', 'naive']
type PerCandidate<T> = Record<Candidate, T>

/** What each candidate predicted at origin `o` for the outcome `o + h`. */
interface ReplayRecord {
  o: number
  start: number
  actual: number
  pred: PerCandidate<number>
  sd: PerCandidate<number>
}

interface ScoredPoint {
  start: number
  actual: number
  pred: number
  sd: number
}

const ZERO_BACKTEST: BacktestResult = { skill: 0, hitRate: 0, coverage: 0, n: 0 }

function perCandidate<T>(f: (c: Candidate) => T): PerCandidate<T> {
  return { drift: f('drift'), ar: f('ar'), meanReversion: f('meanReversion'), naive: f('naive') }
}

function fitOne(model: Exclude<ForecastModel, 'auto'>, y: number[], h: number): FittedModel {
  switch (model) {
    case 'drift': return fitDrift(y, h)
    case 'ar': return fitAR(y, h)
    case 'meanReversion': return fitMeanReversion(y, h)
  }
}

function naive(y: number[], h: number): FittedModel {
  const r = diff(y)
  const s2 = variance(r)
  const last = y[y.length - 1]!
  const out: FittedModel = { mean: [], sd: [] }
  for (let k = 1; k <= h; k++) { out.mean.push(last); out.sd.push(Math.sqrt(s2 * k)) }
  return out
}

function fitCandidates(y: number[], h: number): PerCandidate<FittedModel> {
  return {
    drift: fitDrift(y, h),
    ar: fitAR(y, h),
    meanReversion: fitMeanReversion(y, h),
    naive: naive(y, h),
  }
}

function origins(n: number, h: number, maxOrigins: number): number[] {
  const first = Math.max(MIN_HISTORY, Math.floor(n * 0.4))
  const last = n - 1 - h
  if (last < first) return []
  const count = Math.min(maxOrigins, Math.floor((last - first) / Math.max(1, Math.floor(h / 2))) + 1)
  if (count <= 1) return [last]
  const out: number[] = []
  for (let i = 0; i < count; i++) out.push(Math.round(first + (i * (last - first)) / (count - 1)))
  return [...new Set(out)]
}

/**
 * One replay shared by every consumer: from each origin, fit the candidates on
 * y[0..o] only and record their h-step-ahead mean and sd against y[o + h].
 * Records come back in ascending origin order.
 */
function replayAll(y: number[], h: number, maxOrigins: number): ReplayRecord[] {
  const out: ReplayRecord[] = []
  for (const o of origins(y.length, h, maxOrigins)) {
    const fits = fitCandidates(y.slice(0, o + 1), h)
    out.push({
      o,
      start: y[o]!,
      actual: y[o + h]!,
      pred: perCandidate(c => fits[c].mean[h - 1]!),
      sd: perCandidate(c => fits[c].sd[h - 1]!),
    })
  }
  return out
}

/**
 * Automatic weights as they stand at origin `t`. Only records whose outcome
 * had arrived by then (o + h <= t) count, and only the most recent few. Each
 * candidate gets weight proportional to 1 / MAE^2 over those records.
 */
function weightsAt(records: ReplayRecord[], h: number, t: number): PerCandidate<number> {
  const known = records.filter(r => r.o + h <= t).slice(-WEIGHT_WINDOW)
  if (known.length < MIN_WEIGHT_RECORDS) return perCandidate(c => (c === 'naive' ? 0 : 1 / 3))
  const raw = perCandidate(c => {
    let mae = 0
    for (const r of known) mae += Math.abs(r.pred[c] - r.actual)
    mae /= known.length
    return 1 / (mae * mae + 1e-12)
  })
  const total = CANDIDATES.reduce((s, c) => s + raw[c], 0)
  return perCandidate(c => raw[c] / total)
}

/** Weighted average of the candidates' means and of their sds, step by step. */
function blendFits(fits: PerCandidate<FittedModel>, w: PerCandidate<number>, h: number): FittedModel {
  const out: FittedModel = { mean: [], sd: [] }
  for (let k = 0; k < h; k++) {
    let m = 0
    let s = 0
    for (const c of CANDIDATES) { m += w[c] * fits[c].mean[k]!; s += w[c] * fits[c].sd[k]! }
    out.mean.push(m)
    out.sd.push(s)
  }
  return out
}

/** The forecast path for the given model, using replay records for the auto weights. */
function pathFrom(y: number[], h: number, model: ForecastModel, records: ReplayRecord[]): FittedModel {
  if (model !== 'auto') return fitOne(model, y, h)
  return blendFits(fitCandidates(y, h), weightsAt(records, h, y.length - 1), h)
}

function scorePoints(points: ScoredPoint[]): BacktestResult {
  const n = points.length
  let absModel = 0
  let absNaive = 0
  let hits = 0
  let calls = 0
  let covered = 0
  for (const p of points) {
    absModel += Math.abs(p.pred - p.actual)
    absNaive += Math.abs(p.start - p.actual)
    const move = p.pred - p.start
    if (Math.abs(move) > 1e-9) {
      calls++
      if (Math.sign(move) === Math.sign(p.actual - p.start)) hits++
    }
    if (Math.abs(p.actual - p.pred) <= Z95 * p.sd) covered++
  }
  const maeModel = n ? absModel / n : 0
  const maeNaive = n ? absNaive / n : 0
  return {
    skill: n && maeNaive > 0 ? 1 - maeModel / maeNaive : 0,
    hitRate: calls ? hits / calls : 0,
    coverage: n ? covered / n : 0,
    n,
  }
}

/**
 * Scores the model over the replay records. For 'auto', each record's
 * prediction uses weights computed from the records known at that origin.
 */
function scoreFrom(n: number, h: number, model: ForecastModel, records: ReplayRecord[]): BacktestResult {
  if (n < MIN_HISTORY + h + 5) return ZERO_BACKTEST
  const points: ScoredPoint[] = []
  for (const r of records) {
    if (model === 'auto') {
      const w = weightsAt(records, h, r.o)
      let pred = 0
      let sd = 0
      for (const c of CANDIDATES) { pred += w[c] * r.pred[c]; sd += w[c] * r.sd[c] }
      points.push({ start: r.start, actual: r.actual, pred, sd })
    } else {
      points.push({ start: r.start, actual: r.actual, pred: r.pred[model], sd: r.sd[model] })
    }
  }
  return scorePoints(points)
}

function toPath(f: FittedModel): ForecastPath {
  return {
    values: f.mean.map(Math.exp),
    lower: f.mean.map((m, i) => Math.exp(m - Z95 * f.sd[i]!)),
    upper: f.mean.map((m, i) => Math.exp(m + Z95 * f.sd[i]!)),
  }
}

function requireSeries(prices: number[]): number[] {
  const y = logSeries(prices)
  if (y.length < MIN_HISTORY) throw new Error(`Need at least ${MIN_HISTORY} price points to forecast`)
  return y
}

function clampSteps(steps: number): number {
  return Math.max(1, Math.floor(steps))
}

export function isForecastModel(v: unknown): v is ForecastModel {
  return typeof v === 'string' && FORECAST_MODELS.some(m => m.id === v)
}

/** Median price path with a 95% band for the next `steps` periods. */
export function forecast(prices: number[], steps: number, model: ForecastModel = 'auto'): ForecastPath {
  const y = requireSeries(prices)
  const h = clampSteps(steps)
  const records = model === 'auto' ? replayAll(y, h, FORECAST_ORIGINS) : []
  return toPath(pathFrom(y, h, model, records))
}

/**
 * How the model would have done on this series: fitted on the past only at a
 * set of earlier dates, forecasting `steps` ahead, compared with what happened
 * and with the naive "no change" forecast.
 */
export function backtest(prices: number[], steps: number, model: ForecastModel = 'auto', maxOrigins = 24): BacktestResult {
  const y = logSeries(prices)
  const h = clampSteps(steps)
  if (y.length < MIN_HISTORY + h + 5) return ZERO_BACKTEST
  return scoreFrom(y.length, h, model, replayAll(y, h, maxOrigins))
}

/**
 * The forecast and its backtest from a single replay. Equal to calling
 * `forecast` and `backtest` separately with the same `maxOrigins`, but the
 * replay is only run once.
 */
export function forecastWithBacktest(prices: number[], steps: number, model: ForecastModel = 'auto', maxOrigins = FORECAST_ORIGINS): { path: ForecastPath; backtest: BacktestResult } {
  const y = requireSeries(prices)
  const h = clampSteps(steps)
  const records = replayAll(y, h, maxOrigins)
  return {
    path: toPath(pathFrom(y, h, model, records)),
    backtest: scoreFrom(y.length, h, model, records),
  }
}

/** The blend weights the automatic mode would use for the next `steps` periods. */
export function autoWeights(prices: number[], steps: number): AutoWeights {
  const y = requireSeries(prices)
  const h = clampSteps(steps)
  return weightsAt(replayAll(y, h, FORECAST_ORIGINS), h, y.length - 1)
}

export { naive as naiveForecast }
