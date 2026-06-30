import { NextRequest, NextResponse } from 'next/server'
import { PrismaTypedService } from '@/lib/prisma-typed-service'

// GET /api/purchase-orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') ?? undefined
    const supplier_id = searchParams.get('supplier_id') ?? undefined

    const purchaseOrders = await PrismaTypedService.getAllPurchaseOrders({
      status,
      supplier_id,
    })
    return NextResponse.json({ purchaseOrders })
  } catch (error) {
    console.error('Error fetching purchase orders:', error)
    return NextResponse.json({ error: 'Error al obtener órdenes de compra' }, { status: 500 })
  }
}

// POST /api/purchase-orders
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.supplier_id) {
      return NextResponse.json(
        { error: 'El proveedor es requerido' },
        { status: 400 }
      )
    }

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'La orden debe tener al menos un ítem' },
        { status: 400 }
      )
    }

    const orderNumber = await PrismaTypedService.getNextPurchaseOrderNumber()

    const purchaseOrder = await PrismaTypedService.createPurchaseOrder({
      order_number: orderNumber,
      supplier_id: body.supplier_id,
      purchase_request_id: body.purchase_request_id,
      status: body.status ?? 'draft',
      subtotal: body.subtotal ?? 0,
      tax_pct: body.tax_pct ?? 21,
      tax_amount: body.tax_amount ?? 0,
      total: body.total ?? 0,
      payment_terms: body.payment_terms,
      delivery_terms: body.delivery_terms,
      delivery_date: body.delivery_date,
      notes: body.notes,
      created_by: body.created_by,
      items: body.items,
    })

    return NextResponse.json({ purchaseOrder }, { status: 201 })
  } catch (error) {
    console.error('Error creating purchase order:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al crear orden de compra' },
      { status: 500 }
    )
  }
}
