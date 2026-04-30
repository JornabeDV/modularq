import { NextRequest, NextResponse } from 'next/server'
import { PrismaTypedService } from '@/lib/prisma-typed-service'

// GET /api/services
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') !== 'false'

    const services = await PrismaTypedService.getServiceCatalog(activeOnly)
    return NextResponse.json({ services })
  } catch (error) {
    console.error('Error fetching services:', error)
    return NextResponse.json({ error: 'Error al obtener servicios' }, { status: 500 })
  }
}

// POST /api/services
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.name || typeof body.unit_price !== 'number') {
      return NextResponse.json(
        { error: 'Nombre y precio unitario son requeridos' },
        { status: 400 }
      )
    }

    const service = await PrismaTypedService.createServiceCatalog({
      name: body.name,
      description: body.description,
      unit_price: body.unit_price,
      unit: body.unit,
      is_active: body.is_active,
    })

    return NextResponse.json({ service }, { status: 201 })
  } catch (error) {
    console.error('Error creating service:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al crear servicio' },
      { status: 500 }
    )
  }
}
