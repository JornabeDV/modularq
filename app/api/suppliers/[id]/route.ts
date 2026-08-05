import { NextRequest, NextResponse } from 'next/server'
import { PrismaTypedService } from '@/lib/prisma-typed-service'

// PUT /api/suppliers/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const supplier = await PrismaTypedService.updateSupplier(id, {
      name: body.name,
      contact_name: body.contact_name,
      email: body.email,
      phone: body.phone,
      address: body.address,
      cuit: body.cuit,
      notes: body.notes,
      is_active: body.is_active,
    })

    return NextResponse.json({ supplier })
  } catch (error) {
    console.error('Error updating supplier:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al actualizar proveedor' },
      { status: 500 }
    )
  }
}

// DELETE /api/suppliers/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await PrismaTypedService.deleteSupplier(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting supplier:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al eliminar proveedor' },
      { status: 500 }
    )
  }
}
