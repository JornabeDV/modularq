"use client"

import { useState, useEffect, useCallback } from 'react'
import { PrismaTypedService } from '@/lib/prisma-typed-service'
import type { Project } from '@/lib/types'

export function useUserProjectsPrisma(userId?: string) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar proyectos del usuario
  const fetchUserProjects = useCallback(async (filterUserId?: string) => {
    try {
      setLoading(true)
      setError(null)
      
      if (!filterUserId) {
        setProjects([])
        return
      }

      const data = await PrismaTypedService.getUserProjects(filterUserId)

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
          } : undefined
        })),
        projectOperarios: (project.project_operarios || []).map((po: any) => ({
          id: po.id,
          projectId: po.project_id,
          userId: po.user_id,
          assignedAt: po.assigned_at,
          user: po.user ? {
            id: po.user.id,
            name: po.user.name,
            role: po.user.role
          } : undefined
        }))
      }))

      setProjects(formattedProjects)
    } catch (err) {
      console.error('Error fetching user projects:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar proyectos del usuario')
    } finally {
      setLoading(false)
    }
  }, [])

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchUserProjects(userId)
  }, [userId, fetchUserProjects])

  return {
    projects,
    loading,
    error,
    refetch: () => fetchUserProjects(userId)
  }
}