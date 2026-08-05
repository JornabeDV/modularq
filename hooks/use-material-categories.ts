"use client"

import { useState, useEffect, useCallback } from 'react'
import { PrismaTypedService } from '@/lib/prisma-typed-service'

export interface MaterialCategory {
  id: string
  name: string
  slug: string
  code_prefix: string
  order: number
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface CreateMaterialCategoryData {
  name: string
  slug?: string
  code_prefix?: string
  order?: number
}

export interface UpdateMaterialCategoryData {
  name?: string
  slug?: string
  code_prefix?: string
  order?: number
}

function formatCategory(category: any): MaterialCategory {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    code_prefix: category.code_prefix,
    order: category.order ?? 0,
    deleted_at: category.deleted_at ? (typeof category.deleted_at === 'string' ? category.deleted_at : category.deleted_at.toISOString()) : null,
    created_at: typeof category.created_at === 'string' ? category.created_at : category.created_at.toISOString(),
    updated_at: typeof category.updated_at === 'string' ? category.updated_at : category.updated_at.toISOString()
  }
}

export function useMaterialCategories(activeOnly = false) {
  const [categories, setCategories] = useState<MaterialCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      setError(null)

      const data = await PrismaTypedService.getMaterialCategories(activeOnly)
      setCategories(data.map(formatCategory))
    } catch (err) {
      console.error('Error fetching material categories:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar categorías')
    } finally {
      setLoading(false)
    }
  }, [activeOnly])

  const createCategory = async (categoryData: CreateMaterialCategoryData): Promise<{ success: boolean; error?: string; category?: MaterialCategory }> => {
    try {
      setError(null)
      const category = await PrismaTypedService.createMaterialCategory(categoryData)
      const formatted = formatCategory(category)
      setCategories(prev => [...prev, formatted])
      return { success: true, category: formatted }
    } catch (err) {
      console.error('Error creating category:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al crear categoría'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const updateCategory = async (id: string, categoryData: UpdateMaterialCategoryData): Promise<{ success: boolean; error?: string; category?: MaterialCategory }> => {
    try {
      setError(null)
      const category = await PrismaTypedService.updateMaterialCategory(id, categoryData)
      const formatted = formatCategory(category)
      setCategories(prev => prev.map(c => (c.id === id ? formatted : c)))
      return { success: true, category: formatted }
    } catch (err) {
      console.error('Error updating category:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar categoría'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const deleteCategory = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null)
      await PrismaTypedService.deleteMaterialCategory(id)
      setCategories(prev => prev.map(c => (c.id === id ? { ...c, deleted_at: new Date().toISOString() } : c)))
      return { success: true }
    } catch (err) {
      console.error('Error deleting category:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar categoría'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const restoreCategory = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null)
      await PrismaTypedService.restoreMaterialCategory(id)
      setCategories(prev => prev.map(c => (c.id === id ? { ...c, deleted_at: null } : c)))
      return { success: true }
    } catch (err) {
      console.error('Error restoring category:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al restaurar categoría'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  return {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    restoreCategory,
    refetch: fetchCategories
  }
}
