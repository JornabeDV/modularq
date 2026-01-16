"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface TaskAssignment {
  id: string
  taskId: string
  userId: string
  assignedAt: string
  createdAt: string
  updatedAt: string
  user?: {
    id: string
    name: string
    role: string
  }
}

export interface CreateTaskAssignmentData {
  taskId: string
  userId: string
}

export function useTaskAssignments(taskId?: string) {
  const [assignments, setAssignments] = useState<TaskAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar asignaciones desde Supabase
  const fetchAssignments = async (filterTaskId?: string) => {
    try {
      setLoading(true)
      setError(null)
      
      let query = supabase
        .from('task_assignments')
        .select(`
          *,
          user:user_id (
            id,
            name,
            role
          )
        `)
        .order('assigned_at', { ascending: false })

      if (filterTaskId) {
        query = query.eq('task_id', filterTaskId)
      }

      const { data, error: fetchError } = await query

      if (fetchError) {
        throw fetchError
      }

      // Convertir datos de Supabase al formato TaskAssignment
      const formattedAssignments: TaskAssignment[] = (data || []).map(assignment => ({
        id: assignment.id,
        taskId: assignment.task_id,
        userId: assignment.user_id,
        assignedAt: assignment.assigned_at,
        createdAt: assignment.created_at,
        updatedAt: assignment.updated_at,
        user: assignment.user ? {
          id: assignment.user.id,
          name: assignment.user.name,
          role: assignment.user.role
        } : undefined
      }))

      setAssignments(formattedAssignments)
    } catch (err) {
      console.error('Error fetching task assignments:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar asignaciones de tareas')
    } finally {
      setLoading(false)
    }
  }

  // Crear nueva asignación
  const createAssignment = async (assignmentData: CreateTaskAssignmentData): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null)
      
      const { data, error: insertError } = await supabase
        .from('task_assignments')
        .insert({
          task_id: assignmentData.taskId,
          user_id: assignmentData.userId
        })
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      // Actualizar estado local
      await fetchAssignments(taskId)
      
      return { success: true }
    } catch (err) {
      console.error('Error creating task assignment:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al asignar operario a la tarea'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Eliminar asignación
  const deleteAssignment = async (assignmentId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null)
      
      const { error: deleteError } = await supabase
        .from('task_assignments')
        .delete()
        .eq('id', assignmentId)

      if (deleteError) {
        throw deleteError
      }

      // Actualizar estado local
      await fetchAssignments(taskId)
      
      return { success: true }
    } catch (err) {
      console.error('Error deleting task assignment:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al desasignar operario de la tarea'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Obtener asignaciones por tarea
  const getAssignmentsByTask = (taskId: string) => {
    return assignments.filter(assignment => assignment.taskId === taskId)
  }

  // Obtener asignaciones por usuario
  const getAssignmentsByUser = (userId: string) => {
    return assignments.filter(assignment => assignment.userId === userId)
  }

  // Actualizar asignaciones en lote (sin re-fetch individual)
  const updateAssignmentsBatch = async (operations: Array<{ type: 'create' | 'delete', data: any }>): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null)
      
      // Procesar todas las operaciones
      const promises = operations.map(async (op) => {
        if (op.type === 'create') {
          const { data, error } = await supabase
            .from('task_assignments')
            .insert({
              task_id: op.data.taskId,
              user_id: op.data.userId
            })
            .select()
            .single()
          
          if (error) throw error
          return data
        } else if (op.type === 'delete') {
          const { error } = await supabase
            .from('task_assignments')
            .delete()
            .eq('id', op.data.assignmentId)
          
          if (error) throw error
          return null
        }
      })

      await Promise.all(promises)
      
      // Solo hacer un fetch al final
      await fetchAssignments(taskId)
      
      return { success: true }
    } catch (err) {
      console.error('Error updating assignments batch:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar asignaciones'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  useEffect(() => {
    fetchAssignments(taskId)
  }, [taskId])

  return {
    assignments,
    loading,
    error,
    createAssignment,
    deleteAssignment,
    updateAssignmentsBatch,
    refetch: () => fetchAssignments(taskId),
    getAssignmentsByTask,
    getAssignmentsByUser
  }
}
