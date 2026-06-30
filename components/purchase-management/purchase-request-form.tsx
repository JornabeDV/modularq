"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DialogForm } from "@/components/ui/dialog-form"
import { PurchaseRequestItemsTable, PurchaseRequestItemInput } from "./PurchaseRequestItemsTable"

const STATUS_OPTIONS = [
  { value: "draft", label: "Borrador" },
  { value: "pending", label: "Pendiente" },
  { value: "quoted", label: "Cotizado" },
  { value: "approved", label: "Aprobado" },
  { value: "rejected", label: "Rechazado" },
  { value: "cancelled", label: "Cancelado" },
]

interface PurchaseRequestFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    status: string
    notes?: string
    items: PurchaseRequestItemInput[]
  }) => void
  isEditing: boolean
  initialData?: any | null
  isLoading?: boolean
}

export function PurchaseRequestForm({
  isOpen,
  onClose,
  onSubmit,
  isEditing,
  initialData,
  isLoading = false,
}: PurchaseRequestFormProps) {
  const [status, setStatus] = useState("draft")
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState<PurchaseRequestItemInput[]>([])

  useEffect(() => {
    if (isEditing && initialData) {
      setStatus(initialData.status || "draft")
      setNotes(initialData.notes || "")
      setItems(
        initialData.items?.map((item: any) => ({
          id: item.id,
          material_id: item.material_id || undefined,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
        })) || []
      )
    } else {
      setStatus("draft")
      setNotes("")
      setItems([])
    }
  }, [isEditing, initialData?.id])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      status,
      notes: notes || undefined,
      items: items.map((item) => ({
        id: item.id,
        material_id: item.material_id,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
      })),
    })
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isLoading) {
          onClose()
        }
      }}
    >
      <DialogForm onSubmit={handleSubmit} className="max-sm:w-[100dvw] w-[95vw] !max-w-6xl max-sm:!max-w-none max-h-[700px] max-sm:h-[100dvh] overflow-y-auto max-sm:overflow-hidden rounded-none md:rounded-lg">
        <DialogHeader className="shrink-0">
          <DialogTitle>
            {isEditing ? "Editar Pedido de Materiales" : "Crear Nuevo Pedido"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-sm:flex-1 max-sm:overflow-y-auto min-w-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status" className="mb-2">Estado</Label>
              <Select value={status} onValueChange={setStatus}>
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
            <div>
              <Label htmlFor="notes" className="mb-2">Notas</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas del pedido..."
                rows={3}
              />
            </div>
          </div>

          <div>
            <Label className="mb-2">Ítems del pedido</Label>
            <PurchaseRequestItemsTable items={items} onChange={setItems} />
          </div>
        </div>

        <div className="flex max-sm:flex-col max-sm:gap-2 justify-end sm:space-x-2 pt-4 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="cursor-pointer max-sm:w-full"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="cursor-pointer"
          >
            {isLoading
              ? "Guardando..."
              : isEditing
                ? "Actualizar Pedido"
                : "Crear Pedido"}
          </Button>
        </div>
      </DialogForm>
    </Dialog>
  )
}
