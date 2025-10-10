// Tipos para la configuración de la aplicación
export interface AppConfig {
  app: {
    name: string
    version: string
    environment: 'development' | 'production'
    debug: boolean
    logLevel: 'debug' | 'info' | 'warn' | 'error'
  }
  supabase: {
    url: string
    anonKey: string
    serviceRoleKey: string
  }
  features: {
    enableAnalytics: boolean
    enablePWA: boolean
    enableDebugMode: boolean
    enableHotReload: boolean
  }
  api: {
    baseUrl: string
    timeout: number
  }
  monitoring: {
    enableLogging: boolean
    enableMetrics: boolean
    enableErrorTracking: boolean
  }
  security?: {
    enableCSP: boolean
    enableHSTS: boolean
    enableXSSProtection: boolean
  }
}

export type Environment = 'development' | 'production'
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'