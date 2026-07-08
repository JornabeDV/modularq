"use client"

import { useState, useEffect, useCallback } from 'react'
import { PrismaTypedService } from '@/lib/prisma-typed-service'

export type StockMovementType = 'in' | 'out' | 'adjustment'

export type StockMovementSource =
  | 'purchase_receipt'
  | 'project_assignment'
  | 'project_removal'
  | 'project_update'
  | 'manual_adjustment'
  | 'initial_stock'

export interface StockMovement {
  id: string
  materialId: string
  type: StockMovementType
  quantity: number
  stockAfter: number
  sourceType: StockMovementSource
  sourceId?: string
  reference?: string
  notes?: string
  createdBy?: string
  createdAt: string
}

export interface UseStockMovementsReturn {
  movements: StockMovement[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useStockMovements(materialId: string | null) {
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMovements = useCallback(async () => {
    if (!materialId) {
      setMovements([])
      return
    }

    try {
      setLoading(true)
      setError(null)

      const data = await PrismaTypedService.getStockMovementsByMaterial(materialId)

      const formattedMovements: StockMovement[] = data.map((movement: any) => ({
        id: movement.id,
        materialId: movement.material_id,
        type: movement.type,
        quantity: movement.quantity,
        stockAfter: movement.stock_after,
        sourceType: movement.source_type,
        sourceId: movement.source_id,
        reference: movement.reference,
        notes: movement.notes,
        createdBy: movement.created_by,
        createdAt:
          typeof movement.created_at === 'string'
            ? movement.created_at
            : movement.created_at.toISOString()
      }))

      setMovements(formattedMovements)
    } catch (err) {
      console.error('Error fetching stock movements:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar movimientos de stock')
    } finally {
      setLoading(false)
    }
  }, [materialId])

  useEffect(() => {
    fetchMovements()
  }, [fetchMovements])

  return {
    movements,
    loading,
    error,
    refetch: fetchMovements
  }
}

export interface UseMaterialStockAdjustReturn {
  adjustStock: (
    materialId: string,
    newStock: number,
    reason: string
  ) => Promise<{ success: boolean; error?: string; material?: any }>
  loading: boolean
}

export function useMaterialStockAdjust(): UseMaterialStockAdjustReturn {
  const [loading, setLoading] = useState(false)

  const adjustStock = async (
    materialId: string,
    newStock: number,
    reason: string
  ): Promise<{ success: boolean; error?: string; material?: any }> => {
    try {
      setLoading(true)

      const material = await PrismaTypedService.adjustMaterialStock(
        materialId,
        newStock,
        reason
      )

      return { success: true, material }
    } catch (err) {
      console.error('Error adjusting stock:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al ajustar stock'
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return { adjustStock, loading }
}
