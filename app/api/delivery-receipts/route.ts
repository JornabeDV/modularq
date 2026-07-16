import { NextRequest, NextResponse } from 'next/server'
import { PrismaTypedService } from '@/lib/prisma-typed-service'

// GET /api/delivery-receipts?status=...&search=...&clientId=...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') ?? undefined
    const search = searchParams.get('search') ?? undefined
    const clientId = searchParams.get('clientId') ?? undefined

    const receipts = await PrismaTypedService.getAllDeliveryReceipts({
      status,
      search,
      clientId,
    })

    return NextResponse.json({ receipts })
  } catch (error) {
    console.error('Error fetching delivery receipts:', error)
    return NextResponse.json(
      { error: 'Error al obtener remitos' },
      { status: 500 }
    )
  }
}

// POST /api/delivery-receipts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.client_name || !body.created_by || !body.items?.length) {
      return NextResponse.json(
        { error: 'Faltan datos obligatorios del remito' },
        { status: 400 }
      )
    }

    const result = await PrismaTypedService.createDeliveryReceipt({
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
      created_by: body.created_by,
      items: body.items,
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating delivery receipt:', error)
    const message = error instanceof Error ? error.message : 'Error al crear remito'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
