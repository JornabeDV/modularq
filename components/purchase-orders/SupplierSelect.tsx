"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useSuppliers } from "@/hooks/use-suppliers"
import { Loader2 } from "lucide-react"

interface SupplierSelectProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function SupplierSelect({
  value,
  onChange,
  placeholder = "Seleccionar proveedor",
  disabled = false,
}: SupplierSelectProps) {
  const { suppliers, loading } = useSuppliers()

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || loading}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {loading ? (
          <div className="flex items-center justify-center py-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          suppliers.map((supplier) => (
            <SelectItem key={supplier.id} value={supplier.id}>
              {supplier.name}
              {supplier.contact_name && (
                <span className="text-xs text-muted-foreground ml-1">
                  ({supplier.contact_name})
                </span>
              )}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  )
}
