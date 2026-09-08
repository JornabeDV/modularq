"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'

export type MaterialUnit =
  | 'unidad'
  | 'metro'
  | 'metro_cuadrado'
  | 'metro_cubico'
  | 'kilogramo'
  | 'litro'

export interface StockMaterial {
  id: string
  code: string
  name: string
  description?: string
  category: string
  categoryId: string
  categoryName?: string
  unit: MaterialUnit
  stockQuantity: number
  minStock: number
  unitPrice?: number
  currency: 'ARS' | 'USD'
  unitPriceARS?: number | null
  precioVenta?: number | null
  exchangeRate?: number | null
  exchangeRateDate?: string | null
  supplier?: string
  brand?: string
  createdAt: string
  updatedAt: string
}

export function useStockMaterials() {
  const [materials, setMaterials] = useState<StockMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMaterials = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      setError(null)

      const res = await fetch('/api/materials?inStock=true&excludeAdicionales=true', {
        cache: 'no-store',
      })
      if (!res.ok) throw new Error('Error al cargar materiales')
      const data = await res.json()
      setMaterials(data.materials ?? [])
    } catch (err) {
      console.error('Error fetching stock materials:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar materiales')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMaterials()
  }, [fetchMaterials])

  const categories = useMemo(() => {
    const seen: Record<string, { id: string; name: string; slug: string }> = {}
    for (const m of materials) {
      if (!seen[m.category]) {
        seen[m.category] = { id: m.categoryId, name: m.categoryName || m.category, slug: m.category }
      }
    }
    return Object.values(seen).sort((a, b) => a.name.localeCompare(b.name))
  }, [materials])

  const getMaterialById = (id: string): StockMaterial | undefined =>
    materials.find((m) => m.id === id)

  return {
    materials,
    loading,
    error,
    categories,
    getMaterialById,
    refetch: fetchMaterials,
  }
}

