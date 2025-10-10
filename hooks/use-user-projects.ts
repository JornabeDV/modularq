"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Project } from '@/lib/types'

export function useUserProjects(userId?: string) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar proyectos del usuario
  const fetchUserProjects = async (filterUserId?: string) => {
    try {
      setLoading(true)
      setError(null)
      
      if (!filterUserId) {
        setProjects([])
        return
      }

      const { data, error: fetchError } = await supabase
        .from('projects')
        .select(`
          *,
          project_operarios!inner (
            user_id
          ),
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
            )
          )
        `)
        .eq('project_operarios.user_id', filterUserId)
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
  }

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchUserProjects(userId)
  }, [userId])

  return {
    projects,
    loading,
    error,
    refetch: () => fetchUserProjects(userId)
  }
}