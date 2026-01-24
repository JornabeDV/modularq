"use client"

import { useState, useEffect, useCallback } from 'react'
import { PrismaTypedService, type Task as PrismaTask } from '@/lib/prisma-typed-service'

// Tipo personalizado para las tareas mapeadas
export interface Task extends Omit<PrismaTask, 'estimated_hours' | 'task_order'> {
  estimatedHours: number
  taskOrder: number
}

export interface CreateTaskData {
  title: string
  description: string
  estimatedHours: number
  category: string
  type: 'standard' | 'custom'
  createdBy: string
}

export interface UpdateTaskData extends Partial<CreateTaskData> {
  estimated_hours: number | undefined;
}

export function useTasksPrisma() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar tareas
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const fetchedTasks = await PrismaTypedService.getAllTasks()
      
      // Mapear datos de Prisma al formato esperado por los componentes
      const mappedTasks = fetchedTasks.map(task => ({
        ...task,
        estimatedHours: parseFloat(String(task.estimated_hours)) || 0,
        taskOrder: task.task_order || 0
      }))
      
      setTasks(mappedTasks)
    } catch (err) {
      console.error('Error fetching tasks:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar tareas')
    } finally {
      setLoading(false)
    }
  }, [])

  // Crear nueva tarea
  const createTask = async (taskData: CreateTaskData): Promise<{ success: boolean; error?: string; taskId?: string }> => {
    try {
      setError(null)
      
      const task = await PrismaTypedService.createTask({
        title: taskData.title,
        description: taskData.description,
        estimated_hours: taskData.estimatedHours,
        category: taskData.category,
        type: taskData.type,
        created_by: taskData.createdBy
      })

      // Actualizar estado local
      await fetchTasks()
      
      return { success: true, taskId: task.id }
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
      
      const task = await PrismaTypedService.updateTask(taskId, {
        title: taskData.title,
        description: taskData.description,
        estimated_hours: taskData.estimated_hours,
        category: taskData.category,
        type: taskData.type
      })

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
      
      await PrismaTypedService.deleteTask(taskId)

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
      
      // Convertir taskOrder a task_order para el servicio
      const prismaTaskOrders = taskOrders.map(({ id, taskOrder }) => ({
        id,
        task_order: taskOrder
      }))
      
      await PrismaTypedService.reorderTasks(prismaTaskOrders)
      
      // Actualizar estado local sin recargar toda la página
      setTasks(prevTasks => {
        const newTasks = [...prevTasks]
        taskOrders.forEach(({ id, taskOrder }) => {
          const taskIndex = newTasks.findIndex(task => task.id === id)
          if (taskIndex !== -1) {
            newTasks[taskIndex] = { ...newTasks[taskIndex], taskOrder: taskOrder }
          }
        })
        // Reordenar el array según el nuevo taskOrder
        return newTasks.sort((a, b) => (a.taskOrder || 0) - (b.taskOrder || 0))
      })
      
      return { success: true }
    } catch (err) {
      console.error('Error reordering tasks:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al reordenar tareas'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Cargar tareas al montar el componente
  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

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