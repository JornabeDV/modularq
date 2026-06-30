import { NextRequest, NextResponse } from 'next/server'
import { PrismaTypedService } from '@/lib/prisma-typed-service'

// GET /api/supplier-quotes/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supplierQuote = await PrismaTypedService.getSupplierQuoteById(id)
    return NextResponse.json({ supplierQuote })
  } catch (error) {
    console.error('Error fetching supplier quote:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener presupuesto de proveedor' },
      { status: 500 }
    )
  }
}

// PUT /api/supplier-quotes/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const supplierQuote = await PrismaTypedService.updateSupplierQuote(id, {
      supplier_id: body.supplier_id,
      total: body.total,
      quote_date: body.quote_date,
      valid_until: body.valid_until,
      file_url: body.file_url,
      file_name: body.file_name,
      status: body.status,
      notes: body.notes,
    })

    return NextResponse.json({ supplierQuote })
  } catch (error) {
    console.error('Error updating supplier quote:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al actualizar presupuesto de proveedor' },
      { status: 500 }
    )
  }
}

// DELETE /api/supplier-quotes/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await PrismaTypedService.deleteSupplierQuote(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting supplier quote:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al eliminar presupuesto de proveedor' },
      { status: 500 }
    )
  }
}
