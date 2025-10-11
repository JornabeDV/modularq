"use client"

import { useState, useEffect } from 'react'
import { PrismaTypedService } from '@/lib/prisma-typed-service'
import type { Project } from '@/lib/types'

export interface CreateProjectData {
  name: string
  description?: string
  status?: 'planning' | 'active' | 'paused' | 'completed'
  start_date?: Date
  end_date?: Date
  created_by?: string
}

export interface UpdateProjectData {
  name?: string
  description?: string
  status?: 'planning' | 'active' | 'paused' | 'completed'
  start_date?: Date
  end_date?: Date
}

export function useProjectsPrisma() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar proyectos
  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await PrismaTypedService.getAllProjects()
      
      // Convertir datos al formato Project
      const formattedProjects: Project[] = data.map(project => ({
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
          } : undefined
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
    } catch (err) {
      console.error('Error fetching projects:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar proyectos')
    } finally {
      setLoading(false)
    }
  }

  // Crear nuevo proyecto
  const createProject = async (projectData: CreateProjectData): Promise<{ success: boolean; error?: string; project?: Project }> => {
    try {
      setError(null)
      
      const project = await PrismaTypedService.createProject({
        name: projectData.name,
        description: projectData.description,
        status: projectData.status || 'planning',
        start_date: projectData.start_date || new Date(),
        end_date: projectData.end_date,
        created_by: projectData.created_by
      })

      // Actualizar estado local
      await fetchProjects()
      
      return { success: true, project: undefined } // El proyecto se obtiene del fetchProjects
    } catch (err) {
      console.error('Error creating project:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al crear proyecto'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Actualizar proyecto
  const updateProject = async (projectId: string, projectData: UpdateProjectData): Promise<{ success: boolean; error?: string; project?: Project }> => {
    try {
      setError(null)
      
      const project = await PrismaTypedService.updateProject(projectId, {
        name: projectData.name,
        description: projectData.description,
        status: projectData.status,
        start_date: projectData.start_date,
        end_date: projectData.end_date
      })

      // Actualizar estado local
      await fetchProjects()
      
      return { success: true, project: undefined } // El proyecto se obtiene del fetchProjects
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
      
      await PrismaTypedService.deleteProject(projectId)

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

  // Obtener proyecto por ID
  const getProjectById = (projectId: string): Project | undefined => {
    return projects.find(p => p.id === projectId)
  }

  // Cargar datos al montar el componente
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
    getProjectById,
    refetch: fetchProjects
  }
}