"use client"

import { MainLayout } from '@/components/layout/main-layout'
import { UserManagement } from '@/components/admin/user-management'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AdminUsersPage() {
  const { userProfile, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && userProfile?.role !== 'admin') {
      router.push('/dashboard')
    }
  }, [userProfile, isLoading, router])

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Cargando...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (userProfile?.role !== 'admin') {
    return (
      <MainLayout>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-destructive">Acceso Denegado</h2>
            <p className="text-muted-foreground mt-2">
              No tienes permisos para acceder a esta página
            </p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="p-6">
        <UserManagement />
      </div>
    </MainLayout>
  )
}