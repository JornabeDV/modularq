import { NextRequest, NextResponse } from 'next/server'
import { PrismaTypedService } from '@/lib/prisma-typed-service'

// GET /api/purchase-orders/[id]/receipts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const receipts = await PrismaTypedService.getPurchaseOrderReceipts(id)
    return NextResponse.json({ receipts })
  } catch (error) {
    console.error('Error fetching purchase order receipts:', error)
    return NextResponse.json(
      { error: 'Error al obtener recepciones' },
      { status: 500 }
    )
  }
}

// POST /api/purchase-orders/[id]/receipts
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'La recepción debe tener al menos un ítem' },
        { status: 400 }
      )
    }

    const receipt = await PrismaTypedService.createPurchaseOrderReceipt({
      purchase_order_id: id,
      receipt_number: body.receipt_number,
      remito_number: body.remito_number,
      remito_file_url: body.remito_file_url,
      remito_file_name: body.remito_file_name,
      notes: body.notes,
      created_by: body.created_by,
      items: body.items,
    })

    return NextResponse.json({ receipt }, { status: 201 })
  } catch (error) {
    console.error('Error creating purchase order receipt:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al crear recepción' },
      { status: 500 }
    )
  }
}
