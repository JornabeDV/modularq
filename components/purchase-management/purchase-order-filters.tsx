"use client"

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search } from 'lucide-react'

interface PurchaseOrderFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  supplierFilter: string
  onSupplierFilterChange: (value: string) => void
  suppliers: any[]
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'draft', label: 'Borrador' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'approved', label: 'Aprobada' },
  { value: 'partial_received', label: 'Recibida parcial' },
  { value: 'received', label: 'Recibida' },
  { value: 'cancelled', label: 'Cancelada' },
]

export function PurchaseOrderFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  supplierFilter,
  onSupplierFilterChange,
  suppliers,
}: PurchaseOrderFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por número, proveedor o pedido..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
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
      <Select value={supplierFilter} onValueChange={onSupplierFilterChange}>
        <SelectTrigger className="w-full sm:w-[220px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los proveedores</SelectItem>
          {suppliers.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
