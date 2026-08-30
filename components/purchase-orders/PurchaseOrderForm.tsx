"use client"

import { useState, useMemo, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { usePurchaseOrders } from "@/hooks/use-purchase-orders"
import { usePurchaseRequests } from "@/hooks/use-purchase-requests"
import { getExchangeRate, formatCurrencyPair, type ExchangeRate } from "@/lib/exchange-rate"
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
import { Checkbox } from "@/components/ui/checkbox"
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
        unit_price?: number
        currency?: 'ARS' | 'USD'
      } | null
      tax_pct?: number
    })[]
    subtotal: number
    tax_pct: number
    tax_amount: number
    iibb_lh_pct: number
    iibb_lh_amount: number
    total: number
    currency?: 'ARS' | 'USD'
    total_ars?: number | null
    exchange_rate?: number | null
    payment_terms?: string
    delivery_terms?: string
    delivery_date?: string
    order_date?: string
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
    iibb_lh_pct: number
    iibb_lh_amount: number
    total: number
    currency?: 'ARS' | 'USD'
    total_ars?: number | null
    exchange_rate?: number | null
    payment_terms?: string
    delivery_terms?: string
    delivery_date?: string
    order_date?: string
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
  const { getPurchaseRequest } = usePurchaseRequests()

  const [supplierId, setSupplierId] = useState(initialData?.supplier_id || "")
  const [purchaseRequestId, setPurchaseRequestId] = useState(initialData?.purchase_request_id || "")
  const [status, setStatus] = useState(initialData?.status || "draft")
  const [items, setItems] = useState<PurchaseOrderItemInput[]>(
    (initialData?.items || []).map((item) => ({
      ...item,
      tax_pct: item.tax_pct ?? 21,
    }))
  )
  const [isLoadingRequestItems, setIsLoadingRequestItems] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null)

  const prefilledRequestIdRef = useRef<string | undefined>(undefined)
  const loadingRequestIdRef = useRef<string | null>(null)
  const itemsRef = useRef<PurchaseOrderItemInput[]>(items)
  const isConfirmOpenRef = useRef(false)
  const confirmedChangeRef = useRef(false)
  itemsRef.current = items

  useEffect(() => {
    if (initialData?.status) {
      setStatus(initialData.status)
    }
  }, [initialData?.status])
  const normalizeDateString = (value?: string | null): string => {
    if (!value) return ""
    const date = new Date(value)
    if (isNaN(date.getTime())) return ""
    return date.toISOString().split("T")[0]
  }

  const [paymentTerms, setPaymentTerms] = useState(initialData?.payment_terms || "")
  const [deliveryTerms, setDeliveryTerms] = useState(initialData?.delivery_terms || "")
  const [deliveryDate, setDeliveryDate] = useState(normalizeDateString(initialData?.delivery_date))
  const [deliveryDateOpen, setDeliveryDateOpen] = useState(false)
  const [orderDate, setOrderDate] = useState(normalizeDateString(initialData?.order_date))
  const [orderDateOpen, setOrderDateOpen] = useState(false)
  const [notes, setNotes] = useState(initialData?.notes || "")

  const [taxPct, setTaxPct] = useState(initialData?.tax_pct ?? 21)

  const handleGeneralTaxPctChange = (newPct: number) => {
    setTaxPct(newPct)
    setItems(prev => prev.map(item => ({ ...item, tax_pct: newPct })))
  }

  useEffect(() => {
    if (initialData?.tax_pct !== undefined) {
      setTaxPct(initialData.tax_pct)
    }
  }, [initialData?.tax_pct])

  const [currency, setCurrency] = useState<'ARS' | 'USD'>(initialData?.currency || "ARS")
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null)

  useEffect(() => {
    if (initialData?.currency) {
      setCurrency(initialData.currency as 'ARS' | 'USD')
    }
  }, [initialData?.currency])

  useEffect(() => {
    getExchangeRate().then(setExchangeRate).catch(() => {})
  }, [])

  const defaultIibbLhPct = 2
  const [iibbLhPct, setIibbLhPct] = useState(initialData?.iibb_lh_pct ?? 0)
  const [iibbLhInput, setIibbLhInput] = useState(String(initialData?.iibb_lh_pct ?? defaultIibbLhPct))
  const [includeIibbLh, setIncludeIibbLh] = useState(initialData?.iibb_lh_pct ? initialData.iibb_lh_pct > 0 : false)

  useEffect(() => {
    if (initialData?.iibb_lh_pct !== undefined) {
      setIibbLhPct(initialData.iibb_lh_pct)
      setIibbLhInput(String(initialData.iibb_lh_pct))
      setIncludeIibbLh(initialData.iibb_lh_pct > 0)
    }
  }, [initialData?.iibb_lh_pct])

  const loadItemsFromRequest = useCallback(async (requestId: string) => {
    if (loadingRequestIdRef.current === requestId) return
    loadingRequestIdRef.current = requestId
    setIsLoadingRequestItems(true)
    try {
      const request = await getPurchaseRequest(requestId)
      if (!request.items || request.items.length === 0) {
        toast({
          title: "Pedido vacío",
          description: "El pedido seleccionado no tiene ítems para cargar.",
          variant: "destructive",
        })
        return
      }
      const mappedItems = request.items.map((item) => {
        const unitPrice = item.material?.unit_price ?? 0
        return {
          material_id: item.material_id,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: unitPrice,
          total_price: item.quantity * unitPrice,
          tax_pct: 21,
        }
      })
      const firstCurrency = request.items.find((item) => item.material?.currency)?.material?.currency as 'ARS' | 'USD' | undefined
      if (firstCurrency) {
        setCurrency(firstCurrency)
      }
      setItems(mappedItems)
      toast({
        title: "Ítems cargados",
        description: `Se precargaron ${mappedItems.length} ítems del pedido ${request.request_number}.`,
      })
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No se pudieron cargar los ítems del pedido.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingRequestItems(false)
      loadingRequestIdRef.current = null
    }
  }, [getPurchaseRequest, toast])

  const handleConfirmRequestChange = () => {
    if (!pendingRequestId) return
    confirmedChangeRef.current = true
    isConfirmOpenRef.current = false
    setIsConfirmOpen(false)
    prefilledRequestIdRef.current = pendingRequestId
    setPurchaseRequestId(pendingRequestId)
    loadItemsFromRequest(pendingRequestId)
    setPendingRequestId(null)
  }

  const handleCancelRequestChange = () => {
    confirmedChangeRef.current = false
    isConfirmOpenRef.current = false
    setIsConfirmOpen(false)
    setPurchaseRequestId(prefilledRequestIdRef.current || "")
    setPendingRequestId(null)
  }

  // Revertir el pedido seleccionado si el modal se cierra sin confirmar/cancelar explícitamente
  useEffect(() => {
    if (isConfirmOpen) return
    if (confirmedChangeRef.current) {
      confirmedChangeRef.current = false
      return
    }
    if (pendingRequestId) {
      setPurchaseRequestId(prefilledRequestIdRef.current || "")
      setPendingRequestId(null)
      isConfirmOpenRef.current = false
    }
  }, [isConfirmOpen, pendingRequestId])

  // Precargar ítems cuando se llega con un purchase_request_id inicial
  useEffect(() => {
    if (mode !== "create") return
    const initialRequestId = initialData?.purchase_request_id
    if (!initialRequestId) return
    if (prefilledRequestIdRef.current === initialRequestId) return
    if (itemsRef.current.length > 0) return
    prefilledRequestIdRef.current = initialRequestId
    loadItemsFromRequest(initialRequestId)
  }, [mode, initialData?.purchase_request_id, loadItemsFromRequest])

  // Precargar ítems cuando el usuario cambia el pedido seleccionado
  useEffect(() => {
    if (mode !== "create") return
    if (!purchaseRequestId) return
    if (purchaseRequestId === prefilledRequestIdRef.current) return
    if (isConfirmOpenRef.current) return

    if (itemsRef.current.length === 0) {
      prefilledRequestIdRef.current = purchaseRequestId
      loadItemsFromRequest(purchaseRequestId)
    } else {
      isConfirmOpenRef.current = true
      setPendingRequestId(purchaseRequestId)
      setIsConfirmOpen(true)
    }
  }, [mode, purchaseRequestId, loadItemsFromRequest])

  const currentYear = new Date().getFullYear()
  const calendarStartMonth = new Date(currentYear, 0, 1)
  const calendarEndMonth = new Date(currentYear + 10, 11, 31)

  const formatDateLabel = (dateString: string) => {
    if (!dateString) return null
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return null
    return new Intl.DateTimeFormat("es-AR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(date)
  }

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.total_price || 0), 0)
  }, [items])

  const taxBreakdown = useMemo(() => {
    const map = new Map<number, number>()
    for (const item of items) {
      const pct = item.tax_pct ?? taxPct
      map.set(pct, (map.get(pct) || 0) + (item.total_price || 0))
    }
    const entries = Array.from(map.entries())
      .map(([pct, base]) => ({ pct, base, amount: base * (pct / 100) }))
      .sort((a, b) => b.pct - a.pct)
    const total = entries.reduce((sum, entry) => sum + entry.amount, 0)
    return { entries, total }
  }, [items, taxPct])

  const taxAmount = useMemo(() => {
    return taxBreakdown.entries.reduce((sum, entry) => sum + entry.amount, 0)
  }, [taxBreakdown])

  const effectiveIibbLhPct = includeIibbLh ? iibbLhPct : 0
  const iibbLhAmount = useMemo(() => {
    return subtotal * (effectiveIibbLhPct / 100)
  }, [subtotal, effectiveIibbLhPct])

  const total = useMemo(() => {
    return subtotal + taxAmount + iibbLhAmount
  }, [subtotal, taxAmount, iibbLhAmount])

  const totalARS = useMemo(() => {
    if (currency === 'ARS') return total
    const rate = exchangeRate?.venta ?? 0
    return rate > 0 ? total * rate : null
  }, [total, currency, exchangeRate])

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
      iibb_lh_pct: effectiveIibbLhPct,
      iibb_lh_amount: iibbLhAmount,
      total,
      currency,
      total_ars: totalARS,
      exchange_rate: exchangeRate?.venta ?? null,
      payment_terms: paymentTerms || undefined,
      delivery_terms: deliveryTerms || undefined,
      delivery_date: deliveryDate || undefined,
      order_date: orderDate || undefined,
      notes: notes || undefined,
      items: items.map(item => ({ ...item, tax_pct: item.tax_pct ?? taxPct })),
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
          tax_pct: item.tax_pct ?? 21,
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
          tax_pct: item.tax_pct ?? 21,
        })),
        subtotal,
        tax_pct: taxPct,
        tax_amount: taxAmount,
        iibb_lh_pct: effectiveIibbLhPct,
        iibb_lh_amount: iibbLhAmount,
        total,
        currency,
        total_ars: totalARS,
        exchange_rate: exchangeRate?.venta ?? null,
        payment_terms: paymentTerms || initialData.payment_terms,
        delivery_terms: deliveryTerms || initialData.delivery_terms,
        delivery_date: deliveryDate || initialData.delivery_date,
        order_date: orderDate || initialData.order_date,
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
          <div className="grid grid-cols-1 md:grid-cols-1 gap-2">
            <div>
              <Label className="mb-2">Fecha de orden (opcional)</Label>
              <Popover open={orderDateOpen} onOpenChange={setOrderDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !orderDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatDateLabel(orderDate) || "Fecha actual por defecto"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    captionLayout="dropdown-years"
                    startMonth={calendarStartMonth}
                    endMonth={calendarEndMonth}
                    selected={orderDate ? new Date(orderDate + "T00:00:00") : undefined}
                    onSelect={(date) => {
                      if (date) {
                        setOrderDate(date.toISOString().split("T")[0])
                        setOrderDateOpen(false)
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
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
                disabled={isLoadingRequestItems || isSubmitting}
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
          <PurchaseOrderItemsTable items={items} onChange={setItems} currency={currency} />
          <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-4 pt-4 border-t">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Moneda</span>
                <div className="flex rounded-md border overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setCurrency('ARS')}
                    className={`px-2 py-1 text-xs font-medium transition-colors ${
                      currency === 'ARS'
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    ARS
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrency('USD')}
                    className={`px-2 py-1 text-xs font-medium transition-colors border-l ${
                      currency === 'USD'
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    USD
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">IVA</span>
                <div className="flex rounded-md border overflow-hidden">
                  <button
                    type="button"
                    onClick={() => handleGeneralTaxPctChange(0)}
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
                    onClick={() => handleGeneralTaxPctChange(10.5)}
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
                    onClick={() => handleGeneralTaxPctChange(21)}
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
              <div className="flex items-center gap-3">
                <Checkbox
                  id="include-iibb-lh"
                  checked={includeIibbLh}
                  onCheckedChange={(checked) => {
                    const enabled = checked === true
                    setIncludeIibbLh(enabled)
                    if (enabled && iibbLhPct === 0) {
                      const next = defaultIibbLhPct
                      setIibbLhPct(next)
                      setIibbLhInput(String(next))
                    }
                  }}
                />
                <Label htmlFor="include-iibb-lh" className="text-sm text-muted-foreground cursor-pointer">
                  Percepción IIBB y LH
                </Label>
                <div className="flex items-center gap-1">
                  <Input
                    type="text"
                    inputMode="decimal"
                    disabled={!includeIibbLh}
                    value={iibbLhInput}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const raw = e.target.value.replace(",", ".")
                      if (raw === "" || /^\d*\.?\d*$/.test(raw)) {
                        setIibbLhInput(raw)
                        const parsed = parseFloat(raw)
                        setIibbLhPct(Number.isNaN(parsed) ? 0 : parsed)
                      }
                    }}
                    onBlur={() => {
                      const parsed = parseFloat(iibbLhInput)
                      const next = Number.isNaN(parsed) || parsed < 0 ? 0 : parsed
                      setIibbLhPct(next)
                      setIibbLhInput(String(next))
                    }}
                    className="w-20 h-8 text-sm"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
              
            </div>
            <div className="text-right space-y-1">
              <div className="flex justify-end gap-4 text-sm">
                <span className="text-muted-foreground">Subtotal (sin impuestos)</span>
                <span className="tabular-nums font-medium">
                  {formatCurrencyPair(subtotal, currency, exchangeRate).primary}
                </span>
              </div>
              {currency === 'USD' && (
                <div className="flex justify-end gap-4 text-[10px] sm:text-xs  text-muted-foreground">
                  <span className="tabular-nums">
                    {formatCurrencyPair(subtotal, currency, exchangeRate).secondary}
                  </span>
                </div>
              )}
              {taxBreakdown.entries.map((entry) => (
                <div key={entry.pct} className="flex justify-end gap-4 text-sm">
                  <span className="text-muted-foreground">IVA ({entry.pct}%)</span>
                  <span className="tabular-nums font-medium">
                    {formatCurrencyPair(entry.amount, currency, exchangeRate).primary}
                  </span>
                </div>
              ))}
              {taxBreakdown.entries.length > 0 && currency === 'USD' && (
                <div className="flex justify-end gap-4 text-[10px] sm:text-xs text-muted-foreground">
                  <span className="tabular-nums">
                    Total IVA: {formatCurrencyPair(taxAmount, currency, exchangeRate).secondary}
                  </span>
                </div>
              )}
              {effectiveIibbLhPct > 0 && (
                <>
                  <div className="flex justify-end gap-4 text-sm">
                    <span className="text-muted-foreground">Percepción IIBB y LH ({effectiveIibbLhPct}%)</span>
                    <span className="tabular-nums font-medium">
                      {formatCurrencyPair(iibbLhAmount, currency, exchangeRate).primary}
                    </span>
                  </div>
                  {currency === 'USD' && (
                    <div className="flex justify-end gap-4 text-[10px] sm:text-xs text-muted-foreground">
                      <span className="tabular-nums">
                        {formatCurrencyPair(iibbLhAmount, currency, exchangeRate).secondary}
                      </span>
                    </div>
                  )}
                </>
              )}
              <div className="flex justify-end gap-4 pt-2 border-t">
                <span className="text-muted-foreground text-sm">Total</span>
                <div className="flex flex-col items-end">
                  <p className="tabular-nums text-xl font-bold">
                    {formatCurrencyPair(total, currency, exchangeRate).primary}
                  </p>
                  {currency === 'USD' && formatCurrencyPair(total, currency, exchangeRate).secondary && (
                    <p className="text-[10px] sm:text-xs text-muted-foreground tabular-nums">
                      {formatCurrencyPair(total, currency, exchangeRate).secondary}
                    </p>
                  )}
                </div>
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

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cambiar pedido de materiales</AlertDialogTitle>
            <AlertDialogDescription>
              Al cambiar el pedido asociado se reemplazarán los ítems actuales de la orden por los del nuevo pedido. Los cambios manuales que hayas hecho se perderán.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelRequestChange}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRequestChange}>Continuar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  )
}
