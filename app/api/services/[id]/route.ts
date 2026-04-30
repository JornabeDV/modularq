import { NextRequest, NextResponse } from 'next/server'
import { PrismaTypedService } from '@/lib/prisma-typed-service'

// PUT /api/services/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const service = await PrismaTypedService.updateServiceCatalog(id, {
      name: body.name,
      description: body.description,
      unit_price: body.unit_price,
      unit: body.unit,
      is_active: body.is_active,
    })

    return NextResponse.json({ service })
  } catch (error) {
    console.error('Error updating service:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al actualizar servicio' },
      { status: 500 }
    )
  }
}

// DELETE /api/services/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await PrismaTypedService.deleteServiceCatalog(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting service:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al eliminar servicio' },
      { status: 500 }
    )
  }
}
