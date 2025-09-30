"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Loader2 } from "lucide-react"

interface RouteGuardProps {
  children: React.ReactNode
  allowedRoles?: string[]
  redirectTo?: string
}

export function RouteGuard({ 
  children, 
  allowedRoles = [], 
  redirectTo 
}: RouteGuardProps) {
  const { user, userProfile, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      // Si no hay usuario, redirigir a login
      if (!user || !userProfile) {
        router.push("/login")
        return
      }

      // Si se especifican roles permitidos, verificar el rol del usuario
      if (allowedRoles.length > 0) {
        const userRole = userProfile.role
        if (!allowedRoles.includes(userRole)) {
          // Redirigir según el rol del usuario
          if (userRole === 'admin') {
            router.push("/dashboard")
          } else if (userRole === 'operario') {
            router.push("/projects")
          } else {
            router.push(redirectTo || "/login")
          }
          return
        }
      }
    }
  }, [user, userProfile, isLoading, allowedRoles, redirectTo, router])

  // Mostrar loader mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Si no hay usuario o el rol no está permitido, no mostrar nada
  if (!user || !userProfile || (allowedRoles.length > 0 && !allowedRoles.includes(userProfile.role))) {
    return null
  }

  return <>{children}</>
}

// Componentes específicos para cada rol
export function AdminOnly({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard allowedRoles={['admin']} redirectTo="/projects">
      {children}
    </RouteGuard>
  )
}

export function OperarioOnly({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard allowedRoles={['operario']} redirectTo="/dashboard">
      {children}
    </RouteGuard>
  )
}
