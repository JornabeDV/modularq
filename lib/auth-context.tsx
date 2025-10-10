"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"

interface AuthContextType {
  user: User | null
  userProfile: any | null
  login: (email: string, password: string) => Promise<boolean>
  loginWithName: (name: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Crea un objeto User simulado compatible con Supabase Auth
 * para mantener compatibilidad con el sistema híbrido de autenticación
 */
const createMockUser = (userData: any): User => {
  return {
    id: userData.id,
    email: userData.email,
    user_metadata: {
      name: userData.name,
      role: userData.role,
      total_hours: userData.total_hours || 0,
      efficiency: userData.efficiency || 0
    },
    app_metadata: {
      provider: 'custom',
      providers: ['custom']
    },
    aud: 'authenticated',
    created_at: userData.created_at || new Date().toISOString(),
    updated_at: userData.updated_at || new Date().toISOString(),
    email_confirmed_at: userData.created_at || new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    role: 'authenticated'
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        await fetchUserProfile(session.user.id, session.user)
      }
      setIsLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        if (session?.user) {
          setUser(session.user)
          await fetchUserProfile(session.user.id, session.user)
        } else {
          setUser(null)
          setUserProfile(null)
        }
        setIsLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string, userData?: any) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        // Si no existe el perfil, crear uno básico
        if (error.code === 'PGRST116') {
          const currentUser = userData || user
          const { data: newProfile, error: createError } = await supabase
            .from('users')
            .insert({
              id: userId,
              email: currentUser?.email || '',
              name: currentUser?.user_metadata?.name || currentUser?.email || 'Usuario',
              role: currentUser?.user_metadata?.role || 'operario'
            })
            .select()
            .single()

          if (createError) {
            console.error('Error creating user profile:', createError)
            return
          }

          setUserProfile(newProfile)
        }
        return
      }

      setUserProfile(data)
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Login error:', error)
        setIsLoading(false)
        return false
      }

      if (data.user) {
        await fetchUserProfile(data.user.id, data.user)
        setIsLoading(false)
        return true
      }

      setIsLoading(false)
      return false
    } catch (error) {
      console.error('Login error:', error)
      setIsLoading(false)
      return false
    }
  }

  const loginWithName = async (name: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      
      // Validar entrada
      if (!name?.trim() || !password?.trim()) {
        console.error('Login error: Nombre y contraseña son requeridos')
        setIsLoading(false)
        return false
      }

      // Usar Supabase para autenticación
      const { data: allUsers, error: fetchError } = await supabase
        .from('users')
        .select('*')

      if (fetchError) {
        console.error('Error fetching users:', fetchError)
        setIsLoading(false)
        return false
      }

      // Buscar usuario cuyo primer nombre coincida (case-insensitive)
      const userData = allUsers?.find(user => {
        if (!user.name) return false
        
        const firstName = user.name.split(' ')[0]?.toLowerCase().trim()
        const inputName = name.toLowerCase().trim()
        
        // Si el usuario no tiene contraseña, no permitir login
        if (!user.password) return false
        
        return firstName === inputName && user.password === password
      })

      if (!userData) {
        console.error('Login error: Usuario no encontrado o credenciales incorrectas')
        setIsLoading(false)
        return false
      }
      
      // Crear un objeto de usuario simulado compatible con Supabase User
      const mockUser = createMockUser(userData)

      setUser(mockUser)
      setUserProfile(userData)
      setIsLoading(false)
      return true
    } catch (error) {
      console.error('Login error:', error)
      setIsLoading(false)
      return false
    }
  }

  const logout = async () => {
    try {
      // Limpiar estado local primero
      setUser(null)
      setUserProfile(null)
      
      // Intentar cerrar sesión en Supabase Auth (puede fallar si es login personalizado)
      try {
        await supabase.auth.signOut()
      } catch (authError) {
        // Si falla, no es crítico ya que limpiamos el estado local
        console.log('Auth signOut not applicable for custom login')
      }
    } catch (error) {
      console.error('Logout error:', error)
      // Asegurar que el estado se limpie incluso si hay error
      setUser(null)
      setUserProfile(null)
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      userProfile, 
      login, 
      loginWithName,
      logout, 
      isLoading 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}