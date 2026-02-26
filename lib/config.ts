// Configuración de la aplicación
export const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'ModulArq',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
  }
}
