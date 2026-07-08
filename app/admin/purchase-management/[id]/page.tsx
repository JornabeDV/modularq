"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { usePurchaseRequests } from "@/hooks/use-purchase-requests"
import { useToast } from "@/hooks/use-toast"
import { MainLayout } from "@/components/layout/main-layout"
import { AdminOrSupervisorOnly } from "@/components/auth/route-guard"
import { PurchaseRequestDetail } from "@/components/purchase-management/purchase-request-detail"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"

export default function PurchaseRequestDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const { toast } = useToast()
  const { getPurchaseRequest } = usePurchaseRequests()

  const [isLoading, setIsLoading] = useState(true)
  const [request, setRequest] = useState<any>(null)

  useEffect(() => {
    if (!id) return
    setIsLoading(true)
    getPurchaseRequest(id)
      .then((data) => setRequest(data))
      .catch((err) => {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Error al cargar el pedido",
          variant: "destructive",
        })
        router.push("/admin/purchase-management")
      })
      .finally(() => setIsLoading(false))
  }, [id])

  if (isLoading) {
    return (
      <AdminOrSupervisorOnly>
        <MainLayout>
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </div>
        </MainLayout>
      </AdminOrSupervisorOnly>
    )
  }

  if (!request) {
    return (
      <AdminOrSupervisorOnly>
        <MainLayout>
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div className="flex items-center justify-center py-24 text-muted-foreground">
              No se encontró el pedido.
            </div>
          </div>
        </MainLayout>
      </AdminOrSupervisorOnly>
    )
  }

  return (
    <AdminOrSupervisorOnly>
      <MainLayout>
        <div className="p-4 sm:p-6 space-y-3">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/admin/purchase-management")}
              className="cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Volver</span>
            </Button>
          </div>
          <PurchaseRequestDetail request={request} />
        </div>
      </MainLayout>
    </AdminOrSupervisorOnly>
  )
}
