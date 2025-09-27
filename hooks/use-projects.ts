"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Project, Task } from '@/lib/types'

export interface CreateProjectData {
  name: string
  description: string
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled'
  startDate?: string
  endDate?: string
  budget?: number
  supervisor?: string
  department?: string
  createdBy: string
  tasks?: string[] // Array de IDs de tareas
}

export interface UpdateProjectData extends Partial<CreateProjectData> {}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar proyectos desde Supabase
  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error: fetchError } = await supabase
        .from('projects')
        .select(`
          *,
          project_tasks (
            task_id,
            tasks (
              id,
              title,
              description,
              estimated_hours,
              actual_hours,
              category,
              is_template,
              created_by,
              created_at,
              updated_at
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
        department: project.department,
        createdBy: project.created_by,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
        tasks: project.project_tasks?.map((pt: any) => ({
          id: pt.tasks.id,
          projectId: project.id,
          title: pt.tasks.title,
          description: pt.tasks.description || '',
          assignedTo: undefined,
          assignedUsers: [],
          estimatedHours: parseFloat(pt.tasks.estimated_hours) || 0,
          actualHours: parseFloat(pt.tasks.actual_hours) || 0,
          startDate: undefined,
          endDate: undefined,
          dependencies: [],
          category: pt.tasks.category || '',
          skills: [],
          isTemplate: pt.tasks.is_template || false,
          createdBy: pt.tasks.created_by || '',
          createdAt: pt.tasks.created_at,
          updatedAt: pt.tasks.updated_at
        })) || []
      }))

      setProjects(formattedProjects)
    } catch (err) {
      console.error('Error fetching projects:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar proyectos')
    } finally {
      setLoading(false)
    }
  }

  // Crear nuevo proyecto
  const createProject = async (projectData: CreateProjectData): Promise<{ success: boolean; error?: string }> => {
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
          department: projectData.department,
          created_by: projectData.createdBy
        })
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      // Asignar tareas si se proporcionan
      if (projectData.tasks && projectData.tasks.length > 0) {
        const projectTasks = projectData.tasks.map(taskId => ({
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
      
      return { success: true }
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
      if (projectData.department !== undefined) updateData.department = projectData.department

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
