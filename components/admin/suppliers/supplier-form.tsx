"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { DialogForm } from "@/components/ui/dialog-form"
import type { Supplier } from "@/hooks/use-suppliers"

interface SupplierFormData {
  name: string
  contact_name: string
  email: string
  phone: string
  address: string
  cuit: string
  notes: string
  is_active: boolean
}

interface SupplierFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: SupplierFormData) => void
  isEditing: boolean
  initialData?: Supplier | null
  isLoading?: boolean
  error?: string | null
}

export function SupplierForm({
  isOpen,
  onClose,
  onSubmit,
  isEditing,
  initialData,
  isLoading = false,
  error,
}: SupplierFormProps) {
  const [formData, setFormData] = useState<SupplierFormData>({
    name: "",
    contact_name: "",
    email: "",
    phone: "",
    address: "",
    cuit: "",
    notes: "",
    is_active: true,
  })
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setLocalError(error || null)
    }
  }, [isOpen, error])

  useEffect(() => {
    if (isEditing && initialData) {
      setFormData({
        name: initialData.name || "",
        contact_name: initialData.contact_name || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        address: initialData.address || "",
        cuit: initialData.cuit || "",
        notes: initialData.notes || "",
        is_active: initialData.is_active ?? true,
      })
    } else {
      setFormData({
        name: "",
        contact_name: "",
        email: "",
        phone: "",
        address: "",
        cuit: "",
        notes: "",
        is_active: true,
      })
    }
  }, [isEditing, initialData?.id, isOpen])

  const hasError = !!(localError || error)
  const dialogOpen = isOpen || hasError

  const handleInputChange = (field: keyof SupplierFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    if (!formData.name.trim()) {
      setLocalError("El nombre del proveedor es obligatorio")
      return
    }

    onSubmit({ ...formData })
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogForm
        onSubmit={handleSubmit}
        className="w-full h-full max-w-full max-h-full md:w-[90vw] md:h-auto md:max-w-4xl md:max-h-[85vh] md:rounded-lg rounded-none m-0 md:m-4 overflow-y-auto top-0 left-0 translate-x-0 translate-y-0 md:top-[50%] md:left-[50%] md:translate-x-[-50%] md:translate-y-[-50%]"
      >
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Proveedor" : "Nuevo Proveedor"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {(localError || error) && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
              {localError || error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Ej: Ferretería San Juan"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_name">Contacto</Label>
              <Input
                id="contact_name"
                value={formData.contact_name}
                onChange={(e) => handleInputChange("contact_name", e.target.value)}
                placeholder="Nombre del contacto"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="proveedor@email.com"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="+54 9 264 ..."
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cuit">CUIT</Label>
              <Input
                id="cuit"
                value={formData.cuit}
                onChange={(e) => handleInputChange("cuit", e.target.value)}
                placeholder="30-12345678-9"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Dirección del proveedor"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Input
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Notas adicionales"
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Checkbox
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                handleInputChange("is_active", checked === true)
              }
              disabled={isLoading}
            />
            <Label htmlFor="is_active" className="text-sm font-normal cursor-pointer">
              Proveedor activo
            </Label>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Guardando..." : isEditing ? "Guardar Cambios" : "Crear Proveedor"}
          </Button>
        </div>
      </DialogForm>
    </Dialog>
  )
}
