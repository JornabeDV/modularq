export const stagingConfig = {
  app: {
    name: 'ModularQ - Staging',
    version: '1.0.0',
    environment: 'staging' as const,
    debug: false,
    logLevel: 'info' as const
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  },
  features: {
    enableAnalytics: true,
    enablePWA: true,
    enableDebugMode: false,
    enableHotReload: false
  },
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
    timeout: 15000
  },
  monitoring: {
    enableLogging: true,
    enableMetrics: true,
    enableErrorTracking: true
  }
}