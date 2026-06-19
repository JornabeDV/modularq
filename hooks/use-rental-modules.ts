"use client"

import { useState, useEffect, useCallback } from 'react'
import type { RentalModule } from '@/lib/types'

export function useRentalModules() {
  const [modules, setModules] = useState<RentalModule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchModules = useCallback(async (filters?: { status?: string; project_id?: string }) => {
    try {
      setLoading(true)
      setError(null)
      const query = new URLSearchParams()
      if (filters?.status) query.set('status', filters.status)
      if (filters?.project_id) query.set('project_id', filters.project_id)

      const res = await fetch(`/api/rental-modules?${query.toString()}`)
      if (!res.ok) throw new Error('Error al cargar módulos')
      const data = await res.json()
      setModules(data.modules || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [])

  const createModule = useCallback(async (input: Partial<RentalModule>) => {
    const res = await fetch('/api/rental-modules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al crear módulo')
    }
    const data = await res.json()
    setModules((prev) => [data.module, ...prev])
    return data.module
  }, [])

  const updateModule = useCallback(async (id: string, input: Partial<RentalModule>) => {
    const res = await fetch(`/api/rental-modules/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al actualizar módulo')
    }
    const data = await res.json()
    setModules((prev) => prev.map((m) => (m.id === id ? data.module : m)))
    return data.module
  }, [])

  useEffect(() => {
    fetchModules()
  }, [fetchModules])

  return { modules, loading, error, fetchModules, createModule, updateModule, refetch: fetchModules }
}

export function useRentalModule(id?: string) {
  const [module, setModule] = useState<RentalModule | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchModule = useCallback(async () => {
    if (!id) return
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/rental-modules/${id}`)
      if (!res.ok) throw new Error('Error al cargar módulo')
      const data = await res.json()
      setModule(data.module)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchModule()
  }, [fetchModule])

  return { module, loading, error, refetch: fetchModule }
}
