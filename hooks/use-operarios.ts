"use client"

import { useMemo } from 'react'
import { useUsersPrisma } from '@/hooks/use-users-prisma'
import { PrismaTypedService } from '@/lib/prisma-typed-service'
import type { User } from '@/lib/prisma-typed-service'

export interface Operario extends User {
  currentTasks: string[]
}

export function useOperarios() {
  const {
    users,
    loading,
    error,
    fetchUsers,
  } = useUsersPrisma()

  const operarios = useMemo<Operario[]>(() => {
    return users
      .filter(
        user =>
          user.role === 'operario' ||
          user.role === 'subcontratista'
      )
      .map(user => ({
        ...user,
        currentTasks: []
      }))
  }, [users])

  const getOperarioStats = async (userId: string) => {
    try {
      const tasks = await PrismaTypedService.getTasksByUser(userId)

      const total = tasks.length
      const completed = tasks.filter(t => t.status === 'completed').length
      const inProgress = tasks.filter(t => t.status === 'in_progress').length
      const pending = tasks.filter(t => t.status === 'pending').length

      return { total, completed, inProgress, pending }
    } catch (err) {
      console.error('Error getting operario stats:', err)
      return { total: 0, completed: 0, inProgress: 0, pending: 0 }
    }
  }

  return {
    operarios,
    loading,
    error,
    fetchOperarios: fetchUsers,
    getOperarioStats,
  }
}
