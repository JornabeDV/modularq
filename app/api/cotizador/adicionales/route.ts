import { NextResponse } from 'next/server'
import { unstable_noStore } from 'next/cache'
import { PrismaTypedService } from '@/lib/prisma-typed-service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/cotizador/adicionales
export async function GET() {
  // Fuerza a Next.js a no cachear esta ruta en producción
  unstable_noStore()

  try {
    const adicionales = await PrismaTypedService.getAdicionales()
    return NextResponse.json(
      { adicionales },
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
