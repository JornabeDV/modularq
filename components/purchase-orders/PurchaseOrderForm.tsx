"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { usePurchaseOrders } from "@/hooks/use-purchase-orders"
import { SupplierSelect } from "./SupplierSelect"
import { CreateSupplierDialog } from "./CreateSupplierDialog"
import { PurchaseOrderItemsTable, PurchaseOrderItemInput } from "./PurchaseOrderItemsTable"
import { PurchaseOrderPDFButton } from "./PurchaseOrderPDFButton"
import { PurchaseRequestSelect } from "@/components/purchase-management/PurchaseRequestSelect"
import { PurchaseOrderReceiptsPanel } from "@/components/purchase-management/PurchaseOrderReceiptsPanel"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Save, ArrowLeft, Package, CalendarIcon } from "lucide-react"

interface PurchaseOrderFormProps {
  mode: "create" | "edit"
  initialData?: {
    id: string
    order_number: string
    supplier_id: string
    purchase_request_id?: string
    status: string
    items: (PurchaseOrderItemInput & {
      material?: {
        id: string
        code: string
        name: string
        unit: string
      } | null
    })[]
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
    purchase_request?: {
      id: string
      request_number: string
    } | null
    receipts?: Array<any>
    created_at: string
  }
  onSubmit: (data: {
    supplier_id: string
    purchase_request_id?: string
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
  onOrderChange?: (order: any) => void
}

export function PurchaseOrderForm({ mode, initialData, onSubmit, isSubmitting = false, onOrderChange }: PurchaseOrderFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { getPurchaseOrder } = usePurchaseOrders()

  const [supplierId, setSupplierId] = useState(initialData?.supplier_id || "")
  const [purchaseRequestId, setPurchaseRequestId] = useState(initialData?.purchase_request_id || "")
  const [status, setStatus] = useState(initialData?.status || "draft")
  const [items, setItems] = useState<PurchaseOrderItemInput[]>(initialData?.items || [])

  useEffect(() => {
    if (initialData?.status) {
      setStatus(initialData.status)
    }
  }, [initialData?.status])
  const [paymentTerms, setPaymentTerms] = useState(initialData?.payment_terms || "")
  const [deliveryTerms, setDeliveryTerms] = useState(initialData?.delivery_terms || "")
  const [deliveryDate, setDeliveryDate] = useState(initialData?.delivery_date || "")
  const [deliveryDateOpen, setDeliveryDateOpen] = useState(false)
  const [notes, setNotes] = useState(initialData?.notes || "")

  const [taxPct, setTaxPct] = useState(initialData?.tax_pct ?? 21)

  useEffect(() => {
    if (initialData?.tax_pct !== undefined) {
      setTaxPct(initialData.tax_pct)
    }
  }, [initialData?.tax_pct])

  const currentYear = new Date().getFullYear()
  const calendarStartMonth = new Date(currentYear, 0, 1)
  const calendarEndMonth = new Date(currentYear + 10, 11, 31)

  const formatDateLabel = (dateString: string) => {
    if (!dateString) return null
    return new Date(dateString + "T00:00:00").toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.total_price || 0), 0)
  }, [items])

  const taxAmount = useMemo(() => {
    return subtotal * (taxPct / 100)
  }, [subtotal, taxPct])

  const total = useMemo(() => {
    return subtotal + taxAmount
  }, [subtotal, taxAmount])

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
      purchase_request_id: purchaseRequestId || undefined,
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

    // Refrescar datos si estamos editando para obtener los nuevos IDs de ítems
    // (el backend elimina y recrea los ítems al actualizar)
    if (mode === "edit" && initialData?.id) {
      const refreshedOrder = await getPurchaseOrder(initialData.id)
      setItems(
        refreshedOrder.items.map((item) => ({
          id: item.id,
          material_id: item.material_id,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          total_price: item.total_price,
        }))
      )
    }
  }

  const pdfData = initialData
    ? {
        order_number: initialData.order_number,
        status: initialData.status,
        supplier: initialData.supplier || { name: "" },
        items: items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          total_price: item.total_price,
        })),
        subtotal,
        tax_pct: taxPct,
        tax_amount: taxAmount,
        total,
        payment_terms: paymentTerms || initialData.payment_terms,
        delivery_terms: deliveryTerms || initialData.delivery_terms,
        delivery_date: deliveryDate || initialData.delivery_date,
        notes: notes || initialData.notes,
        created_at: initialData.created_at,
      }
    : null

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start gap-3">
        <Button
          type="button"
          variant="outline"
          className="cursor-pointer"
          size="sm"
          onClick={() => router.push("/admin/purchase-management?tab=orders")}
        >
          <ArrowLeft className="h-4 w-4" /> Volver
        </Button>
        <h1 className="text-xl sm:text-2xl font-bold">
          {mode === "create" ? "Nueva Orden de Compra" : `Orden ${initialData?.order_number}`}
        </h1>
      </div>

      {/* Proveedor y pedido */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Proveedor y pedido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <Label htmlFor="supplier" className="mb-2">Proveedor *</Label>
              <div className="flex flex-col sm:flex-row sm:items-end gap-2">
                <div className="flex-1">
                  <SupplierSelect
                    value={supplierId}
                    onChange={setSupplierId}
                    placeholder="Seleccionar proveedor..."
                  />
                </div>
                <CreateSupplierDialog onCreated={(id) => setSupplierId(id)} />
              </div>
            </div>
            <div>
              <Label htmlFor="purchase_request" className="mb-2">Pedido de materiales (opcional)</Label>
              <PurchaseRequestSelect
                value={purchaseRequestId}
                onChange={setPurchaseRequestId}
                placeholder="Seleccionar pedido..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ítems */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ítems de la orden</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <PurchaseOrderItemsTable items={items} onChange={setItems} />
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">IVA</span>
              <div className="flex rounded-md border overflow-hidden">
                <button
                  type="button"
                  onClick={() => setTaxPct(0)}
                  className={`px-2 py-1 text-xs font-medium transition-colors ${
                    taxPct === 0
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  0%
                </button>
                <button
                  type="button"
                  onClick={() => setTaxPct(10.5)}
                  className={`px-2 py-1 text-xs font-medium transition-colors border-l ${
                    taxPct === 10.5
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  10.5%
                </button>
                <button
                  type="button"
                  onClick={() => setTaxPct(21)}
                  className={`px-2 py-1 text-xs font-medium transition-colors border-l ${
                    taxPct === 21
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  21%
                </button>
              </div>
            </div>
            <div className="text-right space-y-1">
              <div className="flex justify-end gap-4 text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums font-medium">
                  ${subtotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-end gap-4 text-sm">
                <span className="text-muted-foreground">IVA ({taxPct}%)</span>
                <span className="tabular-nums font-medium">
                  ${taxAmount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-end gap-4 pt-2 border-t">
                <span className="text-muted-foreground text-sm">Total</span>
                <p className="tabular-nums text-xl font-bold">
                  ${total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estado */}
      <Card>
        <CardHeader >
          <CardTitle className="text-base">Estado de la orden</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status" className="mb-2">Estado</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Borrador</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="approved">Aprobada</SelectItem>
                  <SelectItem value="partial_received">Recibida parcial</SelectItem>
                  <SelectItem value="received">Recibida</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
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
              <Label htmlFor="payment_terms" className="mb-2">Condiciones de pago</Label>
              <Input
                id="payment_terms"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="Ej: 50% anticipo, 50% contra entrega"
              />
            </div>
            <div>
              <Label htmlFor="delivery_terms" className="mb-2">Términos de entrega</Label>
              <Input
                id="delivery_terms"
                value={deliveryTerms}
                onChange={(e) => setDeliveryTerms(e.target.value)}
                placeholder="Ej: Entrega en obra"
              />
            </div>
            <div>
              <Label className="mb-2">Fecha estimada de entrega</Label>
              <Popover open={deliveryDateOpen} onOpenChange={setDeliveryDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !deliveryDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatDateLabel(deliveryDate) || "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    captionLayout="dropdown-years"
                    startMonth={calendarStartMonth}
                    endMonth={calendarEndMonth}
                    selected={deliveryDate ? new Date(deliveryDate + "T00:00:00") : undefined}
                    onSelect={(date) => {
                      if (date) {
                        setDeliveryDate(date.toISOString().split("T")[0])
                        setDeliveryDateOpen(false)
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="notes" className="mb-2">Notas</Label>
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

      {/* Recepciones (solo edición) */}
      {mode === "edit" && initialData && (
        <PurchaseOrderReceiptsPanel orderId={initialData.id} onOrderChange={onOrderChange} />
      )}

      {/* Acciones al final del formulario */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-4 border-t">
        {mode === "edit" && pdfData && (
          <PurchaseOrderPDFButton purchaseOrder={pdfData} className="w-full sm:w-auto" />
        )}
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto cursor-pointer">
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <Save className="h-4 w-4 mr-1" />
          )}
          {mode === "create" ? "Crear Orden" : "Guardar Cambios"}
        </Button>
      </div>
    </form>
  )
}
