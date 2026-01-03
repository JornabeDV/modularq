"use client"

import { useState, useEffect, useCallback } from 'react'
import { PrismaTypedService } from '@/lib/prisma-typed-service'
import { supabase } from '@/lib/supabase'
import type { ProjectTask } from '@/lib/types'

export interface CreateProjectTaskData {
  projectId: string
  taskId: string
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  estimatedHours?: number  // Tiempo estimado total para este proyecto (opcional, se calcula automáticamente si no se proporciona)
  actualHours?: number
  assignedTo?: string
  startDate?: string
  endDate?: string
  progressPercentage?: number
  notes?: string
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
        estimatedHours: parseFloat(pt.estimated_hours) || 0,  // Tiempo estimado del proyecto
        actualHours: parseFloat(pt.actual_hours) || 0,
        assignedTo: pt.assigned_to,
        startDate: pt.start_date,
        endDate: pt.end_date,
        progressPercentage: pt.progress_percentage || 0,
        notes: pt.notes,
        assignedAt: pt.assigned_at,
        createdAt: pt.created_at,
        updatedAt: pt.updated_at,
        taskOrder: pt.task_order || 0,
        startedBy: pt.started_by,
        startedAt: pt.started_at,
        completedBy: pt.completed_by,
        completedAt: pt.completed_at,
        task: pt.task ? {
          id: pt.task.id,
          title: pt.task.title,
          description: pt.task.description || '',
          category: pt.task.category || '',
          type: pt.task.type || 'custom',
          estimatedHours: parseFloat(pt.task.estimated_hours) || 0,  // Tiempo estimado base (por 1 módulo)
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
        startedByUser: pt.started_by_user ? {
          id: pt.started_by_user.id,
          name: pt.started_by_user.name,
          role: pt.started_by_user.role
        } : undefined,
        completedByUser: pt.completed_by_user ? {
          id: pt.completed_by_user.id,
          name: pt.completed_by_user.name,
          role: pt.completed_by_user.role
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
      
      // Si no se proporciona estimatedHours, calcularlo automáticamente
      let estimatedHours = projectTaskData.estimatedHours
      if (estimatedHours === undefined) {
        // Obtener la tarea y el proyecto para calcular el tiempo estimado
        const [task, project] = await Promise.all([
          PrismaTypedService.getTaskById(projectTaskData.taskId),
          PrismaTypedService.getProjectById(projectTaskData.projectId)
        ])
        
        if (task && project) {
          // Calcular: tiempo base de la tarea * cantidad de módulos del proyecto
          estimatedHours = (task.estimated_hours || 0) * (project.module_count || 1)
        } else {
          estimatedHours = 0
        }
      }
      
      await PrismaTypedService.createProjectTask({
        project_id: projectTaskData.projectId,
        task_id: projectTaskData.taskId,
        status: projectTaskData.status || 'pending',
        estimated_hours: estimatedHours,
        actual_hours: projectTaskData.actualHours || 0,
        assigned_to: projectTaskData.assignedTo,
        start_date: projectTaskData.startDate,
        end_date: projectTaskData.endDate,
        progress_percentage: projectTaskData.progressPercentage || 0,
        notes: projectTaskData.notes
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
  const updateProjectTask = async (projectTaskId: string, projectTaskData: UpdateProjectTaskData, skipRefetch: boolean = false, userId?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null)
      
      // Validación: si el nuevo estado es 'in_progress' o 'completed', verificar que haya un operario asignado
      if (projectTaskData.status === 'in_progress' || projectTaskData.status === 'completed') {
        // Obtener la tarea actual para verificar si tiene operario asignado
        const currentTask = projectTasks.find(pt => pt.id === projectTaskId)
        const assignedTo = projectTaskData.assignedTo || currentTask?.assignedTo
        
        if (!assignedTo) {
          return { 
            success: false, 
            error: 'Debe asignar un operario antes de cambiar el estado a "En Progreso" o "Completada"' 
          }
        }
      }
      
      // Obtener la tarea actual para verificar el estado anterior
      const currentTask = projectTasks.find(pt => pt.id === projectTaskId)
      const previousStatus = currentTask?.status
      const newStatus = projectTaskData.status
      
      // Preparar datos de actualización con tracking
      const updateData: any = {
        status: projectTaskData.status,
        actual_hours: projectTaskData.actualHours,
        assigned_to: projectTaskData.assignedTo === undefined ? undefined : (projectTaskData.assignedTo || null),
        start_date: projectTaskData.startDate,
        end_date: projectTaskData.endDate,
        progress_percentage: projectTaskData.progressPercentage,
        notes: projectTaskData.notes,
        task_order: projectTaskData.taskOrder
      }
      
      // Si el estado cambia a 'in_progress' y no estaba ya en 'in_progress', guardar started_by y started_at
      if (newStatus === 'in_progress' && previousStatus !== 'in_progress' && userId) {
        updateData.started_by = userId
        updateData.started_at = new Date().toISOString()
      }
      
      // Si el estado cambia a 'completed' y no estaba ya en 'completed', guardar completed_by y completed_at
      if (newStatus === 'completed' && previousStatus !== 'completed' && userId) {
        updateData.completed_by = userId
        updateData.completed_at = new Date().toISOString()
      }
      
      // Si se está completando la tarea, cerrar todas las sesiones activas primero
      if (projectTaskData.status === 'completed') {
        try {
          // Obtener información de la tarea para cerrar sesiones activas
          const { data: projectTask, error: fetchError } = await supabase
            .from('project_tasks')
            .select('task_id, project_id')
            .eq('id', projectTaskId)
            .single()

          if (!fetchError && projectTask) {
            const now = new Date()
            const { data: activeEntries, error: entriesError } = await supabase
              .from('time_entries')
              .select('id, description')
              .eq('task_id', projectTask.task_id)
              .eq('project_id', projectTask.project_id)
              .is('end_time', null)

            if (!entriesError && activeEntries && activeEntries.length > 0) {
              // Cerrar todas las sesiones activas sin calcular horas
              for (const entry of activeEntries) {
                await supabase
                  .from('time_entries')
                  .update({
                    end_time: now.toISOString(),
                    description: entry.description || 'Sesión cerrada al completar la tarea'
                  })
                  .eq('id', entry.id)
              }
            }
          }
        } catch (err) {
          console.error('Error closing active sessions:', err)
          // Continuar con la actualización de la tarea aunque haya error al cerrar sesiones
        }
      }
      
      await PrismaTypedService.updateProjectTask(projectTaskId, updateData)

      // Verificar si todas las tareas están completadas y actualizar el proyecto
      if (projectTaskData.status === 'completed' && projectId) {
        await checkAndUpdateProjectStatus(projectId)
      }

      const optimisticUpdate = (prev: ProjectTask[]) => {
        return prev.map(pt => {
          if (pt.id !== projectTaskId) return pt
          
          const updated: ProjectTask = {
            ...pt,
            ...(projectTaskData.status !== undefined && { status: projectTaskData.status as any }),
            ...(projectTaskData.actualHours !== undefined && { actualHours: projectTaskData.actualHours }),
            ...(projectTaskData.assignedTo !== undefined && { assignedTo: projectTaskData.assignedTo }),
            ...(projectTaskData.startDate !== undefined && { startDate: projectTaskData.startDate }),
            ...(projectTaskData.endDate !== undefined && { endDate: projectTaskData.endDate }),
            ...(projectTaskData.progressPercentage !== undefined && { progressPercentage: projectTaskData.progressPercentage }),
            ...(projectTaskData.notes !== undefined && { notes: projectTaskData.notes }),
            ...(projectTaskData.taskOrder !== undefined && { taskOrder: projectTaskData.taskOrder }),
            ...(projectTaskData.assignedTo === null && pt.assignedTo !== undefined
              ? { assignedUser: undefined }
              : {}
            ),
            ...(newStatus === 'in_progress' && previousStatus !== 'in_progress' && userId
              ? { startedBy: userId, startedAt: new Date().toISOString() }
              : {}
            ),
            ...(newStatus === 'completed' && previousStatus !== 'completed' && userId
              ? { completedBy: userId, completedAt: new Date().toISOString() }
              : {}
            ),
          }
          
          return updated
        })
      }
      
      setProjectTasks(optimisticUpdate)

      if (!skipRefetch) {
        await fetchProjectTasks(projectId)
      } else {
        try {
          const tasks = await PrismaTypedService.getProjectTasks(projectId)
          const updatedTask = tasks.find((t: any) => t.id === projectTaskId)
          
          if (updatedTask) {
            const formattedTask: ProjectTask = {
              id: updatedTask.id,
              projectId: updatedTask.project_id,
              taskId: updatedTask.task_id,
              status: updatedTask.status,
              estimatedHours: parseFloat(updatedTask.estimated_hours) || 0,
              actualHours: parseFloat(updatedTask.actual_hours) || 0,
              assignedTo: updatedTask.assigned_to,
              startDate: updatedTask.start_date,
              endDate: updatedTask.end_date,
              progressPercentage: updatedTask.progress_percentage || 0,
              notes: updatedTask.notes,
              assignedAt: updatedTask.assigned_at,
              createdAt: updatedTask.created_at,
              updatedAt: updatedTask.updated_at,
              taskOrder: updatedTask.task_order || 0,
              startedBy: updatedTask.started_by,
              startedAt: updatedTask.started_at,
              completedBy: updatedTask.completed_by,
              completedAt: updatedTask.completed_at,
              task: updatedTask.task ? {
                id: updatedTask.task.id,
                title: updatedTask.task.title,
                description: updatedTask.task.description || '',
                category: updatedTask.task.category || '',
                type: updatedTask.task.type || 'custom',
                estimatedHours: parseFloat(updatedTask.task.estimated_hours) || 0,
                taskOrder: updatedTask.task.task_order || 0,
                createdBy: updatedTask.task.created_by || '',
                createdAt: updatedTask.task.created_at,
                updatedAt: updatedTask.task.updated_at
              } : undefined,
              assignedUser: updatedTask.assigned_user ? {
                id: updatedTask.assigned_user.id,
                name: updatedTask.assigned_user.name,
                role: updatedTask.assigned_user.role
              } : undefined,
              startedByUser: updatedTask.started_by_user ? {
                id: updatedTask.started_by_user.id,
                name: updatedTask.started_by_user.name,
                role: updatedTask.started_by_user.role
              } : undefined,
              completedByUser: updatedTask.completed_by_user ? {
                id: updatedTask.completed_by_user.id,
                name: updatedTask.completed_by_user.name,
                role: updatedTask.completed_by_user.role
              } : undefined,
              collaborators: (updatedTask.collaborators || []).map((collaborator: any) => ({
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
            }
            
            setProjectTasks(prev => prev.map(pt => 
              pt.id === projectTaskId ? formattedTask : pt
            ))
          }
        } catch (fetchErr) {
          console.error('Error fetching updated task:', fetchErr)
        }
      }
      
      return { success: true }
    } catch (err) {
      console.error('Error updating project task:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar tarea del proyecto'
      setError(errorMessage)
      
      await fetchProjectTasks(projectId)
      
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
  const assignStandardTaskToProject = async (projectId: string, taskId: string): Promise<{ success: boolean; error?: string }> => {
    return createProjectTask({
      projectId,
      taskId
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