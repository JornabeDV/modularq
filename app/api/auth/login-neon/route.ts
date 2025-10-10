import { NextRequest, NextResponse } from 'next/server'
import { executeSQL } from '@/lib/database'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { name, password } = await request.json()

    if (!name || !password) {
      return NextResponse.json(
        { error: 'Nombre y contraseña son requeridos' },
        { status: 400 }
      )
    }

    // En desarrollo, usar Neon directamente
    if (process.env.NODE_ENV === 'development') {
      try {
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
        const { password: _, ...userWithoutPassword } = userData
        
        return NextResponse.json(userWithoutPassword)
      } catch (dbError) {
        console.error('Database error in development:', dbError)
        return NextResponse.json(
          { error: 'Error de conexión a la base de datos' },
          { status: 500 }
        )
      }
    }

    // En producción, usar Supabase
    const { data: allUsers, error: fetchError } = await supabase
      .from('users')
      .select('*')

    if (fetchError) {
      console.error('Error fetching users from Supabase:', fetchError)
      return NextResponse.json(
        { error: 'Error de conexión a la base de datos' },
        { status: 500 }
      )
    }

    // Buscar usuario cuyo primer nombre coincida (case-insensitive)
    const userData = allUsers?.find(user => {
      if (!user.name) return false
      
      const firstName = user.name.split(' ')[0]?.toLowerCase().trim()
      const inputName = name.toLowerCase().trim()
      
      // Si el usuario no tiene contraseña, no permitir login
      if (!user.password) return false
      
      return firstName === inputName && user.password === password
    })

    if (!userData) {
      return NextResponse.json(
        { error: 'Usuario no encontrado o credenciales incorrectas' },
        { status: 401 }
      )
    }

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