import { NextRequest, NextResponse } from 'next/server'
import { PrismaTypedService } from '@/lib/prisma-typed-service'

// GET /api/standard-modules/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const module = await PrismaTypedService.getStandardModuleById(params.id)
    if (!module) {
      return NextResponse.json({ error: 'Módulo no encontrado' }, { status: 404 })
    }
    return NextResponse.json({ module })
  } catch (error) {
    console.error('Error fetching standard module:', error)
    return NextResponse.json({ error: 'Error al obtener módulo' }, { status: 500 })
  }
}

// PUT /api/standard-modules/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, description, base_price, is_active, order } = body

    if (name !== undefined && !name?.trim()) {
      return NextResponse.json({ error: 'El nombre no puede estar vacío' }, { status: 400 })
    }

    const module = await PrismaTypedService.updateStandardModule(params.id, {
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description: description?.trim() || undefined }),
      ...(base_price !== undefined && { base_price }),
      ...(is_active !== undefined && { is_active }),
      ...(order !== undefined && { order }),
    })

    return NextResponse.json({ module })
  } catch (error) {
    console.error('Error updating standard module:', error)
    return NextResponse.json({ error: 'Error al actualizar módulo' }, { status: 500 })
  }
}

// DELETE /api/standard-modules/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await PrismaTypedService.deleteStandardModule(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting standard module:', error)
    return NextResponse.json({ error: 'Error al eliminar módulo' }, { status: 500 })
  }
}
