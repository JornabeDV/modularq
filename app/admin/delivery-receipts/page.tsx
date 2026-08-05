"use client"

import { Loader2 } from "lucide-react"
import { MainLayout } from "@/components/layout/main-layout"
import { useAuth } from "@/lib/auth-context"
import { useDeliveryReceipts } from "@/hooks/use-delivery-receipts"
import { DeliveryReceiptTable } from "@/components/delivery-receipts/delivery-receipt-table"
import { useToast } from "@/hooks/use-toast"

export default function DeliveryReceiptsPage() {
  const { userProfile, isLoading: authLoading } = useAuth()
  const { receipts, loading, reload, deleteReceipt, issueReceipt, duplicateReceipt } =
    useDeliveryReceipts()
  const { toast } = useToast()

  if (authLoading || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteReceipt(id, userProfile.id, userProfile.role)
      toast({ title: "Remito eliminado" })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo eliminar",
        variant: "destructive",
      })
    }
  }

  const handleIssue = async (id: string) => {
    try {
      await issueReceipt(id)
      toast({ title: "Remito emitido" })
    } catch {
      toast({
        title: "Error",
        description: "No se pudo emitir el remito",
        variant: "destructive",
      })
    }
  }

  const handleDuplicate = async (id: string) => {
    try {
      const newId = await duplicateReceipt(id, userProfile.id)
      toast({ title: "Remito duplicado" })
      return newId
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo duplicar",
        variant: "destructive",
      })
      throw error
    }
  }

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Remitos de Entrega</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Documentos de entrega de materiales y módulos sin valoración de precios.
          </p>
        </div>

        <DeliveryReceiptTable
          receipts={receipts}
          loading={loading}
          role={userProfile.role}
          userId={userProfile.id}
          onIssue={handleIssue}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
        />
      </div>
    </MainLayout>
  )
}
