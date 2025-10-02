"use client"

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { TaskCollaborator } from '@/lib/types'

export interface AddCollaboratorData {
  projectTaskId: string
  userId: string
  addedBy: string
}

export function useTaskCollaborators() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Agregar colaborador a una tarea
  const addCollaborator = async (data: AddCollaboratorData): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true)
      setError(null)

      const { error: insertError } = await supabase
        .from('task_collaborators')
        .insert({
          project_task_id: data.projectTaskId,
          user_id: data.userId,
          added_by: data.addedBy
        })

      if (insertError) {
        throw insertError
      }

      return { success: true }
    } catch (err) {
      console.error('Error adding collaborator:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al agregar colaborador'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  // Remover colaborador de una tarea
  const removeCollaborator = async (collaboratorId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true)
      setError(null)

      const { error: deleteError } = await supabase
        .from('task_collaborators')
        .delete()
        .eq('id', collaboratorId)

      if (deleteError) {
        throw deleteError
      }

      return { success: true }
    } catch (err) {
      console.error('Error removing collaborator:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al remover colaborador'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  // Obtener colaboradores de una tarea
  const getCollaborators = async (projectTaskId: string): Promise<TaskCollaborator[]> => {
    try {
      const { data, error } = await supabase
        .from('task_collaborators')
        .select(`
          *,
          user:user_id (
            id,
            name,
            role
          ),
          added_by_user:added_by (
            id,
            name,
            role
          )
        `)
        .eq('project_task_id', projectTaskId)
        .order('added_at', { ascending: true })

      if (error) throw error

      return (data || []).map((collaborator: any) => ({
        id: collaborator.id,
        projectTaskId: collaborator.project_task_id,
        userId: collaborator.user_id,
        addedBy: collaborator.added_by,
        addedAt: collaborator.added_at,
        createdAt: collaborator.created_at,
        updatedAt: collaborator.updated_at,
        user: collaborator.user ? {
          id: collaborator.user.id,
          name: collaborator.user.name,
          role: collaborator.user.role
        } : undefined,
        addedByUser: collaborator.added_by_user ? {
          id: collaborator.added_by_user.id,
          name: collaborator.added_by_user.name,
          role: collaborator.added_by_user.role
        } : undefined
      }))
    } catch (err) {
      console.error('Error fetching collaborators:', err)
      return []
    }
  }

  return {
    loading,
    error,
    addCollaborator,
    removeCollaborator,
    getCollaborators
  }
}
