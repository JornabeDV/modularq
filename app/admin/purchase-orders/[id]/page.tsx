"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { PurchaseOrderForm } from "@/components/purchase-orders/PurchaseOrderForm"
import { usePurchaseOrders } from "@/hooks/use-purchase-orders"
import { useToast } from "@/hooks/use-toast"
import { MainLayout } from "@/components/layout/main-layout"
import { Loader2 } from "lucide-react"

export default function EditPurchaseOrderPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const { toast } = useToast()
  const { getPurchaseOrder, updatePurchaseOrder } = usePurchaseOrders()

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [order, setOrder] = useState<any>(null)

  useEffect(() => {
    if (!id) return
    setIsLoading(true)
    getPurchaseOrder(id)
      .then((data) => setOrder(data))
      .catch((err) => {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Error al cargar orden",
          variant: "destructive",
        })
        router.push("/admin/purchase-orders")
      })
      .finally(() => setIsLoading(false))
  }, [id])

  const handleSubmit = async (data: {
    supplier_id: string
    status: string
    subtotal: number
    tax_pct: number
    tax_amount: number
    total: number
    payment_terms?: string
    delivery_terms?: string
    delivery_date?: string
    notes?: string
    items: Array<{
      id?: string
      material_id?: string
      description: string
      quantity: number
      unit: string
      unit_price: number
      total_price: number
    }>
  }) => {
    setIsSubmitting(true)
    try {
      await updatePurchaseOrder(id, data)
      toast({
        title: "Orden actualizada",
        description: "La orden de compra fue actualizada exitosamente.",
      })
      router.push("/admin/purchase-orders")
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar orden de compra",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!order) {
    return (
      <MainLayout>
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="flex items-center justify-center py-24 text-muted-foreground">
            No se encontró la orden de compra.
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-5xl mx-auto">
        <PurchaseOrderForm
          mode="edit"
          initialData={{
            id: order.id,
            order_number: order.order_number,
            supplier_id: order.supplier_id,
            status: order.status,
            items: order.items.map((item: any) => ({
              id: item.id,
              material_id: item.material_id || undefined,
              description: item.description,
              quantity: item.quantity,
              unit: item.unit,
              unit_price: item.unit_price,
              total_price: item.total_price,
            })),
            subtotal: order.subtotal,
            tax_pct: order.tax_pct,
            tax_amount: order.tax_amount,
            total: order.total,
            payment_terms: order.payment_terms || undefined,
            delivery_terms: order.delivery_terms || undefined,
            delivery_date: order.delivery_date || undefined,
            notes: order.notes || undefined,
            supplier: order.supplier,
            created_at: order.created_at,
          }}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </MainLayout>
  )
}
