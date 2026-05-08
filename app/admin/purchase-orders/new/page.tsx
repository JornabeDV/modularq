"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PurchaseOrderForm } from "@/components/purchase-orders/PurchaseOrderForm"
import { usePurchaseOrders } from "@/hooks/use-purchase-orders"
import { useToast } from "@/hooks/use-toast"
import { MainLayout } from "@/components/layout/main-layout"

export default function NewPurchaseOrderPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { createPurchaseOrder } = usePurchaseOrders()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: Parameters<typeof createPurchaseOrder>[0]) => {
    setIsSubmitting(true)
    try {
      await createPurchaseOrder(data)
      toast({
        title: "Orden creada",
        description: "La orden de compra fue creada exitosamente.",
      })
      router.push("/admin/purchase-orders")
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
    <MainLayout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-5xl mx-auto">
        <PurchaseOrderForm mode="create" onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </div>
    </MainLayout>
  )
}
