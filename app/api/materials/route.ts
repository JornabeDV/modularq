import { NextRequest, NextResponse } from 'next/server'
import { unstable_noStore } from 'next/cache'
import { PrismaTypedService } from '@/lib/prisma-typed-service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function formatMaterial(material: any) {
  const category = material.category || {}
  return {
    id: material.id,
    code: material.code,
    name: material.name,
    description: material.description,
    category: category.slug || material.category_id,
    categoryId: material.category_id,
    categoryName: category.name,
    unit: material.unit,
    stockQuantity: material.stock_quantity ?? 0,
    minStock: material.min_stock ?? 0,
    unitPrice: material.unit_price,
    currency: material.currency || 'ARS',
     unitPriceARS: material.unit_price_ars,
    precioVenta: material.precio_venta,
    exchangeRate: material.exchange_rate,
    exchangeRateDate: material.exchange_rate_date,
    supplier: material.supplier,
    brand: material.brand,
    createdAt: material.created_at,
    updatedAt: material.updated_at,
  }
}

// GET /api/materials
export async function GET(request: NextRequest) {
  unstable_noStore()

  try {
    const { searchParams } = new URL(request.url)
    const inStockOnly = searchParams.get('inStock') !== 'false'
    const excludeAdicionales = searchParams.get('excludeAdicionales') !== 'false'

    const data = await PrismaTypedService.getAllMaterials()

    let materials = data

    if (inStockOnly) {
      materials = materials.filter((m: any) => (m.stock_quantity ?? 0) > 0)
    }

    if (excludeAdicionales) {
      const adicionalCategory = await PrismaTypedService.getMaterialCategoryBySlug('adicional')
      const adicionalCategoryId = adicionalCategory?.id
      if (adicionalCategoryId) {
        materials = materials.filter((m: any) => m.category_id !== adicionalCategoryId)
      }
    }

    const formatted = materials.map(formatMaterial).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    return NextResponse.json(
      { materials: formatted },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching materials:', error)
    return NextResponse.json(
      { error: 'Error al obtener materiales' },
      { status: 500 }
    )
  }
}
