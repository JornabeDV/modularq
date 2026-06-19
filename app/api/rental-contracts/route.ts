import { NextRequest, NextResponse } from 'next/server'
import { PrismaTypedService } from '@/lib/prisma-typed-service'

// GET /api/rental-contracts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined
    const rental_module_id = searchParams.get('rental_module_id') || undefined
    const client_id = searchParams.get('client_id') || undefined

    const contracts = await PrismaTypedService.getRentalContracts({
      status: status || undefined,
      rental_module_id: rental_module_id || undefined,
      client_id: client_id || undefined,
    })
    return NextResponse.json({ contracts })
  } catch (error) {
    console.error('Error fetching rental contracts:', error)
    return NextResponse.json({ error: 'Error al obtener contratos' }, { status: 500 })
  }
}

// POST /api/rental-contracts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.rental_module_id || !body.client_id || !body.start_date || typeof body.monthly_price !== 'number') {
      return NextResponse.json(
        { error: 'Módulo, cliente, fecha de inicio y precio mensual son requeridos' },
        { status: 400 }
      )
    }

    const contract = await PrismaTypedService.createRentalContract({
      rental_module_id: body.rental_module_id,
      client_id: body.client_id,
      quote_id: body.quote_id,
      start_date: new Date(body.start_date),
      end_date: body.end_date ? new Date(body.end_date) : undefined,
      delivery_date: body.delivery_date ? new Date(body.delivery_date) : undefined,
      monthly_price: body.monthly_price,
      deposit_amount: body.deposit_amount,
      currency: body.currency,
      delivery_notes: body.delivery_notes,
      created_by: body.created_by,
    })

    return NextResponse.json({ contract }, { status: 201 })
  } catch (error) {
    console.error('Error creating rental contract:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al crear contrato' },
      { status: 500 }
    )
  }
}
