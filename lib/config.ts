// Configuración de la aplicación
export const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zgiaqhlorktvggtxtaok.supabase.co',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnaWFxaGxvcmt0dmdndHh0YW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MzYzODYsImV4cCI6MjA3NDQxMjM4Nn0.BRVyWneTrmp2Z1_FstM29-bTEayvPtDHT6LAZDmSCZ4'
  },
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'ModularQ',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
  }
}
