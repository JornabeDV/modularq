import { NextRequest, NextResponse } from 'next/server'
import { PrismaTypedService } from '@/lib/prisma-typed-service'

// GET /api/rental-contracts/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const contract = await PrismaTypedService.getRentalContractById(id)
    return NextResponse.json({ contract })
  } catch (error) {
    console.error('Error fetching rental contract:', error)
    return NextResponse.json({ error: 'Error al obtener contrato' }, { status: 500 })
  }
}

// PATCH /api/rental-contracts/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const contract = await PrismaTypedService.updateRentalContract(id, {
      client_id: body.client_id,
      quote_id: body.quote_id,
      start_date: body.start_date ? new Date(body.start_date) : undefined,
      end_date: body.end_date !== undefined ? (body.end_date ? new Date(body.end_date) : null) : undefined,
      delivery_date: body.delivery_date !== undefined ? (body.delivery_date ? new Date(body.delivery_date) : null) : undefined,
      return_date: body.return_date !== undefined ? (body.return_date ? new Date(body.return_date) : null) : undefined,
      monthly_price: body.monthly_price,
      deposit_amount: body.deposit_amount !== undefined ? body.deposit_amount : undefined,
      currency: body.currency,
      status: body.status,
      delivery_notes: body.delivery_notes,
      return_notes: body.return_notes,
    })

    return NextResponse.json({ contract })
  } catch (error) {
    console.error('Error updating rental contract:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al actualizar contrato' },
      { status: 500 }
    )
  }
}
