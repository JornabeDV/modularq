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

// GET /api/neon/users - Obtener usuarios
export async function GET(request: NextRequest) {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Solo disponible en desarrollo' }, { status: 403 })
    }

    const result = await executeQuery('SELECT * FROM users ORDER BY created_at DESC')
    
    return NextResponse.json({
      data: result.rows,
      count: result.rows.length
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Error al obtener usuarios' },
      { status: 500 }
    )
  }
}

// POST /api/neon/users - Crear usuario
export async function POST(request: NextRequest) {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Solo disponible en desarrollo' }, { status: 403 })
    }

    const body = await request.json()
    const { name, role, password } = body

    if (!name || !role || !password) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    const email = `${name.toLowerCase().replace(/\s+/g, '')}@modularq.com`
    
    const result = await executeQuery(
      `INSERT INTO users (email, name, role, password, total_hours, efficiency, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [email, name, role, password, 0, 0, new Date().toISOString(), new Date().toISOString()]
    )

    return NextResponse.json({
      data: result.rows[0],
      message: 'Usuario creado exitosamente'
    })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Error al crear usuario' },
      { status: 500 }
    )
  }
}

// PUT /api/neon/users/[id] - Actualizar usuario
export async function PUT(request: NextRequest) {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Solo disponible en desarrollo' }, { status: 403 })
    }

    const url = new URL(request.url)
    const id = url.pathname.split('/').pop()
    const body = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'ID de usuario requerido' },
        { status: 400 }
      )
    }

    const updateFields = []
    const values = []
    let paramCount = 1

    for (const [key, value] of Object.entries(body)) {
      if (key !== 'id' && value !== undefined) {
        updateFields.push(`${key} = $${paramCount}`)
        values.push(value)
        paramCount++
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No hay campos para actualizar' },
        { status: 400 }
      )
    }

    updateFields.push(`updated_at = $${paramCount}`)
    values.push(new Date().toISOString())
    values.push(id)

    const result = await executeQuery(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramCount + 1} RETURNING *`,
      values
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      data: result.rows[0],
      message: 'Usuario actualizado exitosamente'
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Error al actualizar usuario' },
      { status: 500 }
    )
  }
}

// DELETE /api/neon/users/[id] - Eliminar usuario
export async function DELETE(request: NextRequest) {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Solo disponible en desarrollo' }, { status: 403 })
    }

    const url = new URL(request.url)
    const id = url.pathname.split('/').pop()

    if (!id) {
      return NextResponse.json(
        { error: 'ID de usuario requerido' },
        { status: 400 }
      )
    }

    const result = await executeQuery(
      'DELETE FROM users WHERE id = $1 RETURNING *',
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      data: result.rows[0],
      message: 'Usuario eliminado exitosamente'
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Error al eliminar usuario' },
      { status: 500 }
    )
  }
}