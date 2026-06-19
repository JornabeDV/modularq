"use client"

import { useState, useEffect, useCallback } from 'react'
import type { RentalContract } from '@/lib/types'

export function useRentalContracts() {
  const [contracts, setContracts] = useState<RentalContract[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchContracts = useCallback(async (filters?: { status?: string; rental_module_id?: string; client_id?: string }) => {
    try {
      setLoading(true)
      setError(null)
      const query = new URLSearchParams()
      if (filters?.status) query.set('status', filters.status)
      if (filters?.rental_module_id) query.set('rental_module_id', filters.rental_module_id)
      if (filters?.client_id) query.set('client_id', filters.client_id)

      const res = await fetch(`/api/rental-contracts?${query.toString()}`)
      if (!res.ok) throw new Error('Error al cargar contratos')
      const data = await res.json()
      setContracts(data.contracts || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [])

  const createContract = useCallback(async (input: Partial<RentalContract> & { rental_module_id: string; client_id: string; start_date: string; monthly_price: number; created_by: string }) => {
    const res = await fetch('/api/rental-contracts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al crear contrato')
    }
    const data = await res.json()
    setContracts((prev) => [data.contract, ...prev])
    return data.contract
  }, [])

  const updateContract = useCallback(async (id: string, input: Partial<RentalContract>) => {
    const res = await fetch(`/api/rental-contracts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al actualizar contrato')
    }
    const data = await res.json()
    setContracts((prev) => prev.map((c) => (c.id === id ? data.contract : c)))
    return data.contract
  }, [])

  const returnContract = useCallback(async (id: string, input: { return_date: string; return_notes?: string }) => {
    const res = await fetch(`/api/rental-contracts/${id}/return`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al registrar devolución')
    }
    const data = await res.json()
    setContracts((prev) => prev.map((c) => (c.id === id ? data.contract : c)))
    return data.contract
  }, [])

  useEffect(() => {
    fetchContracts()
  }, [fetchContracts])

  return { contracts, loading, error, fetchContracts, createContract, updateContract, returnContract, refetch: fetchContracts }
}

export function useRentalContract(id?: string) {
  const [contract, setContract] = useState<RentalContract | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchContract = useCallback(async () => {
    if (!id) return
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/rental-contracts/${id}`)
      if (!res.ok) throw new Error('Error al cargar contrato')
      const data = await res.json()
      setContract(data.contract)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchContract()
  }, [fetchContract])

  return { contract, loading, error, refetch: fetchContract }
}
