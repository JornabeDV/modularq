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
          status: 'assigned',
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

  const startTask = async (projectTaskId: string, userId?: string) => {
    try {
      setLoading(true)
      setError(null)

      const updateData: any = {
        status: 'in_progress',
        start_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      }

      if (userId) {
        updateData.started_by = userId
        updateData.started_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('project_tasks')
        .update(updateData)
        .eq('id', projectTaskId)

      if (error) {
        throw error
      }

      return { success: true }
    } catch (err) {
      console.error('Error starting task:', err)
      setError(err instanceof Error ? err.message : 'Error al iniciar tarea')
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Error al iniciar tarea' 
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

  const completeTask = async (projectTaskId: string, actualHours: number, notes?: string, userId?: string) => {
    try {
      setLoading(true)
      setError(null)

      // Obtener información de la tarea para cerrar sesiones activas
      const { data: projectTask, error: fetchError } = await supabase
        .from('project_tasks')
        .select('task_id, project_id')
        .eq('id', projectTaskId)
        .single()

      if (fetchError) {
        throw fetchError
      }

      // Primero, cerrar todas las sesiones activas de esta tarea
      if (projectTask) {
        const now = new Date()
        const { data: activeEntries, error: entriesError } = await supabase
          .from('time_entries')
          .select('id, start_time, description')
          .eq('task_id', projectTask.task_id)
          .eq('project_id', projectTask.project_id)
          .is('end_time', null)

        if (entriesError) {
          console.error('Error fetching active sessions:', entriesError)
        } else if (activeEntries && activeEntries.length > 0) {
          // Cerrar todas las sesiones activas
          for (const entry of activeEntries) {
            const startTime = new Date(entry.start_time)
            const elapsedMs = now.getTime() - startTime.getTime()
            const elapsedHours = elapsedMs / (1000 * 60 * 60)
            
            await supabase
              .from('time_entries')
              .update({
                end_time: now.toISOString(),
                hours: elapsedHours,
                description: entry.description || 'Sesión cerrada al completar la tarea'
              })
              .eq('id', entry.id)
          }
        }
      }

      const updateData: any = {
        status: 'completed',
        actual_hours: actualHours,
        notes: notes,
        end_date: new Date().toISOString().split('T')[0],
        progress_percentage: 100,
        updated_at: new Date().toISOString()
      }

      if (userId) {
        updateData.completed_by = userId
        updateData.completed_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('project_tasks')
        .update(updateData)
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
      const allTasksCompleted = tasks && tasks.length > 0 && tasks.every((task: any) => task.status === 'completed')

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
    startTask,
    unassignTask,
    completeTask
  }
}
