"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PurchaseOrderForm } from "@/components/purchase-orders/PurchaseOrderForm"
import { usePurchaseOrders } from "@/hooks/use-purchase-orders"
import { useToast } from "@/hooks/use-toast"
import { MainLayout } from "@/components/layout/main-layout"
import { AdminOrSupervisorOnly } from "@/components/auth/route-guard"

export default function NewPurchaseOrderPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { createPurchaseOrder } = usePurchaseOrders()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const purchaseRequestId = searchParams.get("purchase_request_id") || undefined

  const handleSubmit = async (data: Parameters<typeof createPurchaseOrder>[0]) => {
    setIsSubmitting(true)
    try {
      await createPurchaseOrder(data)
      toast({
        title: "Orden creada",
        description: "La orden de compra fue creada exitosamente.",
      })
      router.push("/admin/purchase-management?tab=orders")
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear orden de compra",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AdminOrSupervisorOnly>
      <MainLayout>
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <PurchaseOrderForm
            mode="create"
            initialData={{
              id: "",
              order_number: "",
              supplier_id: "",
              purchase_request_id: purchaseRequestId,
              status: "draft",
              items: [],
              subtotal: 0,
              tax_pct: 21,
              tax_amount: 0,
              total: 0,
              created_at: new Date().toISOString(),
            }}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
      </MainLayout>
    </AdminOrSupervisorOnly>
  )
}
