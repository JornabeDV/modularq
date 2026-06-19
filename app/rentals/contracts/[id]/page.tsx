"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { RentalContractDetail } from "@/components/rentals/rental-contract-detail"
import { AdminOrSupervisorOnly } from "@/components/auth/route-guard"
import { useParams } from "next/navigation"

export default function ContractDetailPage() {
  const params = useParams()
  const id = params.id as string

  return (
    <AdminOrSupervisorOnly>
      <MainLayout>
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <RentalContractDetail contractId={id} />
        </div>
      </MainLayout>
    </AdminOrSupervisorOnly>
  )
}
