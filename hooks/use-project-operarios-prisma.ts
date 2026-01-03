"use client"

import { useState, useEffect, useCallback } from 'react'
import { PrismaTypedService } from '@/lib/prisma-typed-service'
import type { ProjectOperario } from '@/lib/generated/prisma/index'

export interface ProjectOperarioWithUser extends ProjectOperario {
  user?: {
    id: string
    name: string
    email: string
    role: string
  }
}

export interface CreateProjectOperarioData {
  projectId: string
  userId: string
}

export function useProjectOperariosPrisma(projectId?: string) {
  const [projectOperarios, setProjectOperarios] = useState<ProjectOperarioWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar operarios de proyectos
  const fetchProjectOperarios = useCallback(async (filterProjectId?: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const operarios = await PrismaTypedService.getProjectOperarios(filterProjectId)
      setProjectOperarios(operarios)
    } catch (err) {
      console.error('Error fetching project operarios:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar operarios del proyecto')
    } finally {
      setLoading(false)
    }
  }, [])

  // Asignar operario a proyecto
  const assignOperarioToProject = async (assignmentData: CreateProjectOperarioData): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null)
      
      const operario = await PrismaTypedService.assignOperarioToProject({
        project_id: assignmentData.projectId,
        user_id: assignmentData.userId
      })

      // Actualizar estado local
      await fetchProjectOperarios(projectId)
      
      return { success: true }
    } catch (err) {
      console.error('Error assigning operario to project:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al asignar operario al proyecto'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Desasignar operario de proyecto
  const unassignOperarioFromProject = async (assignmentId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null)
      
      await PrismaTypedService.unassignOperarioFromProject(assignmentId)

      // Actualizar estado local
      setProjectOperarios(prev => prev.filter(operario => operario.id !== assignmentId))
      
      return { success: true }
    } catch (err) {
      console.error('Error unassigning operario from project:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al desasignar operario del proyecto'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchProjectOperarios(projectId)
  }, [projectId, fetchProjectOperarios])

  return {
    projectOperarios,
    loading,
    error,
    assignOperarioToProject,
    unassignOperarioFromProject,
    refetch: () => fetchProjectOperarios(projectId)
  }
}