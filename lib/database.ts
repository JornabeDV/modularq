import { createClient } from '@supabase/supabase-js'
import { Pool } from 'pg'

// Configuración de entornos
const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

// Configuración de Supabase (para autenticación y funciones edge)
const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
}

// Cliente Supabase para autenticación
export const supabase = createClient(
  supabaseConfig.url,
  supabaseConfig.anonKey
)

// Cliente Supabase con service role para operaciones administrativas
export const supabaseAdmin = createClient(
  supabaseConfig.url,
  supabaseConfig.serviceRoleKey
)

// Configuración de PostgreSQL para desarrollo (Neon)
let pgPool: Pool | null = null

if (isDevelopment) {
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  })
}

// Función para obtener conexión a la base de datos
export const getDatabase = () => {
  if (isDevelopment && pgPool) {
    return pgPool
  }
  
  // En producción, usar Supabase
  return supabaseAdmin
}

// Función para ejecutar queries SQL directas (solo desarrollo)
export const executeSQL = async (query: string, params?: any[]) => {
  if (!isDevelopment || !pgPool) {
    throw new Error('SQL directo solo disponible en desarrollo')
  }
  
  const client = await pgPool.connect()
  try {
    const result = await client.query(query, params)
    return result
  } finally {
    client.release()
  }
}

// Función para cerrar conexiones
export const closeDatabase = async () => {
  if (pgPool) {
    await pgPool.end()
    pgPool = null
  }
}

// Tipos para diferentes entornos
export type DatabaseClient = Pool | typeof supabaseAdmin

export default {
  supabase,
  supabaseAdmin,
  getDatabase,
  executeSQL,
  closeDatabase,
  isDevelopment,
  isProduction
}