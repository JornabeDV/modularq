import { NextRequest, NextResponse } from 'next/server'
import { PrismaTypedService } from '@/lib/prisma-typed-service'

// GET /api/purchase-requests
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') ?? undefined
    const search = searchParams.get('search') ?? undefined

    const purchaseRequests = await PrismaTypedService.getAllPurchaseRequests({
      status,
      search,
    })
    return NextResponse.json({ purchaseRequests })
  } catch (error) {
    console.error('Error fetching purchase requests:', error)
    return NextResponse.json(
      { error: 'Error al obtener pedidos de materiales' },
      { status: 500 }
    )
  }
}

// POST /api/purchase-requests
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'El pedido debe tener al menos un ítem' },
        { status: 400 }
      )
    }

    const purchaseRequest = await PrismaTypedService.createPurchaseRequest({
      status: body.status ?? 'draft',
      notes: body.notes,
      created_by: body.created_by,
      items: body.items,
    })

    return NextResponse.json({ purchaseRequest }, { status: 201 })
  } catch (error) {
    console.error('Error creating purchase request:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al crear pedido de materiales' },
      { status: 500 }
    )
  }
}
