import { NextRequest, NextResponse } from 'next/server'
import { PrismaTypedService } from '@/lib/prisma-typed-service'

// PATCH /api/delivery-receipts/[id]/issue
export async function PATCH(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const receipt = await PrismaTypedService.issueDeliveryReceipt(params.id)
    return NextResponse.json({ receipt })
  } catch (error) {
    console.error('Error issuing delivery receipt:', error)
    const message = error instanceof Error ? error.message : 'Error al emitir remito'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
