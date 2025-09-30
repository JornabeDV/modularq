"use client"

import { MainLayout } from '@/components/layout/main-layout'
import { UserManagement } from '@/components/admin/user-management'
import { AdminOnly } from '@/components/auth/route-guard'

export default function AdminUsersPage() {
  return (
    <AdminOnly>
      <MainLayout>
        <div className="p-6">
          <UserManagement />
        </div>
      </MainLayout>
    </AdminOnly>
  )
}