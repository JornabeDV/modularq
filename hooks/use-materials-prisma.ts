"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { PrismaTypedService } from '@/lib/prisma-typed-service'

export interface Material {
  id: string
  code: string
  name: string
  description?: string
  category: string
  categoryId: string
  categoryName?: string
  unit: 'unidad' | 'metro' | 'metro_cuadrado' | 'metro_cubico' | 'kilogramo' | 'litro'
  stockQuantity: number
  minStock: number
  unitPrice?: number
  supplier?: string
  brand?: string
  createdAt: string
  updatedAt: string
}

export interface CreateMaterialData {
  code: string
  name: string
  description?: string
  category_id: string
  unit: 'unidad' | 'metro' | 'metro_cuadrado' | 'metro_cubico' | 'kilogramo' | 'litro'
  stock_quantity?: number
  min_stock?: number
  unit_price?: number
  supplier?: string
  brand?: string
}

export interface UpdateMaterialData {
  code?: string
  name?: string
  description?: string
  category_id?: string
  unit?: 'unidad' | 'metro' | 'metro_cuadrado' | 'metro_cubico' | 'kilogramo' | 'litro'
  stock_quantity?: number
  min_stock?: number
  unit_price?: number
  supplier?: string
  brand?: string
}

function formatMaterial(material: any): Material {
  const category = material.category || {}
  return {
    id: material.id,
    code: material.code,
    name: material.name,
    description: material.description,
    category: category.slug || material.category_id,
    categoryId: material.category_id,
    categoryName: category.name,
    unit: material.unit,
    stockQuantity: material.stock_quantity ?? 0,
    minStock: material.min_stock ?? 0,
    unitPrice: material.unit_price,
    supplier: material.supplier,
    brand: material.brand,
    createdAt: typeof material.created_at === 'string' ? material.created_at : material.created_at.toISOString(),
    updatedAt: typeof material.updated_at === 'string' ? material.updated_at : material.updated_at.toISOString()
  }
}

export function useMaterialsPrisma() {
  const { userProfile } = useAuth()
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar materiales
  const fetchMaterials = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      setError(null)
      
      const data = await PrismaTypedService.getAllMaterials()
      
      // Convertir datos al formato Material
      const formattedMaterials: Material[] = data.map(formatMaterial)
      
      setMaterials(formattedMaterials)
    } catch (err) {
      console.error('Error fetching materials:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar materiales')
    } finally {
      setLoading(false)
    }
  }

  // Crear nuevo material
  const createMaterial = async (materialData: CreateMaterialData): Promise<{ success: boolean; error?: string; material?: Material }> => {
    try {
      setError(null)
      
      const material = await PrismaTypedService.createMaterial({
        ...materialData,
        created_by: userProfile?.id
      })

      // Convertir el material al formato Material personalizado
      const formattedMaterial: Material = formatMaterial(material)

      // Agregar material al estado local inmediatamente sin recargar
      setMaterials(prev => [...prev, formattedMaterial])
      
      // Refrescar datos en segundo plano sin mostrar loading
      fetchMaterials(true).catch(console.error)
      
      return { success: true, material: formattedMaterial }
    } catch (err) {
      console.error('Error creating material:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al crear material'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Actualizar material
  const updateMaterial = async (materialId: string, materialData: UpdateMaterialData): Promise<{ success: boolean; error?: string; material?: Material }> => {
    try {
      setError(null)
      
      await PrismaTypedService.updateMaterial(materialId, {
        ...materialData,
        created_by: userProfile?.id
      })

      // Refrescar datos en segundo plano sin mostrar loading
      fetchMaterials(true).catch(console.error)
      
      return { success: true }
    } catch (err) {
      console.error('Error updating material:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar material'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Eliminar material
  const deleteMaterial = async (materialId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null)
      
      await PrismaTypedService.deleteMaterial(materialId)

      // Actualizar estado local directamente sin recargar toda la lista
      setMaterials(prev => prev.filter(m => m.id !== materialId))
      
      // Refrescar datos en segundo plano sin mostrar loading
      fetchMaterials(true).catch(console.error)
      
      return { success: true }
    } catch (err) {
      console.error('Error deleting material:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar material'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Obtener material por ID del estado local
  const getMaterialById = (materialId: string): Material | undefined => {
    return materials.find(m => m.id === materialId)
  }

  // Obtener material por ID desde el servidor
  const getMaterialByIdFromServer = async (materialId: string): Promise<Material | null> => {
    try {
      const material = await PrismaTypedService.getMaterialById(materialId)
      if (!material) return null

      return formatMaterial(material)
    } catch (err) {
      console.error('Error fetching material by id:', err)
      return null
    }
  }

  // Obtener materiales con stock bajo
  const getLowStockMaterials = (): Material[] => {
    return materials.filter(m => m.stockQuantity <= m.minStock)
  }

  // Obtener el siguiente código disponible para una categoría
  const getNextCode = async (categoryId: string): Promise<string> => {
    try {
      return await PrismaTypedService.getNextMaterialCode(categoryId)
    } catch (err) {
      console.error('Error getting next code:', err)
      // Fallback: código genérico con timestamp
      return `MAT-${Date.now().toString().slice(-3)}`
    }
  }

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchMaterials()
  }, [])

  return {
    materials,
    loading,
    error,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    getMaterialById,
    getMaterialByIdFromServer,
    getLowStockMaterials,
    getNextCode,
    refetch: fetchMaterials
  }
}