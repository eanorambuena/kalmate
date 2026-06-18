import { getCached, setCache } from '../../utils/cache'
import type { ChileIndicator } from '../../utils/types'

const MINDICADOR_URL = 'https://mindicador.cl/api'

const INDICADORES_CLAVE = ['uf', 'dolar', 'euro', 'utm', 'ipc', 'tpm', 'libra_cobre', 'imacec', 'tasa_desempleo']

export default defineEventHandler(async () => {
  const cacheKey = 'indicadores-chile'
  const cached = getCached<any>(cacheKey)
  if (cached) return cached

  try {
    const res = await fetch(MINDICADOR_URL, {
      headers: { 'User-Agent': 'Kalmate/1.0' },
    })
    if (!res.ok) throw new Error(`mindicador.cl ${res.status}: ${res.statusText}`)
    const data = await res.json()

    const indicators: ChileIndicator[] = INDICADORES_CLAVE
      .map((key) => {
        const ind = data[key]
        if (!ind) return null
        return {
          codigo: ind.codigo,
          nombre: ind.nombre,
          unidad_medida: ind.unidad_medida,
          fecha: ind.fecha,
          valor: ind.valor,
        }
      })
      .filter(Boolean)

    setCache(cacheKey, indicators, 300_000)
    return indicators
  } catch (error: any) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
