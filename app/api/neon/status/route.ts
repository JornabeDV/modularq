import { NextResponse } from 'next/server'
import { Pool } from 'pg'

// Configuración de Neon
let neonPool: Pool | null = null

if (process.env.NODE_ENV === 'development') {
  neonPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  })
}

// Función para ejecutar consultas SQL
async function executeQuery(query: string, params: any[] = []) {
  if (!neonPool) {
    throw new Error('Neon pool no disponible')
  }
  
  const client = await neonPool.connect()
  try {
    const result = await client.query(query, params)
    return result
  } finally {
    client.release()
  }
}

// GET /api/neon/status - Verificar estado de conexión
export async function GET() {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ 
        status: 'error',
        message: 'Solo disponible en desarrollo',
        database: 'production'
      }, { status: 403 })
    }

    // Probar conexión básica
    const timeResult = await executeQuery('SELECT NOW() as current_time')
    
    // Obtener estadísticas de tablas
    const statsResult = await executeQuery(`
      SELECT 
        'users' as tabla, count(*) as registros 
      FROM users
      UNION ALL
      SELECT 
        'projects' as tabla, count(*) as registros 
      FROM projects
      UNION ALL
      SELECT 
        'tasks' as tabla, count(*) as registros 
      FROM tasks
      UNION ALL
      SELECT 
        'project_tasks' as tabla, count(*) as registros 
      FROM project_tasks
      UNION ALL
      SELECT 
        'project_operarios' as tabla, count(*) as registros 
      FROM project_operarios
      ORDER BY tabla
    `)

    return NextResponse.json({
      status: 'success',
      message: 'Conexión a Neon exitosa',
      database: 'neon',
      timestamp: timeResult.rows[0].current_time,
      stats: statsResult.rows,
      environment: process.env.NODE_ENV
    })
  } catch (error) {
    console.error('Error checking Neon status:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Error de conexión a Neon',
      database: 'unknown',
      error: error instanceof Error ? error.message : 'Error desconocido',
      environment: process.env.NODE_ENV
    }, { status: 500 })
  }
}