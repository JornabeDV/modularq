"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { AvailableModulesPage } from "@/components/rentals/available-modules-page"
import { AdminOrSupervisorOnly } from "@/components/auth/route-guard"

export default function AvailablePage() {
  return (
    <AdminOrSupervisorOnly>
      <MainLayout>
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <AvailableModulesPage />
        </div>
      </MainLayout>
    </AdminOrSupervisorOnly>
  )
}
