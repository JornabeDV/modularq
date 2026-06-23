import { NextRequest, NextResponse } from 'next/server'
import { PrismaTypedService } from '@/lib/prisma-typed-service'

// GET /api/rental-modules
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined
    const project_id = searchParams.get('project_id') || undefined

    const modules = await PrismaTypedService.getRentalModules({
      status: status || undefined,
      project_id: project_id || undefined,
    })
    return NextResponse.json({ modules })
  } catch (error) {
    console.error('Error fetching rental modules:', error)
    return NextResponse.json({ error: 'Error al obtener módulos de alquiler' }, { status: 500 })
  }
}

// POST /api/rental-modules
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.code || !body.name) {
      return NextResponse.json(
        { error: 'Código y nombre son requeridos' },
        { status: 400 }
      )
    }

    const moduleData = await PrismaTypedService.createRentalModule({
      code: body.code,
      name: body.name,
      description: body.description,
      project_id: body.project_id,
      modulation: body.modulation,
      height: body.height,
      width: body.width,
      depth: body.depth,
      module_count: body.module_count,
      status: body.status,
      location: body.location,
      condition: body.condition,
      notes: body.notes,
    })

    return NextResponse.json({ module: moduleData }, { status: 201 })
  } catch (error) {
    console.error('Error creating rental module:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al crear módulo' },
      { status: 500 }
    )
  }
}
