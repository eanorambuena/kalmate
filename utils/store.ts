import fs from 'node:fs'
import path from 'node:path'
import type { PortfolioData, PortfolioHolding, AlertCondition } from './types'

const DATA_DIR = path.resolve(process.cwd(), 'data')
const PORTFOLIO_FILE = path.join(DATA_DIR, 'portfolio.json')
const ALERTS_FILE = path.join(DATA_DIR, 'alerts.json')

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

function readJSON<T>(filePath: string, defaultValue: T): T {
  try {
    ensureDataDir()
    if (!fs.existsSync(filePath)) {
      writeJSON(filePath, defaultValue)
      return defaultValue
    }
    const raw = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(raw) as T
  } catch {
    return defaultValue
  }
}

function writeJSON<T>(filePath: string, data: T) {
  ensureDataDir()
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

// Portfolio
export function getPortfolio(): PortfolioData {
  return readJSON<PortfolioData>(PORTFOLIO_FILE, { holdings: [] })
}

export function savePortfolio(data: PortfolioData) {
  writeJSON(PORTFOLIO_FILE, data)
}

export function addHolding(holding: PortfolioHolding): PortfolioHolding {
  const portfolio = getPortfolio()
  portfolio.holdings.push(holding)
  savePortfolio(portfolio)
  return holding
}

export function removeHolding(id: string) {
  const portfolio = getPortfolio()
  portfolio.holdings = portfolio.holdings.filter(h => h.id !== id)
  savePortfolio(portfolio)
}

// Alerts
export function getAlerts(): AlertCondition[] {
  return readJSON<AlertCondition[]>(ALERTS_FILE, [])
}

export function saveAlerts(alerts: AlertCondition[]) {
  writeJSON(ALERTS_FILE, alerts)
}

export function addAlert(alert: AlertCondition): AlertCondition {
  const alerts = getAlerts()
  alerts.push(alert)
  saveAlerts(alerts)
  return alert
}

export function removeAlert(id: string) {
  const alerts = getAlerts()
  const filtered = alerts.filter(a => a.id !== id)
  saveAlerts(filtered)
}

export function updateAlert(id: string, update: Partial<AlertCondition>) {
  const alerts = getAlerts()
  const index = alerts.findIndex(a => a.id === id)
  if (index !== -1) {
    alerts[index] = { ...alerts[index], ...update }
    saveAlerts(alerts)
  }
}
