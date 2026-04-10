import { NextRequest, NextResponse } from 'next/server'
import { PrismaTypedService } from '@/lib/prisma-typed-service'

// GET /api/quotes?status=draft&userId=...&role=...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') ?? ''
    const role = searchParams.get('role') ?? 'supervisor'
    const status = searchParams.get('status') ?? undefined

    const quotes = await PrismaTypedService.getQuotes(userId, role, status)
    return NextResponse.json({ quotes })
  } catch (error) {
    console.error('Error fetching quotes:', error)
    return NextResponse.json({ error: 'Error al obtener cotizaciones' }, { status: 500 })
  }
}
