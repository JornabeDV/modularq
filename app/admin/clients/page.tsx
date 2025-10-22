"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { ClientManagement } from "@/components/admin/client-management"
import { AdminOnly } from "@/components/auth/route-guard"

export default function AdminClientsPage() {
  return (
    <AdminOnly>
      <MainLayout>
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <ClientManagement />
        </div>
      </MainLayout>
    </AdminOnly>
  )
}