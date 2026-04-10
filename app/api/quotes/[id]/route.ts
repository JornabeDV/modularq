import { NextRequest, NextResponse } from 'next/server'
import { PrismaTypedService } from '@/lib/prisma-typed-service'

// GET /api/quotes/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const quote = await PrismaTypedService.getQuoteById(params.id)
    if (!quote) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 })
    }
    return NextResponse.json({ quote })
  } catch (error) {
    console.error('Error fetching quote:', error)
    return NextResponse.json({ error: 'Error al obtener cotización' }, { status: 500 })
  }
}

// PATCH /api/quotes/[id]  { status: 'sent' | 'approved' | 'rejected' | 'expired' }
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await request.json()

    const validStatuses = ['draft', 'sent', 'approved', 'rejected', 'expired'] as const
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
    }

    await PrismaTypedService.updateQuoteStatus(params.id, status)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating quote status:', error)
    return NextResponse.json({ error: 'Error al actualizar estado' }, { status: 500 })
  }
}
