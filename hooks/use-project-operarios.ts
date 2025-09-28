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

  // Cargar operarios asignados al proyecto
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
        .order('assigned_at', { ascending: false })

      if (filterProjectId) {
        query = query.eq('project_id', filterProjectId)
      }

      const { data, error: fetchError } = await query

      if (fetchError) {
        throw fetchError
      }

      // Convertir datos de Supabase al formato ProjectOperario
      const formattedOperarios: ProjectOperario[] = (data || []).map(operario => ({
        id: operario.id,
        projectId: operario.project_id,
        userId: operario.user_id,
        assignedAt: operario.assigned_at,
        assignedBy: operario.assigned_by,
        user: operario.user ? {
          id: operario.user.id,
          name: operario.user.name,
          email: operario.user.email,
          role: operario.user.role,
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

  // Asignar operario al proyecto
  const assignOperarioToProject = async (assignmentData: CreateProjectOperarioData) => {
    try {
      const { data, error } = await supabase
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

      if (error) {
        throw error
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
          department: data.user.department
        } : undefined
      }

      setProjectOperarios(prev => [newOperario, ...prev])
      return { success: true }
    } catch (err) {
      console.error('Error assigning operario to project:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Error al asignar operario al proyecto' 
      }
    }
  }

  // Desasignar operario del proyecto
  const unassignOperarioFromProject = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('project_operarios')
        .delete()
        .eq('id', assignmentId)

      if (error) {
        throw error
      }

      setProjectOperarios(prev => prev.filter(operario => operario.id !== assignmentId))
      return { success: true }
    } catch (err) {
      console.error('Error unassigning operario from project:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Error al desasignar operario del proyecto' 
      }
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
