import { NextRequest, NextResponse } from 'next/server'
import { PrismaTypedService } from '@/lib/prisma-typed-service'

// GET /api/delivery-receipts/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const receipt = await PrismaTypedService.getDeliveryReceiptById(params.id)
    if (!receipt) {
      return NextResponse.json(
        { error: 'Remito no encontrado' },
        { status: 404 }
      )
    }
    return NextResponse.json({ receipt })
  } catch (error) {
    console.error('Error fetching delivery receipt:', error)
    return NextResponse.json(
      { error: 'Error al obtener remito' },
      { status: 500 }
    )
  }
}

// PUT /api/delivery-receipts/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    if (!body.client_name || !body.items?.length) {
      return NextResponse.json(
        { error: 'Faltan datos obligatorios del remito' },
        { status: 400 }
      )
    }

    const result = await PrismaTypedService.replaceDeliveryReceipt(
      params.id,
      {
        type: body.type,
        client_id: body.client_id ?? null,
        client_name: body.client_name,
        client_company: body.client_company,
        client_phone: body.client_phone,
        client_email: body.client_email,
        delivery_address: body.delivery_address,
        delivery_date: body.delivery_date,
        notes: body.notes,
        notes_list: body.notes_list,
        items: body.items,
      }
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating delivery receipt:', error)
    const message = error instanceof Error ? error.message : 'Error al actualizar remito'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE /api/delivery-receipts/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}))
    const receipt = await PrismaTypedService.getDeliveryReceiptById(params.id)

    if (!receipt) {
      return NextResponse.json(
        { error: 'Remito no encontrado' },
        { status: 404 }
      )
    }

    const canDelete =
      body.role === 'admin' ||
      body.role === 'supervisor' ||
      (receipt.created_by === body.userId && receipt.status === 'draft')

    if (!canDelete) {
      return NextResponse.json(
        { error: 'No tenés permiso para eliminar este remito' },
        { status: 403 }
      )
    }

    await PrismaTypedService.deleteDeliveryReceipt(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting delivery receipt:', error)
    const message = error instanceof Error ? error.message : 'Error al eliminar remito'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
