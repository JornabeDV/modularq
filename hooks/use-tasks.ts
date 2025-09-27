"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Task } from '@/lib/types'

export interface CreateTaskData {
  title: string
  description: string
  estimatedHours: number
  actualHours?: number
  category: string
  isTemplate: boolean
  createdBy: string
  projectId?: string
  assignedTo?: string
  assignedUsers?: Array<{ id: string; name: string; role: string }>
  startDate?: string
  endDate?: string
  dependencies?: string[]
}

export interface UpdateTaskData extends Partial<CreateTaskData> {}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar tareas desde Supabase
  const fetchTasks = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error: fetchError } = await supabase
        .from('tasks')
        .select(`
          *,
          task_assignments (
            user_id,
            users!task_assignments_user_id_fkey (
              id,
              name,
              role
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      // Convertir datos de Supabase al formato Task
      const formattedTasks: Task[] = (data || []).map(task => ({
        id: task.id,
        projectId: task.project_id,
        title: task.title,
        description: task.description || '',
        status: task.status,
        assignedTo: task.task_assignments?.map((assignment: any) => assignment.users?.id).filter(Boolean).join(',') || undefined,
        assignedUsers: task.task_assignments?.map((assignment: any) => ({
          id: assignment.users?.id || '',
          name: assignment.users?.name || '',
          role: assignment.users?.role || ''
        })) || [],
        estimatedHours: parseFloat(task.estimated_hours) || 0,
        actualHours: parseFloat(task.actual_hours) || 0,
        startDate: task.start_date,
        endDate: task.end_date,
        dependencies: task.dependencies || [],
        category: task.category || '',
        skills: task.skills || [],
        isTemplate: task.is_template || false,
        createdBy: task.created_by || '',
        createdAt: task.created_at,
        updatedAt: task.updated_at
      }))

      setTasks(formattedTasks)
    } catch (err) {
      console.error('Error fetching tasks:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar tareas')
    } finally {
      setLoading(false)
    }
  }

  // Crear nueva tarea
  const createTask = async (taskData: CreateTaskData): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null)
      
      // Crear la tarea
      const { data: taskData_result, error: insertError } = await supabase
        .from('tasks')
        .insert({
          project_id: taskData.projectId || null,
          title: taskData.title,
          description: taskData.description,
          assigned_to: null, // Ya no usamos este campo
          estimated_hours: taskData.estimatedHours,
          actual_hours: taskData.actualHours || 0,
          start_date: taskData.startDate || null,
          end_date: taskData.endDate || null,
          dependencies: taskData.dependencies || null,
          category: taskData.category,
          is_template: taskData.isTemplate,
          created_by: taskData.createdBy
        })
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      // Crear asignaciones de usuarios si hay usuarios asignados
      if (taskData.assignedUsers && taskData.assignedUsers.length > 0) {
        const assignments = taskData.assignedUsers.map(user => ({
          task_id: taskData_result.id,
          user_id: typeof user === 'string' ? user : user.id,
          assigned_by: taskData.createdBy || '00000000-0000-0000-0000-000000000000'
        }))

        const { error: assignmentError } = await supabase
          .from('task_assignments')
          .insert(assignments)

        if (assignmentError) {
          console.error('Error creating task assignments:', assignmentError)
          // No lanzamos error aquí, la tarea ya se creó
        }
      }

      // Actualizar estado local
      await fetchTasks()
      
      return { success: true }
    } catch (err) {
      console.error('Error creating task:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al crear tarea'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Actualizar tarea
  const updateTask = async (taskId: string, taskData: UpdateTaskData): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null)
      
      const updateData: any = {}
      
      if (taskData.title !== undefined) updateData.title = taskData.title
      if (taskData.description !== undefined) updateData.description = taskData.description
      if (taskData.estimatedHours !== undefined) updateData.estimated_hours = taskData.estimatedHours
      if (taskData.actualHours !== undefined) updateData.actual_hours = taskData.actualHours
      if (taskData.startDate !== undefined) updateData.start_date = taskData.startDate
      if (taskData.endDate !== undefined) updateData.end_date = taskData.endDate
      if (taskData.dependencies !== undefined) updateData.dependencies = taskData.dependencies
      if (taskData.category !== undefined) updateData.category = taskData.category
      if (taskData.isTemplate !== undefined) updateData.is_template = taskData.isTemplate
      if (taskData.projectId !== undefined) updateData.project_id = taskData.projectId

      // Actualizar la tarea
      const { error: updateError } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)

      if (updateError) {
        throw updateError
      }

      // Manejar asignaciones de usuarios si se proporcionan
      if (taskData.assignedUsers !== undefined) {
        // Eliminar asignaciones existentes
        const { error: deleteError } = await supabase
          .from('task_assignments')
          .delete()
          .eq('task_id', taskId)

        if (deleteError) {
          console.error('Error deleting existing assignments:', deleteError)
        }

        // Crear nuevas asignaciones si hay usuarios
        if (taskData.assignedUsers.length > 0) {
          const assignments = taskData.assignedUsers.map(user => ({
            task_id: taskId,
            user_id: typeof user === 'string' ? user : user.id,
            assigned_by: taskData.createdBy || '00000000-0000-0000-0000-000000000000' // UUID por defecto
          }))

          const { error: assignmentError } = await supabase
            .from('task_assignments')
            .insert(assignments)

          if (assignmentError) {
            console.error('Error creating new assignments:', assignmentError)
          }
        }
      }

      // Actualizar estado local
      await fetchTasks()
      
      return { success: true }
    } catch (err) {
      console.error('Error updating task:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar tarea'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Eliminar tarea
  const deleteTask = async (taskId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null)
      
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (deleteError) {
        throw deleteError
      }

      // Actualizar estado local
      await fetchTasks()
      
      return { success: true }
    } catch (err) {
      console.error('Error deleting task:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar tarea'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Cargar tareas al montar el componente
  useEffect(() => {
    fetchTasks()
  }, [])

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    refetch: fetchTasks
  }
}