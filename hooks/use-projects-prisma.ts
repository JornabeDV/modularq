"use client"

import { useState, useEffect } from 'react'
import { PrismaTypedService } from '@/lib/prisma-typed-service'
import type { Project, User } from '@/lib/prisma-typed-service'

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
      
      const projects = await PrismaTypedService.getAllProjects()
      setProjects(projects)
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
      
      return { success: true, project }
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
      
      return { success: true, project }
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
  const getProjectById = async (projectId: string): Promise<Project | null> => {
    try {
      return await PrismaTypedService.getProjectById(projectId)
    } catch (err) {
      console.error('Error fetching project by ID:', err)
      return null
    }
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