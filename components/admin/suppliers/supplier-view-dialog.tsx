"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import type { Supplier } from "@/hooks/use-suppliers"

interface SupplierViewDialogProps {
  isOpen: boolean
  onClose: () => void
  supplier: Supplier | null
}

export function SupplierViewDialog({
  isOpen,
  onClose,
  supplier,
}: SupplierViewDialogProps) {
  if (!supplier) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full h-full max-w-full max-h-full md:w-[90vw] md:h-auto md:max-w-4xl md:max-h-[85vh] md:rounded-lg rounded-none m-0 md:m-4 overflow-y-auto top-0 left-0 translate-x-0 translate-y-0 md:top-[50%] md:left-[50%] md:translate-x-[-50%] md:translate-y-[-50%]">
        <DialogHeader>
          <DialogTitle>Información del Proveedor</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">{supplier.name}</h3>
            <Badge variant={supplier.is_active ? "default" : "secondary"}>
              {supplier.is_active ? "Activo" : "Inactivo"}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-semibold text-muted-foreground">
                Contacto
              </Label>
              <p className="mt-1 text-base">{supplier.contact_name || "—"}</p>
            </div>
            <div>
              <Label className="text-sm font-semibold text-muted-foreground">
                CUIT
              </Label>
              <p className="mt-1 text-base">{supplier.cuit || "—"}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-semibold text-muted-foreground">
                Email
              </Label>
              <p className="mt-1 text-base">{supplier.email || "—"}</p>
            </div>
            <div>
              <Label className="text-sm font-semibold text-muted-foreground">
                Teléfono
              </Label>
              <p className="mt-1 text-base">{supplier.phone || "—"}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-semibold text-muted-foreground">
                Dirección
              </Label>
              <p className="mt-1 text-base">{supplier.address || "—"}</p>
            </div>
          </div>

          {supplier.notes && (
            <div className="space-y-2 border-t pt-4">
              <Label className="text-sm font-semibold text-muted-foreground">
                Notas
              </Label>
              <p className="mt-1 text-base">{supplier.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
