"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { RentalModulesPage } from "@/components/rentals/rental-modules-page"
import { AdminOrSupervisorOnly } from "@/components/auth/route-guard"

export default function ModulesPage() {
  return (
    <AdminOrSupervisorOnly>
      <MainLayout>
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <RentalModulesPage />
        </div>
      </MainLayout>
    </AdminOrSupervisorOnly>
  )
}
