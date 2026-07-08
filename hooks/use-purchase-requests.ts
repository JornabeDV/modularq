"use client"

import { useState, useEffect } from 'react'

export interface PurchaseRequestItem {
  id?: string
  material_id?: string
  material?: {
    id: string
    code: string
    name: string
    unit: string
  } | null
  description: string
  quantity: number
  unit: string
}

export interface SupplierQuoteSummary {
  id: string
  supplier_id: string
  supplier: {
    id: string
    name: string
  }
  total: number
  status: string
  file_url?: string
  file_name?: string
}

export interface PurchaseOrderSummary {
  id: string
  order_number: string
  status: string
  total: number
  supplier?: {
    id: string
    name: string
  }
}

export interface PurchaseRequest {
  id: string
  request_number: string
  status: 'draft' | 'pending' | 'quoted' | 'approved' | 'rejected' | 'cancelled'
  notes?: string
  items: PurchaseRequestItem[]
  supplier_quotes: SupplierQuoteSummary[]
  purchase_orders: PurchaseOrderSummary[]
  created_by?: string
  created_at: string
  updated_at: string
}

export interface CreatePurchaseRequestData {
  status?: string
  notes?: string
  created_by?: string
  items: Array<{
    material_id?: string
    description: string
    quantity: number
    unit: string
  }>
}

export interface UpdatePurchaseRequestData {
  status?: string
  notes?: string
  items?: Array<{
    id?: string
    material_id?: string
    description: string
    quantity: number
    unit: string
  }>
}

export function usePurchaseRequests() {
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPurchaseRequests = async (filters?: { status?: string; search?: string }, silent = false) => {
    try {
      if (!silent) setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (filters?.status) params.append('status', filters.status)
      if (filters?.search) params.append('search', filters.search)

      const response = await fetch(`/api/purchase-requests?${params.toString()}`)
      if (!response.ok) throw new Error('Error al cargar pedidos de materiales')

      const data = await response.json()
      setPurchaseRequests(data.purchaseRequests ?? [])
    } catch (err) {
      console.error('Error fetching purchase requests:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar pedidos de materiales')
    } finally {
      setLoading(false)
    }
  }

  const getPurchaseRequest = async (id: string): Promise<PurchaseRequest> => {
    const response = await fetch(`/api/purchase-requests/${id}`)
    if (!response.ok) throw new Error('Error al obtener pedido de materiales')
    const data = await response.json()
    return data.purchaseRequest
  }

  const createPurchaseRequest = async (data: CreatePurchaseRequestData): Promise<PurchaseRequest> => {
    const response = await fetch('/api/purchase-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Error al crear pedido de materiales')
    }

    const result = await response.json()
    await fetchPurchaseRequests(undefined, true)
    return result.purchaseRequest
  }

  const updatePurchaseRequest = async (id: string, data: UpdatePurchaseRequestData): Promise<PurchaseRequest> => {
    const response = await fetch(`/api/purchase-requests/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Error al actualizar pedido de materiales')
    }

    const result = await response.json()
    await fetchPurchaseRequests(undefined, true)
    return result.purchaseRequest
  }

  const deletePurchaseRequest = async (id: string): Promise<void> => {
    const response = await fetch(`/api/purchase-requests/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Error al eliminar pedido de materiales')
    }

    await fetchPurchaseRequests(undefined, true)
  }

  useEffect(() => {
    fetchPurchaseRequests()
  }, [])

  return {
    purchaseRequests,
    loading,
    error,
    fetchPurchaseRequests,
    getPurchaseRequest,
    createPurchaseRequest,
    updatePurchaseRequest,
    deletePurchaseRequest,
  }
}
