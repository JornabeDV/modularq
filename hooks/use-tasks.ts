"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Task } from '@/lib/types'

export interface CreateTaskData {
  title: string
  description: string
  estimatedHours: number
  category: string
  type: 'standard' | 'custom'
  createdBy: string
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
        .select('*')
        .order('task_order', { ascending: true })

      if (fetchError) {
        throw fetchError
      }

      // Convertir datos de Supabase al formato Task
      const formattedTasks: Task[] = (data || []).map(task => ({
        id: task.id,
        title: task.title,
        description: task.description || '',
        category: task.category || '',
        type: task.type || 'custom',
        estimatedHours: parseFloat(task.estimated_hours) || 0,
        taskOrder: task.task_order || 0,
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
  const createTask = async (taskData: CreateTaskData): Promise<{ success: boolean; error?: string; taskId?: string }> => {
    try {
      setError(null)
      
      // Obtener el siguiente orden
      const { data: maxOrderData } = await supabase
        .from('tasks')
        .select('task_order')
        .order('task_order', { ascending: false })
        .limit(1)
        .single()
      
      const nextOrder = (maxOrderData?.task_order || 0) + 1
      
      const { data: taskData_result, error: insertError } = await supabase
        .from('tasks')
        .insert({
          title: taskData.title,
          description: taskData.description,
          estimated_hours: taskData.estimatedHours,
          category: taskData.category,
          type: taskData.type,
          task_order: nextOrder,
          created_by: taskData.createdBy
        })
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      // Actualizar estado local
      await fetchTasks()
      
      return { success: true, taskId: taskData_result.id }
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
      if (taskData.category !== undefined) updateData.category = taskData.category
      if (taskData.type !== undefined) updateData.type = taskData.type

      const { error: updateError } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)

      if (updateError) {
        throw updateError
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

  // Obtener solo tareas estándar
  const getStandardTasks = () => {
    return tasks.filter(task => task.type === 'standard')
  }

  // Obtener solo tareas personalizadas
  const getCustomTasks = () => {
    return tasks.filter(task => task.type === 'custom')
  }

  // Crear tarea estándar
  const createStandardTask = async (taskData: Omit<CreateTaskData, 'type'>): Promise<{ success: boolean; error?: string }> => {
    return createTask({
      ...taskData,
      type: 'standard'
    })
  }

  // Crear tarea personalizada
  const createCustomTask = async (taskData: Omit<CreateTaskData, 'type'>): Promise<{ success: boolean; error?: string }> => {
    return createTask({
      ...taskData,
      type: 'custom'
    })
  }

  // Reordenar tareas
  const reorderTasks = async (taskOrders: { id: string; taskOrder: number }[]): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null)
      
      // Actualizar cada tarea con su nuevo orden
      const updatePromises = taskOrders.map(({ id, taskOrder }) =>
        supabase
          .from('tasks')
          .update({ task_order: taskOrder })
          .eq('id', id)
      )
      
      const results = await Promise.all(updatePromises)
      
      // Verificar si alguna actualización falló
      const hasErrors = results.some(result => result.error)
      if (hasErrors) {
        throw new Error('Error al actualizar el orden de las tareas')
      }
      
      // Actualizar estado local sin recargar toda la página
      setTasks(prevTasks => {
        const newTasks = [...prevTasks]
        taskOrders.forEach(({ id, taskOrder }) => {
          const taskIndex = newTasks.findIndex(task => task.id === id)
          if (taskIndex !== -1) {
            newTasks[taskIndex] = { ...newTasks[taskIndex], taskOrder }
          }
        })
        // Reordenar el array según el nuevo taskOrder
        return newTasks.sort((a, b) => a.taskOrder - b.taskOrder)
      })
      
      return { success: true }
    } catch (err) {
      console.error('Error reordering tasks:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al reordenar tareas'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    refetch: fetchTasks,
    getStandardTasks,
    getCustomTasks,
    createStandardTask,
    createCustomTask,
    reorderTasks
  }
}