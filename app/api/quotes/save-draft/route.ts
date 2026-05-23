import { NextRequest, NextResponse } from 'next/server'
import { PrismaTypedService } from '@/lib/prisma-typed-service'

// POST /api/quotes/save-draft
// Guarda una cotización como borrador sin generar PDF.
// Body JSON: { quoteData: object, existingQuoteId?: string }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { quoteData, existingQuoteId } = body

    if (!quoteData) {
      return NextResponse.json({ error: 'Faltan datos de la cotización' }, { status: 400 })
    }

    if (existingQuoteId) {
      const updated = await PrismaTypedService.replaceQuote(existingQuoteId, quoteData)
      return NextResponse.json({ quoteId: updated.id, quoteNumber: updated.number })
    } else {
      const number = await PrismaTypedService.generateQuoteNumber(quoteData.quote_type)
      const created = await PrismaTypedService.createQuote({ number, ...quoteData })
      return NextResponse.json({ quoteId: created.id, quoteNumber: created.number })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al guardar la cotización'
    console.error('Error saving draft quote:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
