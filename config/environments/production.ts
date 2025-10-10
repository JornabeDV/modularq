export const productionConfig = {
  app: {
    name: 'ModularQ',
    version: '1.0.0',
    environment: 'production' as const,
    debug: false,
    logLevel: 'error' as const
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL_PROD || process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_PROD || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY_PROD || process.env.SUPABASE_SERVICE_ROLE_KEY
  },
  features: {
    enableAnalytics: true,
    enablePWA: true,
    enableDebugMode: false,
    enableHotReload: false
  },
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
    timeout: 20000
  },
  monitoring: {
    enableLogging: true,
    enableMetrics: true,
    enableErrorTracking: true
  },
  security: {
    enableCSP: true,
    enableHSTS: true,
    enableXSSProtection: true
  }
}