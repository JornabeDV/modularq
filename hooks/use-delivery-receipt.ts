'use client'

import { useState, useEffect, useCallback } from 'react'
import type { DeliveryReceiptStatus, DeliveryReceiptType } from './use-delivery-receipts'

export interface DeliveryReceiptItemAdditional {
  id: string
  receipt_item_id: string
  material_id?: string | null
  name: string
  quantity: number
}

export interface DeliveryReceiptItemAttachment {
  id: string
  receipt_item_id: string
  filename: string
  original_name: string
  mime_type: string
  size: number
  url: string
  storage_path: string
}

export interface DeliveryReceiptItem {
  id: string
  delivery_receipt_id: string
  type: 'standard_module' | 'custom_module' | 'service'
  standard_module_id?: string | null
  name: string
  description?: string | null
  quantity: number
  sort_order: number
  module_description?: { section: string; description: string }[] | null
  is_optional: boolean
  additionals: DeliveryReceiptItemAdditional[]
  attachments: DeliveryReceiptItemAttachment[]
}

export interface DeliveryReceiptWithItems {
  id: string
  number: string
  type: DeliveryReceiptType
  status: DeliveryReceiptStatus
  client_id?: string | null
  client_name: string
  client_company?: string | null
  client_cuit?: string | null
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
  items: DeliveryReceiptItem[]
}

export function useDeliveryReceipt(id?: string | null) {
  const [receipt, setReceipt] = useState<DeliveryReceiptWithItems | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!id) {
      setReceipt(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/delivery-receipts/${id}`, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al cargar remito')
      setReceipt(data.receipt)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setReceipt(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const save = async (
    body: Record<string, unknown>,
    mode: 'create' | 'update'
  ): Promise<{ id: string; number: string }> => {
    const url =
      mode === 'create' ? '/api/delivery-receipts' : `/api/delivery-receipts/${id}`
    const method = mode === 'create' ? 'POST' : 'PUT'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Error al guardar remito')
    await load()
    return data
  }

  const issue = async () => {
    if (!id) throw new Error('ID no disponible')
    const res = await fetch(`/api/delivery-receipts/${id}/issue`, { method: 'PATCH' })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Error al emitir remito')
    await load()
  }

  const generatePdf = async (): Promise<string> => {
    if (!id) throw new Error('ID no disponible')
    const res = await fetch('/api/delivery-receipts/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiptId: id }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Error al generar PDF')
    await load()
    return data.url
  }

  return { receipt, loading, error, reload: load, save, issue, generatePdf }
}
