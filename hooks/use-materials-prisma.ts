"use client"

import { useState, useEffect } from 'react'
import { PrismaTypedService } from '@/lib/prisma-typed-service'

export interface Material {
  id: string
  code: string
  name: string
  description?: string
  category: 'estructura' | 'paneles' | 'herrajes' | 'aislacion' | 'electricidad' | 'sanitarios' | 'otros'
  unit: 'unidad' | 'metro' | 'metro_cuadrado' | 'metro_cubico' | 'kilogramo' | 'litro'
  stockQuantity: number
  minStock: number
  unitPrice?: number
  supplier?: string
  createdAt: string
  updatedAt: string
}

export interface CreateMaterialData {
  code: string
  name: string
  description?: string
  category: 'estructura' | 'paneles' | 'herrajes' | 'aislacion' | 'electricidad' | 'sanitarios' | 'otros'
  unit: 'unidad' | 'metro' | 'metro_cuadrado' | 'metro_cubico' | 'kilogramo' | 'litro'
  stock_quantity?: number
  min_stock?: number
  unit_price?: number
  supplier?: string
}

export interface UpdateMaterialData {
  code?: string
  name?: string
  description?: string
  category?: 'estructura' | 'paneles' | 'herrajes' | 'aislacion' | 'electricidad' | 'sanitarios' | 'otros'
  unit?: 'unidad' | 'metro' | 'metro_cuadrado' | 'metro_cubico' | 'kilogramo' | 'litro'
  stock_quantity?: number
  min_stock?: number
  unit_price?: number
  supplier?: string
}

export function useMaterialsPrisma() {
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
      const formattedMaterials: Material[] = data.map(material => ({
        id: material.id,
        code: material.code,
        name: material.name,
        description: material.description,
        category: material.category,
        unit: material.unit,
        stockQuantity: material.stock_quantity ?? 0,
        minStock: material.min_stock ?? 0,
        unitPrice: material.unit_price,
        supplier: material.supplier,
        createdAt: typeof material.created_at === 'string' ? material.created_at : material.created_at.toISOString(),
        updatedAt: typeof material.updated_at === 'string' ? material.updated_at : material.updated_at.toISOString()
      }))
      
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
      
      const material = await PrismaTypedService.createMaterial(materialData)

      // Convertir el material al formato Material personalizado
      const formattedMaterial: Material = {
        id: material.id,
        code: material.code,
        name: material.name,
        description: material.description,
        category: material.category,
        unit: material.unit,
        stockQuantity: material.stock_quantity ?? 0,
        minStock: material.min_stock ?? 0,
        unitPrice: material.unit_price,
        supplier: material.supplier,
        createdAt: typeof material.created_at === 'string' ? material.created_at : material.created_at.toISOString(),
        updatedAt: typeof material.updated_at === 'string' ? material.updated_at : material.updated_at.toISOString()
      }

      // Actualizar estado local
      await fetchMaterials()
      
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
      
      await PrismaTypedService.updateMaterial(materialId, materialData)

      // Actualizar estado local
      await fetchMaterials()
      
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

  // Obtener material por ID
  const getMaterialById = (materialId: string): Material | undefined => {
    return materials.find(m => m.id === materialId)
  }

  // Obtener materiales con stock bajo
  const getLowStockMaterials = (): Material[] => {
    return materials.filter(m => m.stockQuantity <= m.minStock)
  }

  // Obtener el siguiente código disponible para una categoría
  const getNextCode = async (category: string): Promise<string> => {
    try {
      return await PrismaTypedService.getNextMaterialCode(category)
    } catch (err) {
      console.error('Error getting next code:', err)
      // Fallback: código genérico con timestamp
      const prefix = category === 'estructura' ? 'EST' : 
                     category === 'paneles' ? 'PAN' :
                     category === 'herrajes' ? 'HER' :
                     category === 'aislacion' ? 'AIS' :
                     category === 'electricidad' ? 'ELE' :
                     category === 'sanitarios' ? 'SAN' : 'OTR'
      return `${prefix}-${Date.now().toString().slice(-3)}`
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
    getLowStockMaterials,
    getNextCode,
    refetch: fetchMaterials
  }
}