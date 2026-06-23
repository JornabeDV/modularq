import { NextRequest, NextResponse } from 'next/server'
import { PrismaTypedService } from '@/lib/prisma-typed-service'

// GET /api/rental-modules/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const moduleData = await PrismaTypedService.getRentalModuleById(id)
    return NextResponse.json({ module: moduleData })
  } catch (error) {
    console.error('Error fetching rental module:', error)
    return NextResponse.json({ error: 'Error al obtener módulo' }, { status: 500 })
  }
}

// PATCH /api/rental-modules/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const moduleData = await PrismaTypedService.updateRentalModule(id, {
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
      current_contract_id: body.current_contract_id,
    })

    return NextResponse.json({ module: moduleData })
  } catch (error) {
    console.error('Error updating rental module:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al actualizar módulo' },
      { status: 500 }
    )
  }
}
