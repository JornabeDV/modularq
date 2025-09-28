"use client"

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface SelfAssignTaskData {
  projectTaskId: string
  userId: string
}

export function useTaskSelfAssignment() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-asignar tarea al operario actual
  const selfAssignTask = async (data: SelfAssignTaskData) => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase
        .from('project_tasks')
        .update({
          assigned_to: data.userId,
          status: 'in_progress',
          assigned_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', data.projectTaskId)

      if (error) {
        throw error
      }

      return { success: true }
    } catch (err) {
      console.error('Error self-assigning task:', err)
      setError(err instanceof Error ? err.message : 'Error al asignar tarea')
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Error al asignar tarea' 
      }
    } finally {
      setLoading(false)
    }
  }

  // Desasignar tarea (devolver a disponible)
  const unassignTask = async (projectTaskId: string) => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase
        .from('project_tasks')
        .update({
          assigned_to: null,
          status: 'pending',
          assigned_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectTaskId)

      if (error) {
        throw error
      }

      return { success: true }
    } catch (err) {
      console.error('Error unassigning task:', err)
      setError(err instanceof Error ? err.message : 'Error al desasignar tarea')
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Error al desasignar tarea' 
      }
    } finally {
      setLoading(false)
    }
  }

  // Marcar tarea como completada
  const completeTask = async (projectTaskId: string, actualHours: number, notes?: string) => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase
        .from('project_tasks')
        .update({
          status: 'completed',
          actual_hours: actualHours,
          notes: notes,
          end_date: new Date().toISOString(),
          progress_percentage: 100,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectTaskId)

      if (error) {
        throw error
      }

      return { success: true }
    } catch (err) {
      console.error('Error completing task:', err)
      setError(err instanceof Error ? err.message : 'Error al completar tarea')
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Error al completar tarea' 
      }
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    selfAssignTask,
    unassignTask,
    completeTask
  }
}
