import { NextRequest, NextResponse } from 'next/server'
import { PrismaTypedService } from '@/lib/prisma-typed-service'

// GET /api/quotes/approved?quoteType=sale|rental
// Devuelve cotizaciones aprobadas que aún no tienen proyecto asociado
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const quoteType = searchParams.get('quoteType') as 'sale' | 'rental' | undefined

    const quotes = await PrismaTypedService.getApprovedQuotesWithoutProject(quoteType)
    return NextResponse.json({ quotes })
  } catch (error) {
    console.error('Error fetching approved quotes:', error)
    return NextResponse.json({ error: 'Error al obtener cotizaciones aprobadas' }, { status: 500 })
  }
}
