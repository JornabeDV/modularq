import { NextRequest, NextResponse } from 'next/server'
import { PrismaTypedService } from '@/lib/prisma-typed-service'

// GET /api/suppliers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') !== 'false'

    const suppliers = await PrismaTypedService.getAllSuppliers(activeOnly)
    return NextResponse.json({ suppliers })
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return NextResponse.json({ error: 'Error al obtener proveedores' }, { status: 500 })
  }
}

// POST /api/suppliers
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.name) {
      return NextResponse.json(
        { error: 'El nombre del proveedor es requerido' },
        { status: 400 }
      )
    }

    const supplier = await PrismaTypedService.createSupplier({
      name: body.name,
      contact_name: body.contact_name,
      email: body.email,
      phone: body.phone,
      address: body.address,
      cuit: body.cuit,
      notes: body.notes,
      is_active: body.is_active,
    })

    return NextResponse.json({ supplier }, { status: 201 })
  } catch (error) {
    console.error('Error creating supplier:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al crear proveedor' },
      { status: 500 }
    )
  }
}
