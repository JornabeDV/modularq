import { NextRequest, NextResponse } from 'next/server'
import { PrismaTypedService } from '@/lib/prisma-typed-service'

// DELETE /api/purchase-orders/[id]/receipts/[receiptId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; receiptId: string }> }
) {
  try {
    const { receiptId } = await params
    const body = await request.json().catch(() => ({}))
    await PrismaTypedService.deletePurchaseOrderReceipt(receiptId, body.created_by)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting purchase order receipt:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al eliminar recepción' },
      { status: 500 }
    )
  }
}
