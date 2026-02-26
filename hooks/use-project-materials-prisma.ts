"use client"

import { useState, useEffect } from 'react'
import { PrismaTypedService } from '@/lib/prisma-typed-service'

export interface ProjectMaterial {
  id: string
  projectId: string
  materialId: string
  quantity: number
  unitPrice?: number
  notes?: string
  assignedAt: string
  assignedBy?: string
  material?: {
    id: string
    code: string
    name: string
    description?: string
    category: string
    unit: string
    stock_quantity: number
    min_stock: number
    unit_price?: number
    supplier?: string
  }
}

export interface CreateProjectMaterialData {
  material_id: string
  quantity: number
  unit_price?: number
  notes?: string
  assigned_by?: string
}

export interface UpdateProjectMaterialData {
  quantity?: number
  unit_price?: number
  notes?: string
}

export function useProjectMaterialsPrisma(projectId: string) {
  const [projectMaterials, setProjectMaterials] = useState<ProjectMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar materiales del proyecto
  const fetchProjectMaterials = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await PrismaTypedService.getProjectMaterials(projectId)
      
      // Convertir datos al formato ProjectMaterial
      const formattedMaterials: ProjectMaterial[] = data.map((pm: any) => ({
        id: pm.id,
        projectId: pm.project_id,
        materialId: pm.material_id,
        quantity: pm.quantity,
        unitPrice: pm.unit_price,
        notes: pm.notes,
        assignedAt: typeof pm.assigned_at === 'string' ? pm.assigned_at : pm.assigned_at.toISOString(),
        assignedBy: pm.assigned_by,
        material: pm.material ? {
          id: pm.material.id,
          code: pm.material.code,
          name: pm.material.name,
          description: pm.material.description,
          category: pm.material.category,
          unit: pm.material.unit,
          stock_quantity: pm.material.stock_quantity ?? 0,
          min_stock: pm.material.min_stock ?? 0,
          unit_price: pm.material.unit_price,
          supplier: pm.material.supplier
        } : undefined
      }))
      
      setProjectMaterials(formattedMaterials)
    } catch (err) {
      console.error('Error fetching project materials:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar materiales del proyecto')
    } finally {
      setLoading(false)
    }
  }

  // Agregar material al proyecto (descuenta stock automáticamente)
  const addMaterialToProject = async (materialData: CreateProjectMaterialData): Promise<{ success: boolean; error?: string; projectMaterial?: ProjectMaterial }> => {
    try {
      setError(null)
      
      const result = await PrismaTypedService.addMaterialToProject(projectId, materialData)

      // Convertir al formato ProjectMaterial
      const formattedMaterial: ProjectMaterial = {
        id: result.id,
        projectId: result.project_id,
        materialId: result.material_id,
        quantity: result.quantity,
        unitPrice: result.unit_price,
        notes: result.notes,
        assignedAt: typeof result.assigned_at === 'string' ? result.assigned_at : result.assigned_at.toISOString(),
        assignedBy: result.assigned_by,
        material: result.material ? {
          id: result.material.id,
          code: result.material.code,
          name: result.material.name,
          description: result.material.description,
          category: result.material.category,
          unit: result.material.unit,
          stock_quantity: result.material.stock_quantity ?? 0,
          min_stock: result.material.min_stock ?? 0,
          unit_price: result.material.unit_price,
          supplier: result.material.supplier
        } : undefined
      }

      // Actualizar estado local
      await fetchProjectMaterials()
      
      return { success: true, projectMaterial: formattedMaterial }
    } catch (err) {
      console.error('Error adding material to project:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al agregar material al proyecto'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Actualizar material del proyecto
  const updateProjectMaterial = async (projectMaterialId: string, materialData: UpdateProjectMaterialData): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null)
      
      await PrismaTypedService.updateProjectMaterial(projectMaterialId, materialData)

      // Actualizar estado local
      await fetchProjectMaterials()
      
      return { success: true }
    } catch (err) {
      console.error('Error updating project material:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar material del proyecto'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Eliminar material del proyecto (devuelve stock automáticamente)
  const removeMaterialFromProject = async (projectMaterialId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null)
      
      await PrismaTypedService.removeMaterialFromProject(projectMaterialId)

      // Actualizar estado local
      await fetchProjectMaterials()
      
      return { success: true }
    } catch (err) {
      console.error('Error removing material from project:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar material del proyecto'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Calcular valor total de materiales
  const getTotalValue = (): number => {
    return projectMaterials.reduce((sum, pm) => {
      const price = pm.unitPrice || pm.material?.unit_price || 0
      return sum + (pm.quantity * price)
    }, 0)
  }

  // Cargar datos al montar el componente
  useEffect(() => {
    if (projectId) {
      fetchProjectMaterials()
    }
  }, [projectId])

  return {
    projectMaterials,
    loading,
    error,
    addMaterialToProject,
    updateProjectMaterial,
    removeMaterialFromProject,
    getTotalValue,
    refetch: fetchProjectMaterials
  }
}