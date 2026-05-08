"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { SupplierSelect } from "./SupplierSelect"
import { CreateSupplierDialog } from "./CreateSupplierDialog"
import { PurchaseOrderItemsTable, PurchaseOrderItemInput } from "./PurchaseOrderItemsTable"
import { PurchaseOrderPDFButton } from "./PurchaseOrderPDFButton"
import { Loader2, Save, ArrowLeft } from "lucide-react"

interface PurchaseOrderFormProps {
  mode: "create" | "edit"
  initialData?: {
    id: string
    order_number: string
    supplier_id: string
    status: string
    items: PurchaseOrderItemInput[]
    subtotal: number
    tax_pct: number
    tax_amount: number
    total: number
    payment_terms?: string
    delivery_terms?: string
    delivery_date?: string
    notes?: string
    supplier?: {
      name: string
      contact_name?: string
      email?: string
      phone?: string
      address?: string
      cuit?: string
    }
    created_at: string
  }
  onSubmit: (data: {
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
    items: PurchaseOrderItemInput[]
  }) => Promise<void>
  isSubmitting?: boolean
}

export function PurchaseOrderForm({ mode, initialData, onSubmit, isSubmitting = false }: PurchaseOrderFormProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [supplierId, setSupplierId] = useState(initialData?.supplier_id || "")
  const [status, setStatus] = useState(initialData?.status || "draft")
  const [items, setItems] = useState<PurchaseOrderItemInput[]>(initialData?.items || [])
  const [taxPct, setTaxPct] = useState<number>(initialData?.tax_pct ?? 21)
  const [paymentTerms, setPaymentTerms] = useState(initialData?.payment_terms || "")
  const [deliveryTerms, setDeliveryTerms] = useState(initialData?.delivery_terms || "")
  const [deliveryDate, setDeliveryDate] = useState(initialData?.delivery_date || "")
  const [notes, setNotes] = useState(initialData?.notes || "")

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.total_price || 0), 0)
  }, [items])

  const taxAmount = useMemo(() => {
    return subtotal * (taxPct / 100)
  }, [subtotal, taxPct])

  const total = useMemo(() => {
    return subtotal + taxAmount
  }, [subtotal, taxAmount])

  // Actualizar totales cuando cambian los items o el porcentaje de IVA
  useEffect(() => {
    // Los totales se recalculan automáticamente por los useMemo
  }, [subtotal, taxAmount, total])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!supplierId) {
      toast({ title: "Error", description: "Seleccione un proveedor", variant: "destructive" })
      return
    }

    if (items.length === 0) {
      toast({ title: "Error", description: "Agregue al menos un ítem", variant: "destructive" })
      return
    }

    const emptyDescriptions = items.some((item) => !item.description.trim())
    if (emptyDescriptions) {
      toast({ title: "Error", description: "Todos los ítems deben tener una descripción", variant: "destructive" })
      return
    }

    await onSubmit({
      supplier_id: supplierId,
      status,
      subtotal,
      tax_pct: taxPct,
      tax_amount: taxAmount,
      total,
      payment_terms: paymentTerms || undefined,
      delivery_terms: deliveryTerms || undefined,
      delivery_date: deliveryDate || undefined,
      notes: notes || undefined,
      items,
    })
  }

  const pdfData = initialData
    ? {
        order_number: initialData.order_number,
        status: initialData.status,
        supplier: initialData.supplier || { name: "" },
        items: initialData.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          total_price: item.total_price,
        })),
        subtotal: initialData.subtotal,
        tax_pct: initialData.tax_pct,
        tax_amount: initialData.tax_amount,
        total: initialData.total,
        payment_terms: initialData.payment_terms,
        delivery_terms: initialData.delivery_terms,
        delivery_date: initialData.delivery_date,
        notes: initialData.notes,
        created_at: initialData.created_at,
      }
    : null

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header con acciones */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin/purchase-orders")}
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver
          </Button>
          <h1 className="text-2xl font-bold">
            {mode === "create" ? "Nueva Orden de Compra" : `Orden ${initialData?.order_number}`}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {pdfData && (
            <PurchaseOrderPDFButton purchaseOrder={pdfData} />
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            {mode === "create" ? "Crear Orden" : "Guardar Cambios"}
          </Button>
        </div>
      </div>

      {/* Proveedor */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Proveedor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="supplier">Proveedor *</Label>
              <SupplierSelect
                value={supplierId}
                onChange={setSupplierId}
                placeholder="Seleccionar proveedor..."
              />
            </div>
            <CreateSupplierDialog onCreated={(id) => setSupplierId(id)} />
          </div>
        </CardContent>
      </Card>

      {/* Ítems */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ítems de la orden</CardTitle>
        </CardHeader>
        <CardContent>
          <PurchaseOrderItemsTable items={items} onChange={setItems} />
        </CardContent>
      </Card>

      {/* Totales */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Totales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="tax_pct">IVA (%)</Label>
              <Input
                id="tax_pct"
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={taxPct}
                onChange={(e) => setTaxPct(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="md:col-span-2">
              <div className="flex justify-end gap-8 text-sm">
                <div className="text-right">
                  <p className="text-muted-foreground">Subtotal</p>
                  <p className="font-mono text-lg font-medium">
                    ${subtotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground">IVA ({taxPct}%)</p>
                  <p className="font-mono text-lg font-medium">
                    ${taxAmount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground font-semibold">TOTAL</p>
                  <p className="font-mono text-xl font-bold">
                    ${total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Condiciones */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Condiciones comerciales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="payment_terms">Condiciones de pago</Label>
              <Input
                id="payment_terms"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="Ej: 50% anticipo, 50% contra entrega"
              />
            </div>
            <div>
              <Label htmlFor="delivery_terms">Términos de entrega</Label>
              <Input
                id="delivery_terms"
                value={deliveryTerms}
                onChange={(e) => setDeliveryTerms(e.target.value)}
                placeholder="Ej: Entrega en obra"
              />
            </div>
            <div>
              <Label htmlFor="delivery_date">Fecha estimada de entrega</Label>
              <Input
                id="delivery_date"
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas adicionales..."
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
