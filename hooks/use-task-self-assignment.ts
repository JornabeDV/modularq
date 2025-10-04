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
          start_date: new Date().toISOString().split('T')[0],
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
          start_date: null,
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
          end_date: new Date().toISOString().split('T')[0],
          progress_percentage: 100,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectTaskId)

      if (error) {
        throw error
      }

      // Verificar si todas las tareas del proyecto están completadas
      await checkAndUpdateProjectStatus(projectTaskId)

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

  // Verificar si todas las tareas están completadas y actualizar el proyecto
  const checkAndUpdateProjectStatus = async (projectTaskId: string) => {
    try {
      // Primero obtener el project_id de la tarea
      const { data: taskData, error: taskError } = await supabase
        .from('project_tasks')
        .select('project_id')
        .eq('id', projectTaskId)
        .single()

      if (taskError || !taskData) {
        console.error('Error getting project_id:', taskError)
        return
      }

      const projectId = taskData.project_id

      // Obtener todas las tareas del proyecto
      const { data: tasks, error } = await supabase
        .from('project_tasks')
        .select('status')
        .eq('project_id', projectId)

      if (error) {
        console.error('Error checking project tasks:', error)
        return
      }

      // Verificar si todas las tareas están completadas
      const allTasksCompleted = tasks && tasks.length > 0 && tasks.every(task => task.status === 'completed')

      if (allTasksCompleted) {
        // Actualizar el proyecto a completado
        const { error: updateError } = await supabase
          .from('projects')
          .update({
            status: 'completed',
            end_date: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString()
          })
          .eq('id', projectId)

        if (updateError) {
          console.error('Error updating project status:', updateError)
        } else {
          console.log(`Proyecto ${projectId} marcado como completado automáticamente`)
        }
      }
    } catch (err) {
      console.error('Error checking project status:', err)
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
