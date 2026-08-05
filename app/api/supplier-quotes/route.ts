import { NextRequest, NextResponse } from 'next/server'
import { PrismaTypedService } from '@/lib/prisma-typed-service'

// GET /api/supplier-quotes?purchase_request_id=...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const purchaseRequestId = searchParams.get('purchase_request_id')

    if (!purchaseRequestId) {
      return NextResponse.json(
        { error: 'El pedido de materiales es requerido' },
        { status: 400 }
      )
    }

    const supplierQuotes = await PrismaTypedService.getSupplierQuotesByPurchaseRequest(purchaseRequestId)
    return NextResponse.json({ supplierQuotes })
  } catch (error) {
    console.error('Error fetching supplier quotes:', error)
    return NextResponse.json(
      { error: 'Error al obtener presupuestos de proveedores' },
      { status: 500 }
    )
  }
}

// POST /api/supplier-quotes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.purchase_request_id || !body.supplier_id) {
      return NextResponse.json(
        { error: 'El pedido y el proveedor son requeridos' },
        { status: 400 }
      )
    }

    const supplierQuote = await PrismaTypedService.createSupplierQuote({
      purchase_request_id: body.purchase_request_id,
      supplier_id: body.supplier_id,
      total: body.total,
      quote_date: body.quote_date,
      valid_until: body.valid_until,
      file_url: body.file_url,
      file_name: body.file_name,
      status: body.status ?? 'draft',
      notes: body.notes,
    })

    return NextResponse.json({ supplierQuote }, { status: 201 })
  } catch (error) {
    console.error('Error creating supplier quote:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al crear presupuesto de proveedor' },
      { status: 500 }
    )
  }
}
