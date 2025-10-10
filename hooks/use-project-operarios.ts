"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface ProjectOperario {
  id: string
  projectId: string
  userId: string
  assignedAt: string
  assignedBy?: string
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
  assignedBy?: string
}

export function useProjectOperarios(projectId?: string) {
  const [projectOperarios, setProjectOperarios] = useState<ProjectOperario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar operarios de proyectos
  const fetchProjectOperarios = async (filterProjectId?: string) => {
    try {
      setLoading(true)
      setError(null)
      
      let query = supabase
        .from('project_operarios')
        .select(`
          *,
          user:user_id (
            id,
            name,
            email,
            role
          )
        `)

      if (filterProjectId) {
        query = query.eq('project_id', filterProjectId)
      }

      const { data, error: fetchError } = await query.order('assigned_at', { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      const formattedOperarios: ProjectOperario[] = (data || []).map(row => ({
        id: row.id,
        projectId: row.project_id,
        userId: row.user_id,
        assignedAt: row.assigned_at,
        assignedBy: row.assigned_by,
        user: row.user ? {
          id: row.user.id,
          name: row.user.name,
          email: row.user.email,
          role: row.user.role,
        } : undefined
      }))

      setProjectOperarios(formattedOperarios)
    } catch (err) {
      console.error('Error fetching project operarios:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar operarios del proyecto')
    } finally {
      setLoading(false)
    }
  }

  // Asignar operario a proyecto
  const assignOperarioToProject = async (assignmentData: CreateProjectOperarioData): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null)
      
      const { data, error: insertError } = await supabase
        .from('project_operarios')
        .insert({
          project_id: assignmentData.projectId,
          user_id: assignmentData.userId,
          assigned_by: assignmentData.assignedBy
        })
        .select(`
          *,
          user:user_id (
            id,
            name,
            email,
            role
          )
        `)
        .single()

      if (insertError) {
        throw insertError
      }

      const newOperario: ProjectOperario = {
        id: data.id,
        projectId: data.project_id,
        userId: data.user_id,
        assignedAt: data.assigned_at,
        assignedBy: data.assigned_by,
        user: data.user ? {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
        } : undefined
      }

      setProjectOperarios(prev => [newOperario, ...prev])
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
      
      const { error: deleteError } = await supabase
        .from('project_operarios')
        .delete()
        .eq('id', assignmentId)

      if (deleteError) {
        throw deleteError
      }

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
  }, [projectId])

  return {
    projectOperarios,
    loading,
    error,
    assignOperarioToProject,
    unassignOperarioFromProject,
    refetch: () => fetchProjectOperarios(projectId)
  }
}