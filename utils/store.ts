import fs from 'node:fs'
import path from 'node:path'
import type { PortfolioData, PortfolioHolding, AlertCondition } from './types'

const DATA_DIR = path.resolve(process.cwd(), 'data')
const PORTFOLIO_FILE = path.join(DATA_DIR, 'portfolio.json')
const ALERTS_FILE = path.join(DATA_DIR, 'alerts.json')

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
  } catch {
    // fs not available (Cloudflare Workers, etc.)
  }
}

function readJSON<T>(filePath: string, defaultValue: T): T {
  try {
    ensureDataDir()
    if (!fs.existsSync(filePath)) {
      return defaultValue
    }
    const raw = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(raw) as T
  } catch {
    return defaultValue
  }
}

function writeJSON<T>(filePath: string, data: T) {
  try {
    ensureDataDir()
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
  } catch {
    // fs not available — silently skip persistence
  }
}

// Portfolio
export async function getPortfolio(env?: any): Promise<PortfolioData> {
  if (env?.KALMATE_KV) {
    const raw = await env.KALMATE_KV.get('portfolio')
    return raw ? JSON.parse(raw) : { holdings: [] }
  }
  return readJSON<PortfolioData>(PORTFOLIO_FILE, { holdings: [] })
}

export async function savePortfolio(data: PortfolioData, env?: any) {
  if (env?.KALMATE_KV) {
    await env.KALMATE_KV.put('portfolio', JSON.stringify(data))
    return
  }
  writeJSON(PORTFOLIO_FILE, data)
}

export async function addHolding(holding: PortfolioHolding, env?: any): Promise<PortfolioHolding> {
  const portfolio = await getPortfolio(env)
  portfolio.holdings.push(holding)
  await savePortfolio(portfolio, env)
  return holding
}

export async function removeHolding(id: string, env?: any) {
  const portfolio = await getPortfolio(env)
  portfolio.holdings = portfolio.holdings.filter(h => h.id !== id)
  await savePortfolio(portfolio, env)
}

export async function updateHolding(id: string, update: Partial<PortfolioHolding>, env?: any) {
  const portfolio = await getPortfolio(env)
  const index = portfolio.holdings.findIndex(h => h.id === id)
  if (index !== -1) {
    portfolio.holdings[index] = { ...portfolio.holdings[index], ...update }
    await savePortfolio(portfolio, env)
  }
}

// Alerts
export async function getAlerts(env?: any): Promise<AlertCondition[]> {
  if (env?.KALMATE_KV) {
    const raw = await env.KALMATE_KV.get('alerts')
    return raw ? JSON.parse(raw) : []
  }
  return readJSON<AlertCondition[]>(ALERTS_FILE, [])
}

export async function saveAlerts(alerts: AlertCondition[], env?: any) {
  if (env?.KALMATE_KV) {
    await env.KALMATE_KV.put('alerts', JSON.stringify(alerts))
    return
  }
  writeJSON(ALERTS_FILE, alerts)
}

export async function addAlert(alert: AlertCondition, env?: any): Promise<AlertCondition> {
  const alerts = await getAlerts(env)
  alerts.push(alert)
  await saveAlerts(alerts, env)
  return alert
}

export async function removeAlert(id: string, env?: any) {
  const alerts = await getAlerts(env)
  const filtered = alerts.filter(a => a.id !== id)
  await saveAlerts(filtered, env)
}

export async function updateAlert(id: string, update: Partial<AlertCondition>, env?: any) {
  const alerts = await getAlerts(env)
  const index = alerts.findIndex(a => a.id === id)
  if (index !== -1) {
    alerts[index] = { ...alerts[index], ...update }
    await saveAlerts(alerts, env)
  }
}
