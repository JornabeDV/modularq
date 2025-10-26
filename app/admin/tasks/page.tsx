"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { TaskManagement } from "@/components/admin/task-management"
import { AdminOrSupervisorOnly } from "@/components/auth/route-guard"

export default function AdminTasksPage() {
  return (
    <AdminOrSupervisorOnly>
      <MainLayout>
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <TaskManagement />
        </div>
      </MainLayout>
    </AdminOrSupervisorOnly>
  )
}