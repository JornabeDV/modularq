"use client"

import { useState, useEffect, useCallback } from 'react'
import { PrismaTypedService } from '@/lib/prisma-typed-service'
import type { ProjectTask } from '@/lib/types'

export interface CreateProjectTaskData {
  projectId: string
  taskId: string
  status?: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
  actualHours?: number
  assignedTo?: string
  startDate?: string
  endDate?: string
  progressPercentage?: number
  notes?: string
  assignedBy?: string
}

export interface UpdateProjectTaskData extends Partial<CreateProjectTaskData> {
  taskOrder?: number
}

export function useProjectTasksPrisma(projectId?: string) {
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar project_tasks
  const fetchProjectTasks = useCallback(async (filterProjectId?: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const tasks = await PrismaTypedService.getProjectTasks(filterProjectId)
      
      // Convertir datos al formato ProjectTask
      const formattedProjectTasks: ProjectTask[] = tasks.map(pt => ({
        id: pt.id,
        projectId: pt.project_id,
        taskId: pt.task_id,
        status: pt.status,
        actualHours: parseFloat(pt.actual_hours) || 0,
        assignedTo: pt.assigned_to,
        startDate: pt.start_date,
        endDate: pt.end_date,
        progressPercentage: pt.progress_percentage || 0,
        notes: pt.notes,
        assignedAt: pt.assigned_at,
        assignedBy: pt.assigned_by,
        createdAt: pt.created_at,
        updatedAt: pt.updated_at,
        taskOrder: pt.task_order || 0,
        task: pt.task ? {
          id: pt.task.id,
          title: pt.task.title,
          description: pt.task.description || '',
          category: pt.task.category || '',
          type: pt.task.type || 'custom',
          estimatedHours: parseFloat(pt.task.estimated_hours) || 0,
          taskOrder: pt.task.task_order || 0,
          createdBy: pt.task.created_by || '',
          createdAt: pt.task.created_at,
          updatedAt: pt.task.updated_at
        } : undefined,
        assignedUser: pt.assigned_user ? {
          id: pt.assigned_user.id,
          name: pt.assigned_user.name,
          role: pt.assigned_user.role
        } : undefined,
        collaborators: (pt.collaborators || []).map((collaborator: any) => ({
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
      }))

      setProjectTasks(formattedProjectTasks)
    } catch (err) {
      console.error('Error fetching project tasks:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar tareas del proyecto')
    } finally {
      setLoading(false)
    }
  }, [])

  // Crear nueva project_task
  const createProjectTask = async (projectTaskData: CreateProjectTaskData): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null)
      
      await PrismaTypedService.createProjectTask({
        project_id: projectTaskData.projectId,
        task_id: projectTaskData.taskId,
        status: projectTaskData.status || 'pending',
        actual_hours: projectTaskData.actualHours || 0,
        assigned_to: projectTaskData.assignedTo,
        start_date: projectTaskData.startDate,
        end_date: projectTaskData.endDate,
        progress_percentage: projectTaskData.progressPercentage || 0,
        notes: projectTaskData.notes,
        assigned_by: projectTaskData.assignedBy
      })

      // Actualizar estado local
      await fetchProjectTasks(projectId)
      
      return { success: true }
    } catch (err) {
      console.error('Error creating project task:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al crear tarea del proyecto'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Actualizar project_task
  const updateProjectTask = async (projectTaskId: string, projectTaskData: UpdateProjectTaskData, skipRefetch: boolean = false): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null)
      
      await PrismaTypedService.updateProjectTask(projectTaskId, {
        status: projectTaskData.status,
        actual_hours: projectTaskData.actualHours,
        assigned_to: projectTaskData.assignedTo,
        start_date: projectTaskData.startDate,
        end_date: projectTaskData.endDate,
        progress_percentage: projectTaskData.progressPercentage,
        notes: projectTaskData.notes,
        task_order: projectTaskData.taskOrder
      })

      // Verificar si todas las tareas están completadas y actualizar el proyecto
      if (projectTaskData.status === 'completed' && projectId) {
        await checkAndUpdateProjectStatus(projectId)
      }

      // Actualizar estado local solo si no se omite el refetch
      if (!skipRefetch) {
        await fetchProjectTasks(projectId)
      } else {
        // Actualizar solo el elemento específico en el estado local
        setProjectTasks(prev => prev.map(pt => 
          pt.id === projectTaskId 
            ? { ...pt, ...projectTaskData }
            : pt
        ))
      }
      
      return { success: true }
    } catch (err) {
      console.error('Error updating project task:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar tarea del proyecto'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Verificar si todas las tareas están completadas y actualizar el proyecto
  const checkAndUpdateProjectStatus = async (projectId: string) => {
    try {
      const tasks = await PrismaTypedService.getProjectTasks(projectId)
      
      // Verificar si todas las tareas están completadas
      const allTasksCompleted = tasks && tasks.length > 0 && tasks.every(task => task.status === 'completed')

      if (allTasksCompleted) {
        // Actualizar el proyecto a completado
        await PrismaTypedService.updateProject(projectId, {
          status: 'completed',
          end_date: new Date()
        })
        console.log(`Proyecto ${projectId} marcado como completado automáticamente`)
      }
    } catch (err) {
      console.error('Error checking project status:', err)
    }
  }

  // Eliminar project_task
  const deleteProjectTask = async (projectTaskId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null)
      
      await PrismaTypedService.deleteProjectTask(projectTaskId)

      // Actualizar estado local
      await fetchProjectTasks(projectId)
      
      return { success: true }
    } catch (err) {
      console.error('Error deleting project task:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar tarea del proyecto'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Asignar tarea estándar a proyecto
  const assignStandardTaskToProject = async (projectId: string, taskId: string, assignedBy?: string): Promise<{ success: boolean; error?: string }> => {
    return createProjectTask({
      projectId,
      taskId,
      assignedBy
    })
  }

  // Actualizar orden de tareas
  const updateTaskOrder = async (taskOrders: { id: string; taskOrder: number }[]): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null)
      
      // Convertir taskOrder a task_order para el servicio
      const prismaTaskOrders = taskOrders.map(({ id, taskOrder }) => ({
        id,
        task_order: taskOrder
      }))
      
      await PrismaTypedService.updateProjectTaskOrder(prismaTaskOrders)
      
      // Actualizar estado local
      await fetchProjectTasks(projectId)
      
      return { success: true }
    } catch (err) {
      console.error('Error updating task order:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar el orden de las tareas'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Cargar project_tasks al montar el componente
  useEffect(() => {
    fetchProjectTasks(projectId)
  }, [projectId, fetchProjectTasks])

  // Obtener project_tasks por proyecto
  const getProjectTasksByProject = (filterProjectId: string) => {
    return projectTasks.filter(pt => pt.projectId === filterProjectId)
  }

  // Obtener project_tasks por estado
  const getProjectTasksByStatus = (status: ProjectTask['status']) => {
    return projectTasks.filter(pt => pt.status === status)
  }

  // Obtener project_tasks asignadas a un usuario
  const getProjectTasksByUser = (userId: string) => {
    return projectTasks.filter(pt => pt.assignedTo === userId)
  }

  return {
    projectTasks,
    loading,
    error,
    createProjectTask,
    updateProjectTask,
    deleteProjectTask,
    updateTaskOrder,
    assignStandardTaskToProject,
    refetch: () => fetchProjectTasks(projectId),
    getProjectTasksByProject,
    getProjectTasksByStatus,
    getProjectTasksByUser
  }
}