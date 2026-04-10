import { NextRequest, NextResponse } from 'next/server'
import { PrismaTypedService } from '@/lib/prisma-typed-service'

// PUT /api/standard-modules/[id]/materials/[materialId]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; materialId: string } }
) {
  try {
    const body = await request.json()
    const { quantity, notes } = body

    const item = await PrismaTypedService.updateStandardModuleMaterial(
      params.materialId,
      quantity,
      notes
    )

    return NextResponse.json({ item })
  } catch (error) {
    console.error('Error updating module material:', error)
    return NextResponse.json({ error: 'Error al actualizar material' }, { status: 500 })
  }
}

// DELETE /api/standard-modules/[id]/materials/[materialId]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; materialId: string } }
) {
  try {
    await PrismaTypedService.removeStandardModuleMaterial(params.materialId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing module material:', error)
    return NextResponse.json({ error: 'Error al quitar material' }, { status: 500 })
  }
}
