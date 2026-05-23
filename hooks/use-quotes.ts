'use client'

import { useState, useEffect, useCallback } from 'react'

export type QuoteStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'expired'

export interface Quote {
  id: string
  number: string
  quote_type: 'sale' | 'rental'
  status: QuoteStatus
  client_id?: string
  client_name: string
  client_company?: string
  client_phone?: string
  client_email?: string
  subtotal: number
  total: number
  currency?: string
  notes?: string
  pdf_url?: string
  valid_until?: string
  created_by: string
  created_at: string
  sent_at?: string
  closed_at?: string
}

export type QuoteItemType = 'standard_module' | 'custom_module' | 'service'

export interface QuoteAdditional {
  id: string
  quote_item_id: string
  material_id?: string
  name: string
  unit_price: number
  quantity: number
  subtotal: number
}

export interface QuoteItem {
  id: string
  quote_id: string
  type: QuoteItemType
  standard_module_id?: string
  name: string
  description?: string
  unit_price: number
  quantity: number
  subtotal: number
  sort_order: number
  module_description?: { section: string; description: string }[] | null
  additionals: QuoteAdditional[]
}

export interface QuoteWithDetails extends Quote {
  items: QuoteItem[]
}

export function useQuotes(userId: string, role: string, statusFilter?: QuoteStatus, quoteTypeFilter?: 'sale' | 'rental') {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ userId, role })
      if (statusFilter) params.set('status', statusFilter)
      if (quoteTypeFilter) params.set('quoteType', quoteTypeFilter)
      const res = await fetch(`/api/quotes?${params}`, { cache: 'no-store' })
      const data = await res.json()
      setQuotes(data.quotes ?? [])
    } finally {
      setLoading(false)
    }
  }, [userId, role, statusFilter, quoteTypeFilter])

  useEffect(() => {
    load()
  }, [load])

  const updateStatus = async (id: string, status: QuoteStatus) => {
    // Optimistic update
    setQuotes((prev) => prev.map((q) => (q.id === id ? { ...q, status } : q)))
    try {
      const res = await fetch(`/api/quotes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
    } catch {
      await load() // revert on failure
    }
  }

  const deleteQuote = async (id: string, userId: string, role: string) => {
    // Optimistic update
    const previous = quotes
    setQuotes((prev) => prev.filter((q) => q.id !== id))
    try {
      const res = await fetch(`/api/quotes/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Error al eliminar')
      }
    } catch {
      setQuotes(previous) // revert on failure
      throw new Error()
    }
  }

  return { quotes, loading, reload: load, updateStatus, deleteQuote }
}
