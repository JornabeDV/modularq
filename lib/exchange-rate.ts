// Servicio para obtener cotización del dólar

export interface ExchangeRate {
  moneda: string
  origen: string
  compra: number
  venta: number
  actualizado: string
}

const CACHE_DURATION = 60 * 1000
type DollarType = 'common' | 'mayorista'

interface CacheEntry {
  rate: ExchangeRate | null
  timestamp: number
}
const cache = new Map<string, CacheEntry>()

function getCacheKey(type: DollarType): string {
  return `exchange-rate-${type}`
}

export async function getExchangeRate(dollarType: DollarType = 'common'): Promise<ExchangeRate | null> {
  const key = getCacheKey(dollarType)
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.rate
  }

  try {
    const typeParam = dollarType === 'mayorista' ? 'mayorista' : 'bna'
    const response = await fetch(`/api/exchange-rate?type=${typeParam}`, { cache: 'no-store' })
    if (!response.ok) throw new Error('Error fetching exchange rate')

    const data: ExchangeRate = await response.json()
    cache.set(key, { rate: data, timestamp: Date.now() })
    return data
  } catch (error) {
    console.error('Error obteniendo cotización:', error)
    if (cached) return cached.rate
    return null
  }
}

export function formatUSD(amountARS: number, rate: number): string {
  const usd = amountARS / rate
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(usd)
}

export function formatARS(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatExchangeRate(rate: ExchangeRate): string {
  return `$${rate.venta.toLocaleString('es-AR')}`
}

export function arsToUsd(amountARS: number, rate: number): number {
  if (!rate || rate <= 0) return 0
  return amountARS / rate
}

export function usdToArs(amountUSD: number, rate: number): number {
  if (!rate || rate <= 0) return 0
  return amountUSD * rate
}

export function formatUSDFromUsd(amountUSD: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amountUSD)
}

export interface CurrencyPair {
  primary: string
  secondary: string | null
  rate: number
}

export function formatCurrencyPair(
  amount: number,
  currency: 'ARS' | 'USD',
  exchangeRate: ExchangeRate | number | null
): CurrencyPair {
  const rate = typeof exchangeRate === 'number' ? exchangeRate : (exchangeRate?.venta ?? 0)

  if (currency === 'USD') {
    return {
      primary: formatUSDFromUsd(amount),
      secondary: rate > 0 ? formatARS(usdToArs(amount, rate)) : null,
      rate
    }
  }

  return {
    primary: formatARS(amount),
    secondary: rate > 0 ? formatUSD(amount, rate) : null,
    rate
  }
}
