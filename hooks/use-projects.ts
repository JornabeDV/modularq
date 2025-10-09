"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Project, ProjectTask, ProjectOperario } from '@/lib/types'

// Detectar entorno
const isDevelopment = process.env.NODE_ENV === 'development'

export interface CreateProjectData {
  name: string
  description: string
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled'
  startDate?: string
  endDate?: string
  budget?: number
  supervisor?: string
  createdBy: string
  tasks?: string[] // Array de IDs de tareas
}

export interface UpdateProjectData extends Partial<CreateProjectData> {}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar proyectos
  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (isDevelopment) {
        // Usar Neon en desarrollo
        const response = await fetch('/api/neon/projects')
        const result = await response.json()
        
        if (!response.ok) {
          throw new Error(result.error || 'Error al obtener proyectos')
        }
        
        setProjects(result.data || [])
      } else {
        // Usar Supabase en producción
        const { data, error: fetchError } = await supabase
          .from('projects')
          .select(`
            *,
            project_tasks (
              id,
              project_id,
              task_id,
              status,
              actual_hours,
              assigned_to,
              start_date,
              end_date,
              progress_percentage,
              notes,
              assigned_at,
              assigned_by,
              created_at,
              updated_at,
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
            ),
            project_operarios (
              id,
              project_id,
              user_id,
              assigned_at,
              assigned_by,
              user:user_id (
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

        // Convertir datos de Supabase al formato Project
        const formattedProjects: Project[] = (data || []).map(project => ({
        id: project.id,
        name: project.name,
        description: project.description || '',
        status: project.status as Project['status'],
        startDate: project.start_date,
        endDate: project.end_date,
        supervisor: project.supervisor,
        progress: project.progress || 0,
        createdBy: project.created_by,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
        projectTasks: (project.project_tasks || []).map((pt: any) => ({
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
        })),
        projectOperarios: (project.project_operarios || []).map((po: any) => ({
          id: po.id,
          projectId: po.project_id,
          userId: po.user_id,
          assignedAt: po.assigned_at,
          assignedBy: po.assigned_by,
          user: po.user ? {
            id: po.user.id,
            name: po.user.name,
            role: po.user.role
          } : undefined
        }))
      }))

        setProjects(formattedProjects)
      }
    } catch (err) {
      console.error('Error fetching projects:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar proyectos')
    } finally {
      setLoading(false)
    }
  }

  // Crear nuevo proyecto
  const createProject = async (projectData: CreateProjectData): Promise<{ success: boolean; error?: string; projectId?: string }> => {
    try {
      setError(null)
      
      // Crear el proyecto
      const { data: projectResult, error: insertError } = await supabase
        .from('projects')
        .insert({
          name: projectData.name,
          description: projectData.description,
          status: projectData.status,
          start_date: projectData.startDate || null,
          end_date: projectData.endDate || null,
          supervisor: projectData.supervisor,
          created_by: projectData.createdBy
        })
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      // Obtener todas las tareas estándar
      const { data: standardTasks, error: standardTasksError } = await supabase
        .from('tasks')
        .select('id')
        .eq('type', 'standard')

      if (standardTasksError) {
        console.error('Error fetching standard tasks:', standardTasksError)
      }

      // Combinar tareas estándar con tareas personalizadas proporcionadas
      const allTaskIds = [
        ...(standardTasks?.map(task => task.id) || []),
        ...(projectData.tasks || [])
      ]

      // Asignar todas las tareas al proyecto
      if (allTaskIds.length > 0) {
        const projectTasks = allTaskIds.map(taskId => ({
          project_id: projectResult.id,
          task_id: taskId
        }))

        const { error: taskError } = await supabase
          .from('project_tasks')
          .insert(projectTasks)

        if (taskError) {
          console.error('Error assigning tasks to project:', taskError)
          // No lanzamos error aquí, el proyecto ya se creó
        }
      }

      // Actualizar estado local
      await fetchProjects()
      
      return { success: true, projectId: projectResult.id }
    } catch (err) {
      console.error('Error creating project:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al crear proyecto'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Actualizar proyecto
  const updateProject = async (projectId: string, projectData: UpdateProjectData): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null)
      
      const updateData: any = {}
      
      if (projectData.name !== undefined) updateData.name = projectData.name
      if (projectData.description !== undefined) updateData.description = projectData.description
      if (projectData.status !== undefined) updateData.status = projectData.status
      if (projectData.startDate !== undefined) updateData.start_date = projectData.startDate
      if (projectData.endDate !== undefined) updateData.end_date = projectData.endDate
      if (projectData.supervisor !== undefined) updateData.supervisor = projectData.supervisor

      // Actualizar el proyecto
      const { error: updateError } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', projectId)

      if (updateError) {
        throw updateError
      }

      // Manejar asignaciones de tareas si se proporcionan
      if (projectData.tasks !== undefined) {
        // Eliminar asignaciones existentes
        const { error: deleteError } = await supabase
          .from('project_tasks')
          .delete()
          .eq('project_id', projectId)

        if (deleteError) {
          console.error('Error deleting existing task assignments:', deleteError)
        }

        // Crear nuevas asignaciones si hay tareas
        if (projectData.tasks.length > 0) {
          const projectTasks = projectData.tasks.map(taskId => ({
            project_id: projectId,
            task_id: taskId
          }))

          const { error: taskError } = await supabase
            .from('project_tasks')
            .insert(projectTasks)

          if (taskError) {
            console.error('Error creating new task assignments:', taskError)
          }
        }
      }

      // Actualizar estado local
      await fetchProjects()
      
      return { success: true }
    } catch (err) {
      console.error('Error updating project:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar proyecto'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Eliminar proyecto
  const deleteProject = async (projectId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null)
      
      // Eliminar asignaciones de tareas primero
      const { error: taskError } = await supabase
        .from('project_tasks')
        .delete()
        .eq('project_id', projectId)

      if (taskError) {
        console.error('Error deleting project tasks:', taskError)
      }

      // Eliminar el proyecto
      const { error: deleteError } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (deleteError) {
        throw deleteError
      }

      // Actualizar estado local
      await fetchProjects()
      
      return { success: true }
    } catch (err) {
      console.error('Error deleting project:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar proyecto'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Cargar proyectos al montar el componente
  useEffect(() => {
    fetchProjects()
  }, [])

  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    refetch: fetchProjects
  }
}
