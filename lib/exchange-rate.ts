// Servicio para obtener cotización del dólar

export interface ExchangeRate {
  moneda: string
  origen: string
  compra: number
  venta: number
  actualizado: string
}

// Cache simple para no saturar la API
let cachedRate: ExchangeRate | null = null
let lastFetch: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

export async function getExchangeRate(): Promise<ExchangeRate | null> {
  // Si tenemos cache válido, usarlo
  if (cachedRate && Date.now() - lastFetch < CACHE_DURATION) {
    return cachedRate
  }

  try {
    // Usar API route local para evitar CORS
    const response = await fetch('/api/exchange-rate')
    if (!response.ok) throw new Error('Error fetching exchange rate')
    
    const data: ExchangeRate = await response.json()
    // Guardar en cache
    cachedRate = data
    lastFetch = Date.now()
    
    return data
  } catch (error) {
    console.error('Error obteniendo cotización:', error)
    // Si hay error, devolver cache aunque esté viejo, o null
    return cachedRate
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

export function formatExchangeRate(rate: ExchangeRate): string {
  return `$${rate.venta.toLocaleString('es-AR')}`
}
