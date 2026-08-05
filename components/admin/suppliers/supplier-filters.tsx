"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface SupplierFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
}

export function SupplierFilters({ searchTerm, onSearchChange }: SupplierFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1 mt-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, contacto, CUIT o email..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
    </div>
  )
}
