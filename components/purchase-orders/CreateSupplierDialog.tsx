"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import { useSuppliers } from "@/hooks/use-suppliers"
import { useToast } from "@/hooks/use-toast"

interface CreateSupplierDialogProps {
  onCreated?: (supplierId: string) => void
}

export function CreateSupplierDialog({ onCreated }: CreateSupplierDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { createSupplier } = useSuppliers()
  const { toast } = useToast()

  const [form, setForm] = useState({
    name: "",
    contact_name: "",
    email: "",
    phone: "",
    address: "",
    cuit: "",
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre del proveedor es obligatorio",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const supplier = await createSupplier(form)
      toast({
        title: "Proveedor creado",
        description: `${supplier.name} fue creado exitosamente.`,
      })
      setOpen(false)
      setForm({
        name: "",
        contact_name: "",
        email: "",
        phone: "",
        address: "",
        cuit: "",
        notes: "",
      })
      onCreated?.(supplier.id)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear proveedor",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="cursor-pointer">
          <Plus className="h-4 w-4 mr-1" /> Nuevo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-sm:w-[100dvw] max-sm:h-[100dvh] max-sm:!max-w-none max-sm:rounded-none max-sm:overflow-hidden max-sm:flex max-sm:flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col max-sm:h-full">
          <DialogHeader className="shrink-0">
            <DialogTitle>Nuevo Proveedor</DialogTitle>
            <DialogDescription>
              Complete los datos del proveedor. Solo el nombre es obligatorio.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 max-sm:flex-1 max-sm:overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Ferretería San Juan"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_name">Contacto</Label>
                <Input
                  id="contact_name"
                  value={form.contact_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, contact_name: e.target.value }))}
                  placeholder="Nombre del contacto"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="proveedor@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="+54 9 264 ..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cuit">CUIT</Label>
                <Input
                  id="cuit"
                  value={form.cuit}
                  onChange={(e) => setForm((prev) => ({ ...prev, cuit: e.target.value }))}
                  placeholder="30-12345678-9"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="Dirección del proveedor"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Input
                id="notes"
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Notas adicionales"
              />
            </div>
          </div>

          <DialogFooter className="shrink-0 flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="max-sm:w-full"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="max-sm:w-full"
            >
              {isSubmitting ? "Creando..." : "Crear Proveedor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
