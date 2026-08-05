"use client"

import { useState, useEffect } from "react"
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
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import { PurchaseRequestItemsTable, PurchaseRequestItemInput } from "./PurchaseRequestItemsTable"
import { useMaterialsPrisma } from "@/hooks/use-materials-prisma"
import { ArrowLeft, Save, Loader2 } from "lucide-react"

const STATUS_OPTIONS = [
  { value: "draft", label: "Borrador" },
  { value: "pending", label: "Pendiente" },
  { value: "quoted", label: "Cotizado" },
  { value: "approved", label: "Aprobado" },
  { value: "rejected", label: "Rechazado" },
  { value: "cancelled", label: "Cancelado" },
]

interface PurchaseRequestFormProps {
  onSubmit: (data: {
    status: string
    notes?: string
    items: PurchaseRequestItemInput[]
  }) => void
  onClose: () => void
  isEditing: boolean
  initialData?: any | null
  isLoading?: boolean
}

export function PurchaseRequestForm({
  onSubmit,
  onClose,
  isEditing,
  initialData,
  isLoading = false,
}: PurchaseRequestFormProps) {
  const [status, setStatus] = useState("draft")
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState<PurchaseRequestItemInput[]>([])
  const { materials, loading: materialsLoading, createMaterial } = useMaterialsPrisma()

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

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
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
    <form onSubmit={(e) => handleSubmit(e)} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start gap-3">
        <Button
          type="button"
          variant="outline"
          className="cursor-pointer"
          size="sm"
          onClick={onClose}
        >
          <ArrowLeft className="h-4 w-4" /> Volver
        </Button>
        <h1 className="text-xl sm:text-2xl font-bold">
          {isEditing ? `Editar Pedido ${initialData?.request_number || ""}` : "Nuevo Pedido de Materiales"}
        </h1>
      </div>

      {/* Estado y notas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Estado y notas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4 items-start">
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
        </CardContent>
      </Card>

      {/* Ítems */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ítems del pedido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <PurchaseRequestItemsTable
            items={items}
            onChange={setItems}
            materials={materials}
            materialsLoading={materialsLoading}
            createMaterial={createMaterial}
          />
        </CardContent>
      </Card>

      {/* Acciones */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-4 border-t">
        <Button type="button" disabled={isLoading} onClick={() => handleSubmit()} className="w-full sm:w-auto cursor-pointer">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <Save className="h-4 w-4 mr-1" />
          )}
          {isLoading
            ? "Guardando..."
            : isEditing
              ? "Guardar Cambios"
              : "Crear Pedido"}
        </Button>
      </div>
    </form>
  )
}
