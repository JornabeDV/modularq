"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { RentalContractsPage } from "@/components/rentals/rental-contracts-page"
import { AdminOrSupervisorOnly } from "@/components/auth/route-guard"

export default function ContractsPage() {
  return (
    <AdminOrSupervisorOnly>
      <MainLayout>
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <RentalContractsPage />
        </div>
      </MainLayout>
    </AdminOrSupervisorOnly>
  )
}
