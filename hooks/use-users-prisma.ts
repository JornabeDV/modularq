"use client"

import { useState, useEffect } from 'react'
import { PrismaTypedService } from '@/lib/prisma-typed-service'
import type { User } from '@/lib/prisma-typed-service'

export interface CreateUserData {
  name: string
  role: 'admin' | 'supervisor' | 'operario'
  password?: string
}

export interface UpdateUserData {
  email?: string
  name?: string
  role?: 'admin' | 'supervisor' | 'operario'
  password?: string
  total_hours?: number
  efficiency?: number
}

export function useUsersPrisma() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar usuarios
  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const users = await PrismaTypedService.getAllUsers()
      setUsers(users)
    } catch (err) {
      console.error('Error fetching users:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  // Crear usuario
  const createUser = async (userData: CreateUserData): Promise<{ success: boolean; error?: string; user?: User }> => {
    try {
      setError(null)
      
      // Generar email automáticamente basado en el nombre
      const generateEmail = (name: string) => {
        const cleanName = name.toLowerCase()
          .replace(/[^a-z\s]/g, '') // Solo letras y espacios
          .replace(/\s+/g, '.') // Espacios a puntos
          .substring(0, 15) // Máximo 15 caracteres
        
        return `${cleanName}@modularq.local`
      }
      
      const generatedEmail = generateEmail(userData.name)
      
      const user = await PrismaTypedService.createUser({
        email: generatedEmail,
        name: userData.name,
        role: userData.role,
        password: userData.password
      })

      // Actualizar estado local
      await fetchUsers()
      
      return { 
        success: true, 
        user
      }
    } catch (err) {
      console.error('Error creating user:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al crear usuario'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Obtener usuario por ID
  const getUserById = async (userId: string): Promise<User | null> => {
    try {
      return await PrismaTypedService.getUserById(userId)
    } catch (err) {
      console.error('Error fetching user by ID:', err)
      return null
    }
  }

  // Actualizar usuario
  const updateUser = async (userId: string, updates: UpdateUserData): Promise<{ success: boolean; error?: string; user?: User }> => {
    try {
      setError(null)
      
      // No incluir password si está vacío o es solo espacios
      const updateData: UpdateUserData = {
        email: updates.email,
        name: updates.name,
        role: updates.role,
        total_hours: updates.total_hours,
        efficiency: updates.efficiency
      }
      
      // Solo incluir password si tiene un valor no vacío
      if (updates.password && updates.password.trim() !== '') {
        updateData.password = updates.password
      }
      
      const user = await PrismaTypedService.updateUser(userId, updateData)

      // Actualizar estado local
      await fetchUsers()
      
      return { success: true, user }
    } catch (err) {
      console.error('Error updating user:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar usuario'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Eliminar usuario
  const deleteUser = async (userId: string, currentUserId?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null)
      
      // Verificar si el usuario está intentando eliminarse a sí mismo
      if (currentUserId && userId === currentUserId) {
        throw new Error('No puedes eliminarte a ti mismo')
      }
      
      await PrismaTypedService.deleteUser(userId)

      // Actualizar estado local
      await fetchUsers()
      
      return { success: true }
    } catch (err) {
      console.error('Error deleting user:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar usuario'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Cargar usuarios al montar el componente
  useEffect(() => {
    fetchUsers()
  }, [])

  return {
    users,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    getUserById
  }
}