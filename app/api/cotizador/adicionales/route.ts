import { NextResponse } from 'next/server'
import { PrismaTypedService } from '@/lib/prisma-typed-service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/cotizador/adicionales
export async function GET() {
  try {
    const adicionales = await PrismaTypedService.getAdicionales()
    console.log(`[adicionales] fetched ${adicionales?.length ?? 0} items at ${new Date().toISOString()}`)
    return NextResponse.json(
      { adicionales, fetchedAt: new Date().toISOString() },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching adicionales:', error)
    return NextResponse.json({ error: 'Error al obtener adicionales' }, { status: 500 })
  }
}
