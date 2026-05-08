"use client"

import { useState, useEffect } from 'react'
import type { Supplier } from './use-suppliers'

export interface PurchaseOrderItem {
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
  unit_price: number
  total_price: number
}

export interface PurchaseOrderAttachment {
  id: string
  file_name: string
  file_url: string
  file_type?: string
  uploaded_at: string
}

export interface PurchaseOrder {
  id: string
  order_number: string
  supplier_id: string
  supplier: Supplier
  status: 'draft' | 'pending' | 'approved' | 'received' | 'cancelled'
  items: PurchaseOrderItem[]
  attachments: PurchaseOrderAttachment[]
  subtotal: number
  tax_pct: number
  tax_amount: number
  total: number
  payment_terms?: string
  delivery_terms?: string
  delivery_date?: string
  notes?: string
  created_by?: string
  created_at: string
  updated_at: string
  received_at?: string
}

export interface CreatePurchaseOrderData {
  supplier_id: string
  status?: string
  subtotal?: number
  tax_pct?: number
  tax_amount?: number
  total?: number
  payment_terms?: string
  delivery_terms?: string
  delivery_date?: string
  notes?: string
  created_by?: string
  items: Array<{
    material_id?: string
    description: string
    quantity: number
    unit: string
    unit_price: number
    total_price: number
  }>
}

export interface UpdatePurchaseOrderData {
  supplier_id?: string
  status?: string
  subtotal?: number
  tax_pct?: number
  tax_amount?: number
  total?: number
  payment_terms?: string
  delivery_terms?: string
  delivery_date?: string
  notes?: string
  items?: Array<{
    id?: string
    material_id?: string
    description: string
    quantity: number
    unit: string
    unit_price: number
    total_price: number
  }>
}

export function usePurchaseOrders() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPurchaseOrders = async (filters?: { status?: string; supplier_id?: string }, silent = false) => {
    try {
      if (!silent) setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (filters?.status) params.append('status', filters.status)
      if (filters?.supplier_id) params.append('supplier_id', filters.supplier_id)

      const response = await fetch(`/api/purchase-orders?${params.toString()}`)
      if (!response.ok) throw new Error('Error al cargar órdenes de compra')

      const data = await response.json()
      setPurchaseOrders(data.purchaseOrders ?? [])
    } catch (err) {
      console.error('Error fetching purchase orders:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar órdenes de compra')
    } finally {
      setLoading(false)
    }
  }

  const getPurchaseOrder = async (id: string): Promise<PurchaseOrder> => {
    const response = await fetch(`/api/purchase-orders/${id}`)
    if (!response.ok) throw new Error('Error al obtener orden de compra')
    const data = await response.json()
    return data.purchaseOrder
  }

  const createPurchaseOrder = async (data: CreatePurchaseOrderData): Promise<PurchaseOrder> => {
    const response = await fetch('/api/purchase-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Error al crear orden de compra')
    }

    const result = await response.json()
    await fetchPurchaseOrders(undefined, true)
    return result.purchaseOrder
  }

  const updatePurchaseOrder = async (id: string, data: UpdatePurchaseOrderData): Promise<PurchaseOrder> => {
    const response = await fetch(`/api/purchase-orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Error al actualizar orden de compra')
    }

    const result = await response.json()
    await fetchPurchaseOrders(undefined, true)
    return result.purchaseOrder
  }

  const deletePurchaseOrder = async (id: string): Promise<void> => {
    const response = await fetch(`/api/purchase-orders/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Error al eliminar orden de compra')
    }

    await fetchPurchaseOrders(undefined, true)
  }

  const updatePurchaseOrderStatus = async (id: string, status: string): Promise<void> => {
    const response = await fetch(`/api/purchase-orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Error al actualizar estado')
    }

    await fetchPurchaseOrders(undefined, true)
  }

  useEffect(() => {
    fetchPurchaseOrders()
  }, [])

  return {
    purchaseOrders,
    loading,
    error,
    fetchPurchaseOrders,
    getPurchaseOrder,
    createPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    updatePurchaseOrderStatus,
  }
}
