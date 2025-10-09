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

// GET /api/neon/projects - Obtener proyectos con datos relacionados
export async function GET(request: NextRequest) {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Solo disponible en desarrollo' }, { status: 403 })
    }

    // Consulta simplificada para proyectos
    const result = await executeQuery(`
      SELECT 
        p.*,
        u.name as created_by_name,
        COUNT(pt.id) as task_count,
        COUNT(po.id) as operario_count,
        COALESCE(AVG(pt.progress_percentage), 0) as avg_progress
      FROM projects p 
      LEFT JOIN users u ON p.created_by = u.id
      LEFT JOIN project_tasks pt ON p.id = pt.project_id
      LEFT JOIN project_operarios po ON p.id = po.project_id
      GROUP BY p.id, u.name
      ORDER BY p.created_at DESC
    `)
    
    // Formatear datos para que coincidan con el formato esperado
    const formattedProjects = result.rows.map(project => ({
      id: project.id,
      name: project.name,
      description: project.description || '',
      status: project.status,
      startDate: project.start_date,
      endDate: project.end_date,
      supervisor: project.supervisor,
      progress: project.progress || 0,
      createdBy: project.created_by,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
      taskCount: parseInt(project.task_count) || 0,
      operarioCount: parseInt(project.operario_count) || 0,
      avgProgress: parseFloat(project.avg_progress) || 0,
      projectTasks: [], // Se pueden cargar por separado si es necesario
      projectOperarios: [] // Se pueden cargar por separado si es necesario
    }))
    
    return NextResponse.json({
      data: formattedProjects,
      count: formattedProjects.length
    })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Error al obtener proyectos' },
      { status: 500 }
    )
  }
}

// POST /api/neon/projects - Crear proyecto
export async function POST(request: NextRequest) {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Solo disponible en desarrollo' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, status, start_date, end_date, created_by } = body

    if (!name || !status || !created_by) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    const result = await executeQuery(
      `INSERT INTO projects (name, description, status, start_date, end_date, progress, created_by, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        name, 
        description || null, 
        status, 
        start_date || null, 
        end_date || null, 
        0, 
        created_by,
        new Date().toISOString(), 
        new Date().toISOString()
      ]
    )

    return NextResponse.json({
      data: result.rows[0],
      message: 'Proyecto creado exitosamente'
    })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Error al crear proyecto' },
      { status: 500 }
    )
  }
}