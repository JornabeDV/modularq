"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { RentalModuleDetail } from "@/components/rentals/rental-module-detail"
import { AdminOrSupervisorOnly } from "@/components/auth/route-guard"
import { useParams } from "next/navigation"

export default function ModuleDetailPage() {
  const params = useParams()
  const id = params.id as string

  return (
    <AdminOrSupervisorOnly>
      <MainLayout>
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <RentalModuleDetail moduleId={id} />
        </div>
      </MainLayout>
    </AdminOrSupervisorOnly>
  )
}
