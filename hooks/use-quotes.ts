'use client'

import { useState, useEffect, useCallback } from 'react'

export type QuoteStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'expired'

export interface Quote {
  id: string
  number: string
  status: QuoteStatus
  client_id?: string
  client_name: string
  client_company?: string
  client_phone?: string
  client_email?: string
  subtotal: number
  total: number
  notes?: string
  pdf_url?: string
  valid_until?: string
  created_by: string
  created_at: string
  sent_at?: string
  closed_at?: string
}

export interface QuoteAdditional {
  id: string
  quote_module_id: string
  material_id?: string
  name: string
  unit_price: number
  quantity: number
  subtotal: number
}

export interface QuoteModule {
  id: string
  quote_id: string
  standard_module_id?: string
  module_name: string
  module_description?: string
  base_price: number
  subtotal: number
  sort_order: number
  additionals: QuoteAdditional[]
}

export interface QuoteWithDetails extends Quote {
  modules: QuoteModule[]
}

export function useQuotes(userId: string, role: string, statusFilter?: QuoteStatus) {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ userId, role })
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`/api/quotes?${params}`)
      const data = await res.json()
      setQuotes(data.quotes ?? [])
    } finally {
      setLoading(false)
    }
  }, [userId, role, statusFilter])

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

  return { quotes, loading, reload: load, updateStatus }
}
