"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { ProjectTask, Task } from '@/lib/types'

export interface CreateProjectTaskData {
  projectId: string
  taskId: string
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  actualHours?: number
  assignedTo?: string
  startDate?: string
  endDate?: string
  progressPercentage?: number
  notes?: string
  assignedBy?: string
}

export interface UpdateProjectTaskData extends Partial<CreateProjectTaskData> {}

export function useProjectTasks(projectId?: string) {
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar project_tasks desde Supabase
  const fetchProjectTasks = async (filterProjectId?: string) => {
    try {
      setLoading(true)
      setError(null)
      
      let query = supabase
        .from('project_tasks')
        .select(`
          *,
          task:task_id (
            id,
            title,
            description,
            category,
            type,
            estimated_hours,
            created_by,
            created_at,
            updated_at
          ),
          assigned_user:assigned_to (
            id,
            name,
            role
          ),
          collaborators:task_collaborators (
            id,
            project_task_id,
            user_id,
            added_by,
            added_at,
            created_at,
            updated_at,
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
          )
        `)
        .order('task_order', { ascending: true })

      if (filterProjectId) {
        query = query.eq('project_id', filterProjectId)
      }

      const { data, error: fetchError } = await query

      if (fetchError) {
        throw fetchError
      }

      
      // Convertir datos de Supabase al formato ProjectTask
      const formattedProjectTasks: ProjectTask[] = (data || []).map(pt => ({
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
  }

  // Crear nueva project_task
  const createProjectTask = async (projectTaskData: CreateProjectTaskData): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null)
      
      const { data, error: insertError } = await supabase
        .from('project_tasks')
        .insert({
          project_id: projectTaskData.projectId,
          task_id: projectTaskData.taskId,
          status: projectTaskData.status || 'pending',
          actual_hours: projectTaskData.actualHours || 0,
          assigned_to: projectTaskData.assignedTo || null,
          start_date: projectTaskData.startDate || null,
          end_date: projectTaskData.endDate || null,
          progress_percentage: projectTaskData.progressPercentage || 0,
          notes: projectTaskData.notes || null,
          assigned_by: projectTaskData.assignedBy || null
        })
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

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
      
      const updateData: any = {}
      
      if (projectTaskData.status !== undefined) updateData.status = projectTaskData.status
      if (projectTaskData.actualHours !== undefined) updateData.actual_hours = projectTaskData.actualHours
      if (projectTaskData.assignedTo !== undefined) updateData.assigned_to = projectTaskData.assignedTo
      if (projectTaskData.startDate !== undefined) updateData.start_date = projectTaskData.startDate
      if (projectTaskData.endDate !== undefined) updateData.end_date = projectTaskData.endDate
      if (projectTaskData.progressPercentage !== undefined) updateData.progress_percentage = projectTaskData.progressPercentage
      if (projectTaskData.notes !== undefined) updateData.notes = projectTaskData.notes

      const { error: updateError } = await supabase
        .from('project_tasks')
        .update(updateData)
        .eq('id', projectTaskId)

      if (updateError) {
        console.error('Supabase update error:', updateError)
        throw updateError
      }

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

  // Eliminar project_task
  const deleteProjectTask = async (projectTaskId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null)
      
      const { error: deleteError } = await supabase
        .from('project_tasks')
        .delete()
        .eq('id', projectTaskId)

      if (deleteError) {
        throw deleteError
      }

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

  // Cargar project_tasks al montar el componente
  useEffect(() => {
    fetchProjectTasks(projectId)
  }, [projectId])

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

  // Actualizar orden de tareas
  const updateTaskOrder = async (taskOrders: { id: string; taskOrder: number }[]): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null)
      
      // Actualizar cada tarea con su nuevo orden
      const updatePromises = taskOrders.map(({ id, taskOrder }) =>
        supabase
          .from('project_tasks')
          .update({ task_order: taskOrder })
          .eq('id', id)
      )
      
      const results = await Promise.all(updatePromises)
      
      // Verificar si hubo errores
      const hasError = results.some(result => result.error)
      if (hasError) {
        throw new Error('Error actualizando el orden de las tareas')
      }
      
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