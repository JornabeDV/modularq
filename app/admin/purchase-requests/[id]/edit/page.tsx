"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { PurchaseRequestForm } from "@/components/purchase-management/purchase-request-form"
import { usePurchaseRequests } from "@/hooks/use-purchase-requests"
import { useToast } from "@/hooks/use-toast"
import { MainLayout } from "@/components/layout/main-layout"
import { AdminOrSupervisorOnly } from "@/components/auth/route-guard"
import { Loader2 } from "lucide-react"
import type { PurchaseRequestItemInput } from "@/components/purchase-management/PurchaseRequestItemsTable"

export default function EditPurchaseRequestPage() {
  const router = useRouter()
  const params = useParams()
  const id = typeof params.id === "string" ? params.id : ""
  const { toast } = useToast()
  const { getPurchaseRequest, updatePurchaseRequest } = usePurchaseRequests()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [initialData, setInitialData] = useState<any>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setLoadError("ID de pedido no válido")
      setIsLoading(false)
      return
    }

    const load = async () => {
      try {
        setIsLoading(true)
        const request = await getPurchaseRequest(id)
        setInitialData(request)
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Error al cargar el pedido")
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [id])

  const handleSubmit = async (data: {
    status: string
    notes?: string
    items: PurchaseRequestItemInput[]
  }) => {
    if (!id) return
    setIsSubmitting(true)
    try {
      await updatePurchaseRequest(id, {
        status: data.status,
        notes: data.notes,
        items: data.items.map((item) => ({
          id: item.id,
          material_id: item.material_id,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
        })),
      })
      toast({
        title: "Pedido actualizado",
        description: "El pedido de materiales se actualizó correctamente.",
      })
      router.push("/admin/purchase-management?tab=requests")
    } catch (error) {
      toast({
        title: "Error al actualizar pedido",
        description: error instanceof Error ? error.message : "No se pudo actualizar el pedido",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    router.push("/admin/purchase-management?tab=requests")
  }

  if (isLoading) {
    return (
      <AdminOrSupervisorOnly>
        <MainLayout>
          <div className="p-4 sm:p-6 flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p>Cargando pedido...</p>
            </div>
          </div>
        </MainLayout>
      </AdminOrSupervisorOnly>
    )
  }

  if (loadError || !initialData) {
    return (
      <AdminOrSupervisorOnly>
        <MainLayout>
          <div className="p-4 sm:p-6 flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-destructive">Error</h2>
              <p className="text-muted-foreground mt-2">
                {loadError || "No se encontró el pedido"}
              </p>
            </div>
          </div>
        </MainLayout>
      </AdminOrSupervisorOnly>
    )
  }

  return (
    <AdminOrSupervisorOnly>
      <MainLayout>
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <PurchaseRequestForm
            onSubmit={handleSubmit}
            onClose={handleClose}
            isEditing={true}
            initialData={initialData}
            isLoading={isSubmitting}
          />
        </div>
      </MainLayout>
    </AdminOrSupervisorOnly>
  )
}
