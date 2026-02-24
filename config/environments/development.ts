export const developmentConfig = {
  app: {
    name: 'ModulArq - Development',
    version: '1.0.0',
    environment: 'development' as const,
    debug: true,
    logLevel: 'debug' as const
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL_DEV || process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_DEV || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY_DEV || process.env.SUPABASE_SERVICE_ROLE_KEY
  },
  features: {
    enableAnalytics: false,
    enablePWA: false,
    enableDebugMode: true,
    enableHotReload: true
  },
  api: {
    baseUrl: 'http://localhost:3000/api',
    timeout: 10000
  },
  monitoring: {
    enableLogging: true,
    enableMetrics: false,
    enableErrorTracking: false
  }
}