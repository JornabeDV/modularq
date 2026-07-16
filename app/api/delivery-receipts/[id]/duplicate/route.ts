import { NextRequest, NextResponse } from 'next/server'
import { PrismaTypedService } from '@/lib/prisma-typed-service'

// POST /api/delivery-receipts/[id]/duplicate
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    if (!body.created_by) {
      return NextResponse.json(
        { error: 'Falta el identificador de usuario' },
        { status: 400 }
      )
    }

    const result = await PrismaTypedService.duplicateDeliveryReceipt(
      params.id,
      body.created_by
    )

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error duplicating delivery receipt:', error)
    const message = error instanceof Error ? error.message : 'Error al duplicar remito'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
