"use client"

import { useState, useRef } from "react"
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { useToast } from "@/hooks/use-toast"
import { useSupplierQuotes } from "@/hooks/use-supplier-quotes"
import { useSuppliers } from "@/hooks/use-suppliers"
import { SupplierSelect } from "@/components/purchase-orders/SupplierSelect"
import { FileText, Plus, Trash2, ExternalLink, Loader2, FileUp, CalendarIcon, Upload, X } from "lucide-react"

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

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  sent: "Enviado",
  received: "Recibido",
  approved: "Aprobado",
  rejected: "Rechazado",
}

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
  const [quoteDateOpen, setQuoteDateOpen] = useState(false)
  const [validUntilOpen, setValidUntilOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const formatDateLabel = (dateString: string) => {
    if (!dateString) return null
    return new Date(dateString + "T00:00:00").toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  const uploadFile = async (file: File) => {
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await uploadFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) await uploadFile(file)
  }

  const clearFile = () => {
    setFormFileUrl("")
    setFormFileName("")
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
        <Button size="sm" variant="outline" className="cursor-pointer" onClick={openCreate}>
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
                  <TableRow
                    key={quote.id}
                    className="cursor-pointer"
                    onClick={() => openEdit(quote)}
                  >
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
                        {STATUS_LABELS[quote.status] || quote.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {quote.file_url ? (
                        <a
                          href={quote.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FileText className="h-4 w-4" />
                          {quote.file_name || "Ver PDF"}
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openEdit(quote)
                                }}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Editar presupuesto</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setDeleteId(quote.id)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Eliminar presupuesto</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TooltipProvider>
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
        <DialogContent className="max-w-lg max-sm:h-screen max-sm:max-h-screen overflow-y-auto rounded-none sm:rounded-lg">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {formMode === "create" ? "Agregar Presupuesto" : "Editar Presupuesto"}
              </DialogTitle>
              <DialogDescription>
                Registre el presupuesto del proveedor. Puede adjuntar el archivo PDF.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-4">
              <div className="space-y-2">
                <Label htmlFor="supplier">Proveedor *</Label>
                <SupplierSelect
                  value={formSupplierId}
                  onChange={setFormSupplierId}
                  placeholder="Seleccionar proveedor"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
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
                <div className="space-y-2 w-full">
                  <Label htmlFor="status">Estado</Label>
                  <Select value={formStatus} onValueChange={setFormStatus}>
                    <SelectTrigger id="status" className="w-full">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha de presupuesto</Label>
                  <Popover open={quoteDateOpen} onOpenChange={setQuoteDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formatDateLabel(formQuoteDate) || "Seleccionar fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        captionLayout="dropdown-years"
                        startMonth={new Date(new Date().getFullYear() - 5, 0, 1)}
                        endMonth={new Date(new Date().getFullYear() + 10, 11, 31)}
                        selected={formQuoteDate ? new Date(formQuoteDate + "T00:00:00") : undefined}
                        onSelect={(date) => {
                          if (date) {
                            setFormQuoteDate(date.toISOString().split("T")[0])
                            setQuoteDateOpen(false)
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Válido hasta</Label>
                  <Popover open={validUntilOpen} onOpenChange={setValidUntilOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formatDateLabel(formValidUntil) || "Seleccionar fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        captionLayout="dropdown-years"
                        startMonth={new Date(new Date().getFullYear() - 5, 0, 1)}
                        endMonth={new Date(new Date().getFullYear() + 10, 11, 31)}
                        selected={formValidUntil ? new Date(formValidUntil + "T00:00:00") : undefined}
                        onSelect={(date) => {
                          if (date) {
                            setFormValidUntil(date.toISOString().split("T")[0])
                            setValidUntilOpen(false)
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Adjunto PDF</Label>
                {!formFileUrl ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                      border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer
                      ${isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/30"}
                    `}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-3 rounded-full bg-primary/10 text-primary">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Arrastrá un PDF o hacé clic para seleccionar</p>
                        <p className="text-xs text-muted-foreground mt-1">Solo archivos PDF · Máximo 10MB</p>
                      </div>
                      <Button type="button" variant="outline" size="sm" className="mt-2 gap-1 cursor-pointer">
                        <Plus className="w-3 h-3" />
                        Seleccionar archivo
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3 p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-full bg-primary/10 text-primary shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{formFileName || "Archivo adjunto"}</p>
                        <a
                          href={formFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          Ver PDF
                        </a>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 cursor-pointer"
                      onClick={clearFile}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
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
              <Button type="button" variant="outline" className="cursor-pointer max-sm:order-1" onClick={() => setFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
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
