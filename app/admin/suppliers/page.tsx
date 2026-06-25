"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { SupplierManagement } from "@/components/admin/suppliers/supplier-management"
import { AdminOrSupervisorOnly } from "@/components/auth/route-guard"

export default function AdminSuppliersPage() {
  return (
    <AdminOrSupervisorOnly>
      <MainLayout>
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <SupplierManagement />
        </div>
      </MainLayout>
    </AdminOrSupervisorOnly>
  )
}
