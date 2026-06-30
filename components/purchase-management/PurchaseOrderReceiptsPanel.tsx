"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { usePurchaseOrders } from "@/hooks/use-purchase-orders"
import { Badge } from "@/components/ui/badge"
import { Package, Plus, Trash2, Loader2, ExternalLink, FileText } from "lucide-react"

interface PurchaseOrderReceiptsPanelProps {
  orderId: string
  items: Array<{
    id: string
    material_id?: string
    material?: {
      id: string
      code: string
      name: string
      unit: string
    } | null
    description: string
    quantity: number
    unit: string
  }>
  receipts: Array<any>
}

export function PurchaseOrderReceiptsPanel({ orderId, items, receipts }: PurchaseOrderReceiptsPanelProps) {
  const { toast } = useToast()
  const { createReceipt, deleteReceipt } = usePurchaseOrders()

  const [formOpen, setFormOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [receiptNumber, setReceiptNumber] = useState("")
  const [remitoNumber, setRemitoNumber] = useState("")
  const [remitoFileUrl, setRemitoFileUrl] = useState("")
  const [remitoFileName, setRemitoFileName] = useState("")
  const [notes, setNotes] = useState("")
  const [quantities, setQuantities] = useState<Record<string, string>>({})

  const orderedByItem = items.reduce((acc, item) => {
    acc[item.id] = item.quantity
    return acc
  }, {} as Record<string, number>)

  const receivedByItem = receipts.reduce((acc, receipt) => {
    for (const ri of receipt.items || []) {
      acc[ri.purchase_order_item_id] = (acc[ri.purchase_order_item_id] || 0) + (ri.quantity_received || 0)
    }
    return acc
  }, {} as Record<string, number>)

  const handleQuantityChange = (itemId: string, value: string) => {
    setQuantities((prev) => ({ ...prev, [itemId]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const receiptItems = items
      .map((item) => {
        const raw = quantities[item.id]
        if (!raw || raw.trim() === "") return null
        const qty = parseFloat(raw.replace(",", "."))
        if (isNaN(qty) || qty <= 0) return null
        return {
          purchase_order_item_id: item.id,
          material_id: item.material_id,
          description: item.description,
          quantity_received: qty,
        }
      })
      .filter(Boolean) as Array<{
      purchase_order_item_id: string
      material_id?: string
      description: string
      quantity_received: number
    }>

    if (receiptItems.length === 0) {
      toast({ title: "Error", description: "Ingrese al menos una cantidad recibida", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      await createReceipt(orderId, {
        receipt_number: receiptNumber || undefined,
        remito_number: remitoNumber || undefined,
        remito_file_url: remitoFileUrl || undefined,
        remito_file_name: remitoFileName || undefined,
        notes: notes || undefined,
        items: receiptItems,
      })

      toast({ title: "Recepción registrada", description: "El stock fue actualizado correctamente." })
      setFormOpen(false)
      resetForm()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al registrar recepción",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setReceiptNumber("")
    setRemitoNumber("")
    setRemitoFileUrl("")
    setRemitoFileName("")
    setNotes("")
    setQuantities({})
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== "application/pdf") {
      toast({ title: "Error", description: "Solo se permiten archivos PDF", variant: "destructive" })
      return
    }

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Error al subir archivo")

      const data = await response.json()
      setRemitoFileUrl(data.url)
      setRemitoFileName(file.name)
      toast({ title: "Archivo subido", description: `${file.name} fue subido exitosamente.` })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al subir archivo",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (receiptId: string) => {
    try {
      await deleteReceipt(orderId, receiptId)
      toast({ title: "Recepción eliminada", description: "El stock fue ajustado correctamente." })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar recepción",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="p-6 sm:p-8">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-base flex items-center gap-2">
          <Package className="h-4 w-4" />
          Recepciones y remitos
        </CardTitle>
        <Button size="sm" variant="outline" onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Registrar recepción
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progreso por ítem */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ítem</TableHead>
                <TableHead className="text-right">Pedido</TableHead>
                <TableHead className="text-right">Recibido</TableHead>
                <TableHead className="text-right">Pendiente</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const ordered = orderedByItem[item.id] || 0
                const received = receivedByItem[item.id] || 0
                const pending = Math.max(0, ordered - received)
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium">{item.description}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        {item.material ? `${item.material.code} - ${item.material.name}` : "Manual"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">{ordered}</TableCell>
                    <TableCell className="text-right font-mono">
                      <Badge variant={received >= ordered ? "default" : "outline"} className="font-mono">
                        {received}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{pending}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {/* Historial de recepciones */}
        {receipts.length === 0 ? (
          <div className="text-center text-muted-foreground py-6">
            No hay recepciones registradas.
          </div>
        ) : (
          <div className="space-y-3">
            {receipts.map((receipt) => (
              <div key={receipt.id} className="rounded-md border p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">
                      {receipt.receipt_number || "Recepción sin número"}
                    </span>
                    {receipt.remito_number && (
                      <Badge variant="outline" className="text-xs">
                        Remito: {receipt.remito_number}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {receipt.remito_file_url && (
                      <a
                        href={receipt.remito_file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        <FileText className="h-4 w-4" />
                      </a>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => handleDelete(receipt.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mb-2">
                  {new Date(receipt.received_at).toLocaleString("es-AR")}
                  {receipt.notes && ` · ${receipt.notes}`}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {receipt.items.map((ri: any) => (
                    <div key={ri.id} className="bg-muted rounded px-2 py-1 text-xs">
                      <span className="font-medium">{ri.description}</span>
                      <span className="ml-2 font-mono">+{ri.quantity_received}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Form dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Registrar recepción</DialogTitle>
              <DialogDescription>
                Ingrese las cantidades recibidas. El stock se actualizará automáticamente.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="receipt_number" className="mb-2">Número de recepción</Label>
                  <Input
                    id="receipt_number"
                    value={receiptNumber}
                    onChange={(e) => setReceiptNumber(e.target.value)}
                    placeholder="Ej: RCP-001"
                  />
                </div>
                <div>
                  <Label htmlFor="remito_number" className="mb-2">Número de remito</Label>
                  <Input
                    id="remito_number"
                    value={remitoNumber}
                    onChange={(e) => setRemitoNumber(e.target.value)}
                    placeholder="Ej: 0001-00012345"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="remito_file" className="mb-2">Adjuntar remito (PDF)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="remito_file"
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="flex-1"
                  />
                  {remitoFileUrl && (
                    <a
                      href={remitoFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
                {remitoFileName && (
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">{remitoFileName}</p>
                )}
              </div>

              <div>
                <Label className="mb-2">Cantidades recibidas por ítem</Label>
                <div className="rounded-md border mt-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ítem</TableHead>
                        <TableHead className="text-right">Pedido</TableHead>
                        <TableHead className="text-right">Pendiente</TableHead>
                        <TableHead className="w-[140px] text-right">Recibir</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => {
                        const ordered = orderedByItem[item.id] || 0
                        const received = receivedByItem[item.id] || 0
                        const pending = Math.max(0, ordered - received)
                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="font-medium text-sm">{item.description}</div>
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">{ordered}</TableCell>
                            <TableCell className="text-right font-mono text-sm">{pending}</TableCell>
                            <TableCell>
                              <Input
                                type="text"
                                inputMode="decimal"
                                value={quantities[item.id] || ""}
                                onChange={(e) => {
                                  const val = e.target.value.replace(",", ".")
                                  if (val === "" || /^\d*\.?\d*$/.test(val)) {
                                    handleQuantityChange(item.id, val)
                                  }
                                }}
                                placeholder="0"
                                className="w-[100px] ml-auto text-right"
                              />
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div>
                <Label htmlFor="receipt_notes" className="mb-2">Notas</Label>
                <Textarea
                  id="receipt_notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observaciones de la recepción..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Package className="h-4 w-4 mr-2" />
                )}
                Registrar recepción
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
