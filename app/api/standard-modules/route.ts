import { NextRequest, NextResponse } from 'next/server'
import { PrismaTypedService } from '@/lib/prisma-typed-service'

// GET /api/standard-modules
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const onlyActive = searchParams.get('active') === 'true'
    const modules = await PrismaTypedService.getAllStandardModules(onlyActive)
    return NextResponse.json({ modules })
  } catch (error) {
    console.error('Error fetching standard modules:', error)
    return NextResponse.json({ error: 'Error al obtener módulos estándar' }, { status: 500 })
  }
}

// POST /api/standard-modules
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, base_price, is_active, order } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
    }

    const module = await PrismaTypedService.createStandardModule({
      name: name.trim(),
      description: description?.trim() || undefined,
      base_price: base_price ?? 0,
      is_active: is_active ?? true,
      order: order ?? 0,
    })

    return NextResponse.json({ module }, { status: 201 })
  } catch (error) {
    console.error('Error creating standard module:', error)
    return NextResponse.json({ error: 'Error al crear módulo estándar' }, { status: 500 })
  }
}
