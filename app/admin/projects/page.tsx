"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { ProjectManagement } from "@/components/admin/project-management"
import { AdminOrSupervisorOnly } from "@/components/auth/route-guard"

export default function AdminProjectsPage() {
  return (
    <AdminOrSupervisorOnly>
      <MainLayout>
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <ProjectManagement />
        </div>
      </MainLayout>
    </AdminOrSupervisorOnly>
  )
}
