"use client"

import { MainLayout } from '@/components/layout/main-layout'
import { UserManagement } from '@/components/admin/user-management'
import { AdminOnly } from '@/components/auth/route-guard'

export default function AdminUsersPage() {
  return (
    <AdminOnly>
      <MainLayout>
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <UserManagement />
        </div>
      </MainLayout>
    </AdminOnly>
  )
}