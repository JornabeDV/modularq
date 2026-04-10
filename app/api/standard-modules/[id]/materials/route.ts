import { NextRequest, NextResponse } from 'next/server'
import { PrismaTypedService } from '@/lib/prisma-typed-service'

// POST /api/standard-modules/[id]/materials
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { material_id, quantity, notes } = body

    if (!material_id) {
      return NextResponse.json({ error: 'El material es requerido' }, { status: 400 })
    }

    const item = await PrismaTypedService.addStandardModuleMaterial(
      params.id,
      material_id,
      quantity ?? 1,
      notes
    )

    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    console.error('Error adding module material:', error)
    return NextResponse.json({ error: 'Error al agregar material' }, { status: 500 })
  }
}
