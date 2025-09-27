import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { UserProfile } from './use-users'

export interface Operario extends UserProfile {
  currentTasks: string[]
}

export function useOperarios() {
  const [operarios, setOperarios] = useState<Operario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar operarios (usuarios con role='operario')
  const fetchOperarios = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'operario')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transformar datos para incluir currentTasks (vacío por ahora)
      const operariosData = (data || []).map(user => ({
        ...user,
        currentTasks: [] // Se puede implementar lógica para obtener tareas actuales
      }))

      setOperarios(operariosData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar operarios')
    } finally {
      setLoading(false)
    }
  }

  // Obtener estadísticas de un operario específico
  const getOperarioStats = async (operarioId: string) => {
    try {
      // Obtener tareas asignadas al operario
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', operarioId)

      if (tasksError) throw tasksError

      const total = tasks?.length || 0
      const completed = tasks?.filter(task => task.status === 'completed').length || 0
      const inProgress = tasks?.filter(task => task.status === 'in-progress').length || 0
      const pending = tasks?.filter(task => task.status === 'pending').length || 0

      return {
        total,
        completed,
        inProgress,
        pending,
      }
    } catch (err) {
      console.error('Error getting operario stats:', err)
      return {
        total: 0,
        completed: 0,
        inProgress: 0,
        pending: 0,
      }
    }
  }

  // Cargar operarios al montar el componente
  useEffect(() => {
    fetchOperarios()
  }, [])

  return {
    operarios,
    loading,
    error,
    fetchOperarios,
    getOperarioStats
  }
}