"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { RentalModuleHistory } from "@/components/rentals/rental-module-history"
import { AdminOrSupervisorOnly } from "@/components/auth/route-guard"
import { useParams } from "next/navigation"

export default function ModuleHistoryPage() {
  const params = useParams()
  const id = params.id as string

  return (
    <AdminOrSupervisorOnly>
      <MainLayout>
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <RentalModuleHistory moduleId={id} />
        </div>
      </MainLayout>
    </AdminOrSupervisorOnly>
  )
}
