"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { StockManagement } from "@/components/admin/stock-management"
import { AdminOrSupervisorOnly } from "@/components/auth/route-guard"

export default function AdminStockPage() {
  return (
    <AdminOrSupervisorOnly>
      <MainLayout>
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <StockManagement />
        </div>
      </MainLayout>
    </AdminOrSupervisorOnly>
  )
}