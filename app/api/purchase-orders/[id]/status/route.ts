import { NextRequest, NextResponse } from 'next/server'
import { PrismaTypedService } from '@/lib/prisma-typed-service'

// PATCH /api/purchase-orders/[id]/status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (!body.status) {
      return NextResponse.json(
        { error: 'El estado es requerido' },
        { status: 400 }
      )
    }

    await PrismaTypedService.updatePurchaseOrderStatus(
      id,
      body.status
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating purchase order status:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al actualizar estado' },
      { status: 500 }
    )
  }
}
