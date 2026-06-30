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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useSupplierQuotes } from "@/hooks/use-supplier-quotes"
import { useSuppliers } from "@/hooks/use-suppliers"
import { SupplierSelect } from "@/components/purchase-orders/SupplierSelect"
import { FileText, Plus, Trash2, ExternalLink, Loader2, FileUp } from "lucide-react"

interface SupplierQuotesPanelProps {
  purchaseRequestId: string
}

const STATUS_OPTIONS = [
  { value: "draft", label: "Borrador" },
  { value: "sent", label: "Enviado" },
  { value: "received", label: "Recibido" },
  { value: "approved", label: "Aprobado" },
  { value: "rejected", label: "Rechazado" },
]

export function SupplierQuotesPanel({ purchaseRequestId }: SupplierQuotesPanelProps) {
  const { toast } = useToast()
  const { supplierQuotes, loading, createSupplierQuote, updateSupplierQuote, deleteSupplierQuote } =
    useSupplierQuotes(purchaseRequestId)
  const { suppliers } = useSuppliers()

  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<"create" | "edit">("create")
  const [formId, setFormId] = useState<string | null>(null)
  const [formSupplierId, setFormSupplierId] = useState("")
  const [formTotal, setFormTotal] = useState("")
  const [formQuoteDate, setFormQuoteDate] = useState("")
  const [formValidUntil, setFormValidUntil] = useState("")
  const [formStatus, setFormStatus] = useState("draft")
  const [formNotes, setFormNotes] = useState("")
  const [formFileUrl, setFormFileUrl] = useState("")
  const [formFileName, setFormFileName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const openCreate = () => {
    setFormMode("create")
    setFormId(null)
    setFormSupplierId("")
    setFormTotal("")
    setFormQuoteDate("")
    setFormValidUntil("")
    setFormStatus("draft")
    setFormNotes("")
    setFormFileUrl("")
    setFormFileName("")
    setFormOpen(true)
  }

  const openEdit = (quote: any) => {
    setFormMode("edit")
    setFormId(quote.id)
    setFormSupplierId(quote.supplier_id)
    setFormTotal(quote.total?.toString() || "")
    setFormQuoteDate(quote.quote_date ? quote.quote_date.split("T")[0] : "")
    setFormValidUntil(quote.valid_until ? quote.valid_until.split("T")[0] : "")
    setFormStatus(quote.status || "draft")
    setFormNotes(quote.notes || "")
    setFormFileUrl(quote.file_url || "")
    setFormFileName(quote.file_name || "")
    setFormOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formSupplierId) {
      toast({ title: "Error", description: "Seleccione un proveedor", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        supplier_id: formSupplierId,
        total: parseFloat(formTotal.replace(",", ".")) || 0,
        quote_date: formQuoteDate || undefined,
        valid_until: formValidUntil || undefined,
        status: formStatus,
        notes: formNotes || undefined,
        file_url: formFileUrl || undefined,
        file_name: formFileName || undefined,
      }

      if (formMode === "create") {
        await createSupplierQuote({
          purchase_request_id: purchaseRequestId,
          ...payload,
        })
        toast({ title: "Presupuesto agregado", description: "El presupuesto fue registrado exitosamente." })
      } else {
        await updateSupplierQuote(formId!, payload)
        toast({ title: "Presupuesto actualizado", description: "El presupuesto fue actualizado exitosamente." })
      }

      setFormOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al guardar presupuesto",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteSupplierQuote(deleteId)
      toast({ title: "Presupuesto eliminado", description: "El presupuesto fue eliminado exitosamente." })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar",
        variant: "destructive",
      })
    } finally {
      setDeleteId(null)
    }
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
      setFormFileUrl(data.url)
      setFormFileName(file.name)
      toast({ title: "Archivo subido", description: `${file.name} fue subido exitosamente.` })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al subir archivo",
        variant: "destructive",
      })
    }
  }

  const getSupplierName = (id: string) => {
    return suppliers.find((s) => s.id === id)?.name || "—"
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Presupuestos de proveedores
        </CardTitle>
        <Button size="sm" variant="outline" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> Agregar
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : supplierQuotes.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No hay presupuestos registrados para este pedido.
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Válido hasta</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Adjunto</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supplierQuotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell>{getSupplierName(quote.supplier_id)}</TableCell>
                    <TableCell className="font-mono">
                      ${quote.total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {quote.valid_until
                        ? new Date(quote.valid_until).toLocaleDateString("es-AR")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs capitalize bg-muted px-2 py-1 rounded">
                        {quote.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {quote.file_url ? (
                        <a
                          href={quote.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <FileText className="h-4 w-4" />
                          {quote.file_name || "Ver PDF"}
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(quote)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setDeleteId(quote.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Form dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {formMode === "create" ? "Agregar Presupuesto" : "Editar Presupuesto"}
              </DialogTitle>
              <DialogDescription>
                Registre el presupuesto del proveedor. Puede adjuntar el archivo PDF.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="supplier">Proveedor *</Label>
                <SupplierSelect
                  value={formSupplierId}
                  onChange={setFormSupplierId}
                  placeholder="Seleccionar proveedor"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="total">Total</Label>
                  <Input
                    id="total"
                    type="text"
                    inputMode="decimal"
                    value={formTotal}
                    onChange={(e) => setFormTotal(e.target.value.replace(",", "."))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="status">Estado</Label>
                  <Select value={formStatus} onValueChange={setFormStatus}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quote_date">Fecha de presupuesto</Label>
                  <Input
                    id="quote_date"
                    type="date"
                    value={formQuoteDate}
                    onChange={(e) => setFormQuoteDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="valid_until">Válido hasta</Label>
                  <Input
                    id="valid_until"
                    type="date"
                    value={formValidUntil}
                    onChange={(e) => setFormValidUntil(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="file">Adjunto PDF</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="file"
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="flex-1"
                  />
                  {formFileUrl && (
                    <a
                      href={formFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
                {formFileName && (
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">{formFileName}</p>
                )}
              </div>

              <div>
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Notas adicionales..."
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
                  <FileUp className="h-4 w-4 mr-2" />
                )}
                {formMode === "create" ? "Agregar Presupuesto" : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Eliminar presupuesto?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
