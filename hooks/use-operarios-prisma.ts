"use client"

import { useState, useEffect, useCallback } from 'react'
import { PrismaTypedService, type User } from '@/lib/prisma-typed-service'

export interface Operario extends User {
  currentTasks: string[]
}

export interface OperarioStats {
  total: number
  completed: number
  inProgress: number
  pending: number
}

export function useOperariosPrisma() {
  const [operarios, setOperarios] = useState<Operario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar operarios (usuarios con role='operario')
  const fetchOperarios = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const allUsers = await PrismaTypedService.getAllUsers()
      
      // Filtrar solo operarios y transformar datos
      const operariosData = allUsers
        .filter(user => user.role === 'operario')
        .map(user => ({
          ...user,
          currentTasks: [] // Se puede implementar lógica para obtener tareas actuales
        }))

      setOperarios(operariosData)
    } catch (err) {
      console.error('Error fetching operarios:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar operarios')
    } finally {
      setLoading(false)
    }
  }, [])

  // Obtener estadísticas de un operario específico
  const getOperarioStats = async (operarioId: string): Promise<OperarioStats> => {
    try {
      return await PrismaTypedService.getOperarioStats(operarioId)
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

  // Obtener operario por ID
  const getOperarioById = async (operarioId: string): Promise<Operario | null> => {
    try {
      const user = await PrismaTypedService.getUserById(operarioId)
      if (!user || user.role !== 'operario') {
        return null
      }
      
      return {
        ...user,
        currentTasks: []
      }
    } catch (err) {
      console.error('Error fetching operario by ID:', err)
      return null
    }
  }

  // Crear nuevo operario
  const createOperario = async (operarioData: {
    name: string
    email?: string
    password?: string
  }): Promise<{ success: boolean; error?: string; operario?: Operario }> => {
    try {
      setError(null)
      
      // Generar email automáticamente si no se proporciona
      const generateEmail = (name: string) => {
        const cleanName = name.toLowerCase()
          .replace(/[^a-z\s]/g, '') // Solo letras y espacios
          .replace(/\s+/g, '.') // Espacios a puntos
          .substring(0, 15) // Máximo 15 caracteres
        
        return `${cleanName}@modularq.local`
      }
      
      const email = operarioData.email || generateEmail(operarioData.name)
      
      const user = await PrismaTypedService.createUser({
        email,
        name: operarioData.name,
        role: 'operario',
        password: operarioData.password
      })

      const operario: Operario = {
        ...user,
        currentTasks: []
      }

      // Actualizar estado local
      await fetchOperarios()
      
      return { success: true, operario }
    } catch (err) {
      console.error('Error creating operario:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al crear operario'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Actualizar operario
  const updateOperario = async (operarioId: string, updates: {
    name?: string
    email?: string
    password?: string
    total_hours?: number
    efficiency?: number
  }): Promise<{ success: boolean; error?: string; operario?: Operario }> => {
    try {
      setError(null)
      
      const user = await PrismaTypedService.updateUser(operarioId, updates)
      
      const operario: Operario = {
        ...user,
        currentTasks: []
      }

      // Actualizar estado local
      await fetchOperarios()
      
      return { success: true, operario }
    } catch (err) {
      console.error('Error updating operario:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar operario'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Eliminar operario
  const deleteOperario = async (operarioId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null)
      
      await PrismaTypedService.deleteUser(operarioId)

      // Actualizar estado local
      await fetchOperarios()
      
      return { success: true }
    } catch (err) {
      console.error('Error deleting operario:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar operario'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Cargar operarios al montar el componente
  useEffect(() => {
    fetchOperarios()
  }, [fetchOperarios])

  return {
    operarios,
    loading,
    error,
    fetchOperarios,
    getOperarioStats,
    getOperarioById,
    createOperario,
    updateOperario,
    deleteOperario
  }
}