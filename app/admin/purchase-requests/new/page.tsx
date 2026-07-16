"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PurchaseRequestForm } from "@/components/purchase-management/purchase-request-form"
import { usePurchaseRequests } from "@/hooks/use-purchase-requests"
import { useToast } from "@/hooks/use-toast"
import { MainLayout } from "@/components/layout/main-layout"
import { AdminOrSupervisorOnly } from "@/components/auth/route-guard"
import type { PurchaseRequestItemInput } from "@/components/purchase-management/PurchaseRequestItemsTable"

export default function NewPurchaseRequestPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { createPurchaseRequest } = usePurchaseRequests()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: {
    status: string
    notes?: string
    items: PurchaseRequestItemInput[]
  }) => {
    setIsSubmitting(true)
    try {
      await createPurchaseRequest({
        status: data.status,
        notes: data.notes,
        items: data.items.map((item) => ({
          material_id: item.material_id,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
        })),
      })
      toast({
        title: "Pedido creado",
        description: "El pedido de materiales se creó correctamente.",
      })
      router.push("/admin/purchase-management?tab=requests")
    } catch (error) {
      toast({
        title: "Error al crear pedido",
        description: error instanceof Error ? error.message : "No se pudo crear el pedido",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    router.push("/admin/purchase-management?tab=requests")
  }

  return (
    <AdminOrSupervisorOnly>
      <MainLayout>
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <PurchaseRequestForm
            onSubmit={handleSubmit}
            onClose={handleClose}
            isEditing={false}
            isLoading={isSubmitting}
          />
        </div>
      </MainLayout>
    </AdminOrSupervisorOnly>
  )
}
