import { NextRequest, NextResponse } from 'next/server'
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

// GET /api/neon/tasks - Obtener tareas
export async function GET(request: NextRequest) {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Solo disponible en desarrollo' }, { status: 403 })
    }

    const result = await executeQuery(`
      SELECT 
        t.*,
        u.name as created_by_name
      FROM tasks t 
      LEFT JOIN users u ON t.created_by = u.id
      ORDER BY t.task_order ASC, t.created_at DESC
    `)
    
    return NextResponse.json({
      data: result.rows,
      count: result.rows.length
    })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Error al obtener tareas' },
      { status: 500 }
    )
  }
}

// POST /api/neon/tasks - Crear tarea
export async function POST(request: NextRequest) {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Solo disponible en desarrollo' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, estimatedHours, category, type, createdBy } = body

    if (!title || !createdBy) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Obtener el siguiente orden
    const maxOrderResult = await executeQuery(
      'SELECT COALESCE(MAX(task_order), 0) as max_order FROM tasks'
    )
    const nextOrder = (maxOrderResult.rows[0]?.max_order || 0) + 1

    const result = await executeQuery(
      `INSERT INTO tasks (title, description, estimated_hours, category, type, task_order, created_by, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        title, 
        description || null, 
        estimatedHours || 0, 
        category || null, 
        type || 'custom', 
        nextOrder,
        createdBy,
        new Date().toISOString(), 
        new Date().toISOString()
      ]
    )

    return NextResponse.json({
      data: result.rows[0],
      message: 'Tarea creada exitosamente'
    })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Error al crear tarea' },
      { status: 500 }
    )
  }
}