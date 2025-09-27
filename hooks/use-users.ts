import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export interface UserProfile {
  id?: string
  email: string
  name: string
  role: 'admin' | 'supervisor' | 'operario'
  department?: string
  skills?: string[]
  password?: string
  total_hours?: number
  efficiency?: number
  created_by?: string
  created_at?: string
  updated_at?: string
}

export interface CreateUserData {
  password: string
  name: string
  role: 'admin' | 'supervisor' | 'operario'
  department?: string
  skills?: string[]
}

export function useUsers() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar usuarios
  const fetchUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  // Crear usuario
  const createUser = async (userData: CreateUserData) => {
    try {
      setLoading(true)
      
      // Generar email único basado en el nombre y timestamp
      // Generar email automáticamente basado en el nombre
      const generateEmail = (name: string) => {
        const cleanName = name.toLowerCase()
          .replace(/[^a-z\s]/g, '') // Solo letras y espacios
          .replace(/\s+/g, '.') // Espacios a puntos
          .substring(0, 15) // Máximo 15 caracteres
        
        const timestamp = Date.now().toString().slice(-6) // Últimos 6 dígitos del timestamp
        return `${cleanName}.${timestamp}@modularq.local`
      }
      
      const generatedEmail = generateEmail(userData.name)
      
      // Crear usuario directamente en la tabla users con timeout
      const createPromise = supabase
        .from('users')
        .insert({
          email: generatedEmail,
          name: userData.name,
          role: userData.role,
          department: userData.department,
          skills: userData.skills || [],
          password: userData.password, // Almacenamos la contraseña temporalmente
          total_hours: 0,
          efficiency: 100
        })
        .select()
        .single()

      // Agregar timeout de 10 segundos
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: La operación tardó demasiado')), 10000)
      )

      const { data: profileData, error: profileError } = await Promise.race([
        createPromise,
        timeoutPromise
      ]) as any

      if (profileError) throw profileError

      // Actualizar lista de usuarios
      await fetchUsers()
      
      return { 
        success: true, 
        user: profileData,
        message: `Usuario ${userData.name} creado exitosamente. Contraseña: ${userData.password}`
      }
    } catch (err) {
      console.error('Error en createUser:', err)
      setError(err instanceof Error ? err.message : 'Error al crear usuario')
      return { success: false, error: err instanceof Error ? err.message : 'Error desconocido' }
    } finally {
      setLoading(false)
    }
  }

  // Actualizar usuario
  const updateUser = async (userId: string, updates: Partial<UserProfile>) => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error

      // Actualizar lista de usuarios
      await fetchUsers()
      
      return { success: true, user: data }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar usuario')
      return { success: false, error: err instanceof Error ? err.message : 'Error desconocido' }
    } finally {
      setLoading(false)
    }
  }

  // Eliminar usuario
  const deleteUser = async (userId: string, currentUserId?: string) => {
    try {
      setLoading(true)
      
      // Verificar si el usuario está intentando eliminarse a sí mismo
      if (currentUserId && userId === currentUserId) {
        throw new Error('No puedes eliminarte a ti mismo')
      }
      
      // Eliminar directamente de nuestra tabla users
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (error) {
        console.error('Error eliminando usuario:', error)
        throw error
      }

      // Actualizar lista de usuarios
      await fetchUsers()
      
      return { success: true }
    } catch (err) {
      console.error('Error en deleteUser:', err)
      setError(err instanceof Error ? err.message : 'Error al eliminar usuario')
      return { success: false, error: err instanceof Error ? err.message : 'Error desconocido' }
    } finally {
      setLoading(false)
    }
  }

  // Resetear contraseña
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) throw error
      return { success: true }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al resetear contraseña')
      return { success: false, error: err instanceof Error ? err.message : 'Error desconocido' }
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
    resetPassword
  }
}