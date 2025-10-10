import { NextRequest, NextResponse } from 'next/server'
import { executeSQL } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const { name, password } = await request.json()

    if (!name || !password) {
      return NextResponse.json(
        { error: 'Nombre y contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Ejecutar query SQL en Neon
    const result = await executeSQL(
      'SELECT * FROM users WHERE LOWER(SPLIT_PART(name, \' \', 1)) = LOWER($1) AND password = $2',
      [name.trim(), password]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuario no encontrado o credenciales incorrectas' },
        { status: 401 }
      )
    }

    const userData = result.rows[0]
    
    // Retornar datos del usuario (sin la contraseña)
    const { password: _, ...userWithoutPassword } = userData
    
    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error('Error en login-neon API:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}