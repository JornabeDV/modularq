"use client"

import { useState, useEffect, useCallback } from 'react'
import type { Supplier } from './use-suppliers'

export interface SupplierQuote {
  id: string
  purchase_request_id: string
  supplier_id: string
  supplier: Supplier
  total: number
  quote_date?: string
  valid_until?: string
  file_url?: string
  file_name?: string
  status: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface CreateSupplierQuoteData {
  purchase_request_id: string
  supplier_id: string
  total?: number
  quote_date?: string
  valid_until?: string
  file_url?: string
  file_name?: string
  status?: string
  notes?: string
}

export interface UpdateSupplierQuoteData {
  supplier_id?: string
  total?: number
  quote_date?: string
  valid_until?: string
  file_url?: string
  file_name?: string
  status?: string
  notes?: string
}

export function useSupplierQuotes(purchaseRequestId?: string) {
  const [supplierQuotes, setSupplierQuotes] = useState<SupplierQuote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSupplierQuotes = useCallback(async (silent = false) => {
    if (!purchaseRequestId) {
      setSupplierQuotes([])
      setLoading(false)
      return
    }

    try {
      if (!silent) setLoading(true)
      setError(null)

      const response = await fetch(`/api/supplier-quotes?purchase_request_id=${purchaseRequestId}`)
      if (!response.ok) throw new Error('Error al cargar presupuestos de proveedores')

      const data = await response.json()
      setSupplierQuotes(data.supplierQuotes ?? [])
    } catch (err) {
      console.error('Error fetching supplier quotes:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar presupuestos de proveedores')
    } finally {
      setLoading(false)
    }
  }, [purchaseRequestId])

  const getSupplierQuote = async (id: string): Promise<SupplierQuote> => {
    const response = await fetch(`/api/supplier-quotes/${id}`)
    if (!response.ok) throw new Error('Error al obtener presupuesto de proveedor')
    const data = await response.json()
    return data.supplierQuote
  }

  const createSupplierQuote = async (data: CreateSupplierQuoteData): Promise<SupplierQuote> => {
    const response = await fetch('/api/supplier-quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Error al crear presupuesto de proveedor')
    }

    const result = await response.json()
    await fetchSupplierQuotes(true)
    return result.supplierQuote
  }

  const updateSupplierQuote = async (id: string, data: UpdateSupplierQuoteData): Promise<SupplierQuote> => {
    const response = await fetch(`/api/supplier-quotes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Error al actualizar presupuesto de proveedor')
    }

    const result = await response.json()
    await fetchSupplierQuotes(true)
    return result.supplierQuote
  }

  const deleteSupplierQuote = async (id: string): Promise<void> => {
    const response = await fetch(`/api/supplier-quotes/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Error al eliminar presupuesto de proveedor')
    }

    await fetchSupplierQuotes(true)
  }

  useEffect(() => {
    fetchSupplierQuotes()
  }, [fetchSupplierQuotes])

  return {
    supplierQuotes,
    loading,
    error,
    fetchSupplierQuotes,
    getSupplierQuote,
    createSupplierQuote,
    updateSupplierQuote,
    deleteSupplierQuote,
  }
}
