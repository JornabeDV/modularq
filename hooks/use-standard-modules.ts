"use client"

import { useState, useEffect, useCallback } from 'react'

export interface StandardModuleAttachment {
  id: string
  module_id: string
  filename: string
  original_name: string
  mime_type: string
  size: number
  url: string
  storage_path: string
  description?: string
  created_at: string
  updated_at: string
}

export interface StandardModuleMaterial {
  id: string
  module_id: string
  material_id: string
  quantity: number
  notes?: string
  material: {
    id: string
    code: string
    name: string
    category: string
    unit: string
    unit_price?: number
  }
}

export interface ModuleDescriptionSection {
  section: string
  description: string
}

export interface StandardModule {
  id: string
  name: string
  description?: string
  base_price: number
  is_active: boolean
  order: number
  module_description?: ModuleDescriptionSection[]
  created_at: string
  updated_at: string
  materials: StandardModuleMaterial[]
  attachments: StandardModuleAttachment[]
}

export function useStandardModules(onlyActive = false) {
  const [modules, setModules] = useState<StandardModule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const url = onlyActive
        ? '/api/standard-modules?active=true'
        : '/api/standard-modules'
      const res = await fetch(url)
      if (!res.ok) throw new Error('Error al cargar módulos')
      const data = await res.json()
      setModules(data.modules ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [onlyActive])

  useEffect(() => {
    load()
  }, [load])

  const createModule = async (moduleData: {
    name: string
    description?: string
    base_price?: number
    is_active?: boolean
    order?: number
  }): Promise<StandardModule> => {
    const res = await fetch('/api/standard-modules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(moduleData),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? 'Error al crear módulo')
    }
    const data = await res.json()
    await load()
    return data.module
  }

  const updateModule = async (
    id: string,
    moduleData: Partial<{
      name: string
      description: string
      base_price: number
      is_active: boolean
      order: number
    }>
  ): Promise<StandardModule> => {
    const res = await fetch(`/api/standard-modules/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(moduleData),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? 'Error al actualizar módulo')
    }
    const data = await res.json()
    await load()
    return data.module
  }

  const deleteModule = async (id: string): Promise<void> => {
    const res = await fetch(`/api/standard-modules/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? 'Error al eliminar módulo')
    }
    await load()
  }

  const addMaterial = async (
    moduleId: string,
    materialId: string,
    quantity: number,
    notes?: string
  ): Promise<void> => {
    const res = await fetch(`/api/standard-modules/${moduleId}/materials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ material_id: materialId, quantity, notes }),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? 'Error al agregar material')
    }
    await load()
  }

  const removeMaterial = async (moduleId: string, itemId: string): Promise<void> => {
    const res = await fetch(`/api/standard-modules/${moduleId}/materials/${itemId}`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? 'Error al quitar material')
    }
    await load()
  }

  const uploadAttachment = async (moduleId: string, file: File, description?: string): Promise<void> => {
    const formData = new FormData()
    formData.append('file', file)
    if (description) formData.append('description', description)

    const res = await fetch(`/api/standard-modules/${moduleId}/attachments`, {
      method: 'POST',
      body: formData,
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? 'Error al subir archivo')
    }
    await load()
  }

  const deleteAttachment = async (moduleId: string, attachmentId: string): Promise<void> => {
    const res = await fetch(
      `/api/standard-modules/${moduleId}/attachments/${attachmentId}`,
      { method: 'DELETE' }
    )
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? 'Error al eliminar archivo')
    }
    await load()
  }

  return {
    modules,
    loading,
    error,
    reload: load,
    createModule,
    updateModule,
    deleteModule,
    addMaterial,
    removeMaterial,
    uploadAttachment,
    deleteAttachment,
  }
}
