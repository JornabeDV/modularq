import { NextRequest, NextResponse } from 'next/server'
import { PrismaTypedService } from '@/lib/prisma-typed-service'

// POST /api/rental-contracts/[id]/return
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (!body.return_date) {
      return NextResponse.json(
        { error: 'Fecha de devolución es requerida' },
        { status: 400 }
      )
    }

    const contract = await PrismaTypedService.returnRentalContract(id, {
      return_date: new Date(body.return_date),
      return_notes: body.return_notes,
    })

    return NextResponse.json({ contract })
  } catch (error) {
    console.error('Error returning rental contract:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al registrar devolución' },
      { status: 500 }
    )
  }
}
