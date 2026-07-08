import { NextRequest, NextResponse } from 'next/server'
import { PrismaTypedService } from '@/lib/prisma-typed-service'

// GET /api/purchase-orders/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const purchaseOrder = await PrismaTypedService.getPurchaseOrderById(id)
    return NextResponse.json({ purchaseOrder })
  } catch (error) {
    console.error('Error fetching purchase order:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener orden de compra' },
      { status: 500 }
    )
  }
}

// PUT /api/purchase-orders/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const purchaseOrder = await PrismaTypedService.updatePurchaseOrder(id, {
      supplier_id: body.supplier_id,
      purchase_request_id: body.purchase_request_id,
      status: body.status,
      subtotal: body.subtotal,
      tax_pct: body.tax_pct,
      tax_amount: body.tax_amount,
      total: body.total,
      payment_terms: body.payment_terms,
      delivery_terms: body.delivery_terms,
      delivery_date: body.delivery_date,
      notes: body.notes,
      items: body.items,
    })

    return NextResponse.json({ purchaseOrder })
  } catch (error) {
    console.error('Error updating purchase order:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al actualizar orden de compra' },
      { status: 500 }
    )
  }
}

// DELETE /api/purchase-orders/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await PrismaTypedService.deletePurchaseOrder(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting purchase order:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al eliminar orden de compra' },
      { status: 500 }
    )
  }
}
