import { NextRequest, NextResponse } from 'next/server'
import { PrismaTypedService } from '@/lib/prisma-typed-service'

// GET /api/purchase-requests/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const purchaseRequest = await PrismaTypedService.getPurchaseRequestById(id)
    return NextResponse.json({ purchaseRequest })
  } catch (error) {
    console.error('Error fetching purchase request:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener pedido de materiales' },
      { status: 500 }
    )
  }
}

// PUT /api/purchase-requests/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const purchaseRequest = await PrismaTypedService.updatePurchaseRequest(id, {
      status: body.status,
      notes: body.notes,
      items: body.items,
    })

    return NextResponse.json({ purchaseRequest })
  } catch (error) {
    console.error('Error updating purchase request:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al actualizar pedido de materiales' },
      { status: 500 }
    )
  }
}

// DELETE /api/purchase-requests/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await PrismaTypedService.deletePurchaseRequest(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting purchase request:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al eliminar pedido de materiales' },
      { status: 500 }
    )
  }
}
