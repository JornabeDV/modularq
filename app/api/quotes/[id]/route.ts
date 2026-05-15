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

// DELETE /api/quotes/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, role } = await request.json()

    if (!userId || !role) {
      return NextResponse.json({ error: 'Faltan datos de usuario' }, { status: 400 })
    }

    const quote = await PrismaTypedService.getQuoteById(params.id)
    if (!quote) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 })
    }

    // Permisos:
    // - Admin / Supervisor: pueden eliminar cualquier cotización
    // - Vendedor: solo sus propios borradores
    const canDelete =
      role === 'admin' ||
      role === 'supervisor' ||
      (role === 'vendedor' && quote.created_by === userId && quote.status === 'draft')

    if (!canDelete) {
      return NextResponse.json({ error: 'No tenés permiso para eliminar esta cotización' }, { status: 403 })
    }

    await PrismaTypedService.deleteQuote(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting quote:', error)
    return NextResponse.json({ error: 'Error al eliminar cotización' }, { status: 500 })
  }
}
