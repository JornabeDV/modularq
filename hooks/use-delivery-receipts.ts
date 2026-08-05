'use client'

import { useState, useEffect, useCallback } from 'react'

export type DeliveryReceiptStatus = 'draft' | 'issued'
export type DeliveryReceiptType = 'sale' | 'rental'

export interface DeliveryReceipt {
  id: string
  number: string
  type: DeliveryReceiptType
  status: DeliveryReceiptStatus
  client_id?: string | null
  client_name: string
  client_company?: string | null
  client_phone?: string | null
  client_email?: string | null
  delivery_address?: string | null
  issue_date: string
  delivery_date?: string | null
  notes?: string | null
  delivery_conditions?: any[] | null
  notes_list?: any[] | null
  pdf_url?: string | null
  created_by: string
  issued_at?: string | null
  created_at: string
  updated_at: string
}

export interface DeliveryReceiptListItem extends DeliveryReceipt {
  item_count?: number
}

export function useDeliveryReceipts(statusFilter?: DeliveryReceiptStatus, search?: string) {
  const [receipts, setReceipts] = useState<DeliveryReceipt[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (search) params.set('search', search)
      const res = await fetch(`/api/delivery-receipts?${params}`, { cache: 'no-store' })
      const data = await res.json()
      setReceipts(data.receipts ?? [])
    } finally {
      setLoading(false)
    }
  }, [statusFilter, search])

  useEffect(() => {
    load()
  }, [load])

  const deleteReceipt = async (id: string, userId: string, role: string) => {
    const previous = receipts
    setReceipts((prev) => prev.filter((r) => r.id !== id))
    try {
      const res = await fetch(`/api/delivery-receipts/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Error al eliminar')
      }
    } catch {
      setReceipts(previous)
      throw new Error('Error al eliminar remito')
    }
  }

  const issueReceipt = async (id: string) => {
    setReceipts((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'issued' as const } : r))
    )
    try {
      const res = await fetch(`/api/delivery-receipts/${id}/issue`, {
        method: 'PATCH',
      })
      if (!res.ok) throw new Error()
    } catch {
      await load()
    }
  }

  const duplicateReceipt = async (id: string, createdBy: string): Promise<string> => {
    const res = await fetch(`/api/delivery-receipts/${id}/duplicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ created_by: createdBy }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || 'Error al duplicar')
    }
    const data = await res.json()
    await load()
    return data.id
  }

  return { receipts, loading, reload: load, deleteReceipt, issueReceipt, duplicateReceipt }
}
