"use client"

import { useState, useEffect } from 'react'

export interface Supplier {
  id: string
  name: string
  contact_name?: string
  email?: string
  phone?: string
  address?: string
  cuit?: string
  notes?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateSupplierData {
  name: string
  contact_name?: string
  email?: string
  phone?: string
  address?: string
  cuit?: string
  notes?: string
  is_active?: boolean
}

export interface UpdateSupplierData {
  name?: string
  contact_name?: string
  email?: string
  phone?: string
  address?: string
  cuit?: string
  notes?: string
  is_active?: boolean
}

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSuppliers = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      setError(null)

      const response = await fetch('/api/suppliers')
      if (!response.ok) throw new Error('Error al cargar proveedores')

      const data = await response.json()
      setSuppliers(data.suppliers ?? [])
    } catch (err) {
      console.error('Error fetching suppliers:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar proveedores')
    } finally {
      setLoading(false)
    }
  }

  const createSupplier = async (data: CreateSupplierData): Promise<Supplier> => {
    const response = await fetch('/api/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Error al crear proveedor')
    }

    const result = await response.json()
    await fetchSuppliers(true)
    return result.supplier
  }

  const updateSupplier = async (id: string, data: UpdateSupplierData): Promise<Supplier> => {
    const response = await fetch(`/api/suppliers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Error al actualizar proveedor')
    }

    const result = await response.json()
    await fetchSuppliers(true)
    return result.supplier
  }

  const deleteSupplier = async (id: string): Promise<void> => {
    const response = await fetch(`/api/suppliers/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Error al eliminar proveedor')
    }

    await fetchSuppliers(true)
  }

  useEffect(() => {
    fetchSuppliers()
  }, [])

  return {
    suppliers,
    loading,
    error,
    fetchSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
  }
}
