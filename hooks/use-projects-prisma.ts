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
  client_id?: string
  created_by?: string
}

export interface UpdateProjectData {
  name?: string
  description?: string
  status?: 'planning' | 'active' | 'paused' | 'completed'
  start_date?: Date
  end_date?: Date
  client_id?: string
  project_order?: number
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
        projectOrder: project.project_order || undefined,
        createdBy: project.created_by,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
        clientId: project.client_id,
        client: project.clients ? {
          id: project.clients.id,
          cuit: project.clients.cuit,
          companyName: project.clients.company_name,
          representative: project.clients.representative,
          email: project.clients.email,
          phone: project.clients.phone
        } : undefined,
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
        client_id: projectData.client_id,
        created_by: projectData.created_by
      })

      // Asignar automáticamente todas las tareas estándar al nuevo proyecto
      try {
        const standardTasks = await PrismaTypedService.getAllTasks()
        const standardTasksOnly = standardTasks.filter(task => task.type === 'standard')
        
        // Crear project_tasks para cada tarea estándar
        for (const task of standardTasksOnly) {
          await PrismaTypedService.createProjectTask({
            project_id: project.id,
            task_id: task.id,
            status: 'pending',
            actual_hours: 0,
            progress_percentage: 0,
            assigned_by: projectData.created_by
          })
        }
        
        console.log(`✅ Asignadas ${standardTasksOnly.length} tareas estándar al proyecto "${project.name}"`)
      } catch (taskError) {
        console.error('Error asignando tareas estándar:', taskError)
        // No fallar la creación del proyecto si hay error con las tareas
      }

      // Convertir el proyecto de Prisma al formato Project personalizado
      const formattedProject: Project = {
        id: project.id,
        name: project.name,
        description: project.description || '',
        status: project.status as Project['status'],
        startDate: typeof project.start_date === 'string' ? project.start_date : project.start_date.toISOString(),
        endDate: project.end_date ? (typeof project.end_date === 'string' ? project.end_date : project.end_date.toISOString()) : undefined,
        supervisor: project.supervisor_id || undefined,
        progress: project.progress || 0,
        projectOrder: project.project_order || undefined,
        createdBy: projectData.created_by || '',
        createdAt: typeof project.created_at === 'string' ? project.created_at : project.created_at.toISOString(),
        updatedAt: typeof project.updated_at === 'string' ? project.updated_at : project.updated_at.toISOString(),
        projectTasks: [], // Se llenará cuando se haga fetchProjects
        projectOperarios: [] // Se llenará cuando se haga fetchProjects
      }

      // Actualizar estado local
      await fetchProjects()
      
      return { success: true, project: formattedProject } // Devolver el proyecto creado
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
        end_date: projectData.end_date,
        client_id: projectData.client_id
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

  // Reordenar proyectos
  const reorderProjects = async (projectOrders: { id: string; projectOrder: number }[]): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null)
      
      // Actualizar cada proyecto con su nuevo orden
      for (const { id, projectOrder } of projectOrders) {
        await PrismaTypedService.updateProject(id, {
          project_order: projectOrder
        })
      }

      // Actualizar estado local directamente sin recargar
      setProjects(prevProjects => {
        const updatedProjects = [...prevProjects]
        projectOrders.forEach(({ id, projectOrder }) => {
          const projectIndex = updatedProjects.findIndex(p => p.id === id)
          if (projectIndex !== -1) {
            updatedProjects[projectIndex] = {
              ...updatedProjects[projectIndex],
              projectOrder
            }
          }
        })
        // Reordenar el array según el nuevo projectOrder
        return updatedProjects.sort((a, b) => {
          const orderA = a.projectOrder || 0
          const orderB = b.projectOrder || 0
          if (orderA !== orderB) return orderA - orderB
          // Si tienen el mismo orden, mantener el orden por fecha de creación
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
      })
      
      return { success: true }
    } catch (err) {
      console.error('Error reordering projects:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al reordenar proyectos'
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
    reorderProjects,
    getProjectById,
    refetch: fetchProjects
  }
}