"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { PurchaseManagementTabs } from "@/components/purchase-management/PurchaseManagementTabs"
import { AdminOrSupervisorOnly } from "@/components/auth/route-guard"

export default function PurchaseManagementPage() {
  return (
    <AdminOrSupervisorOnly>
      <MainLayout>
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <PurchaseManagementTabs />
        </div>
      </MainLayout>
    </AdminOrSupervisorOnly>
  )
}
