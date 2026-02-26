'use client'

import { useState, useEffect, useCallback } from 'react'
import { PrismaTypedService, Budget, BudgetItem, BudgetAttachment } from '@/lib/prisma-typed-service'

export function useBudget(budgetId: string) {
  const [budget, setBudget] = useState<Budget | null>(null)
  const [attachments, setAttachments] = useState<BudgetAttachment[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingAttachments, setLoadingAttachments] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingQuantities, setEditingQuantities] = useState<Record<string, string>>({})
  const [pendingChanges, setPendingChanges] = useState<Set<string>>(new Set())
  const [originalQuantities, setOriginalQuantities] = useState<Record<string, number>>({})

  const loadBudget = useCallback(async () => {
    try {
      const data = await PrismaTypedService.getBudgetById(budgetId)
      setBudget(data)
      
      if (data?.items) {
        const quantities: Record<string, string> = {}
        const originals: Record<string, number> = {}
        data.items.forEach((item: BudgetItem) => {
          quantities[item.id] = item.quantity.toString()
          originals[item.id] = item.quantity
        })
        setEditingQuantities(quantities)
        setOriginalQuantities(originals)
        setPendingChanges(new Set())
      }
    } catch (error) {
      console.error('Error loading budget:', error)
    } finally {
      setLoading(false)
    }
  }, [budgetId])

  // Cargar archivos adjuntos
  const loadAttachments = useCallback(async () => {
    if (!budgetId) return
    
    setLoadingAttachments(true)
    try {
      const data = await PrismaTypedService.getBudgetAttachments(budgetId)
      setAttachments(data)
    } catch (error) {
      console.error('Error loading attachments:', error)
    } finally {
      setLoadingAttachments(false)
    }
  }, [budgetId])

  useEffect(() => {
    loadBudget()
    loadAttachments()
  }, [loadBudget, loadAttachments])

  useEffect(() => {
    loadBudget()
  }, [loadBudget])

  const handleQuantityChange = (itemId: string, value: string) => {
    setEditingQuantities(prev => ({ ...prev, [itemId]: value }))
  }

  const handleQuantityBlur = (itemId: string) => {
    const quantity = parseFloat(editingQuantities[itemId]) || 0
    const originalQty = originalQuantities[itemId] || 0
    
    if (quantity !== originalQty) {
      setPendingChanges(prev => new Set(prev).add(itemId))
    } else {
      setPendingChanges(prev => {
        const next = new Set(prev)
        next.delete(itemId)
        return next
      })
    }
  }

  const saveAllChanges = async () => {
    if (pendingChanges.size === 0) return
    
    setSaving(true)
    try {
      const updates: { itemId: string; quantity: number }[] = []
      
      pendingChanges.forEach(itemId => {
        const quantity = parseFloat(editingQuantities[itemId]) || 0
        updates.push({ itemId, quantity })
      })
      
      await PrismaTypedService.updateBudgetItemsBatch(budgetId, updates)
      await loadBudget()
      
      setPendingChanges(new Set())
      return { success: true, count: updates.length }
    } catch (error) {
      console.error('Error saving changes:', error)
      return { success: false, error }
    } finally {
      setSaving(false)
    }
  }

  const discardChanges = () => {
    const restored: Record<string, string> = { ...editingQuantities }
    pendingChanges.forEach(itemId => {
      restored[itemId] = originalQuantities[itemId]?.toString() || '0'
    })
    setEditingQuantities(restored)
    setPendingChanges(new Set())
  }

  return {
    budget,
    attachments,
    loading,
    loadingAttachments,
    saving,
    editingQuantities,
    pendingChanges,
    loadBudget,
    loadAttachments,
    handleQuantityChange,
    handleQuantityBlur,
    saveAllChanges,
    discardChanges,
    setAttachments
  }
}
