"use client"

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search } from 'lucide-react'
import { type MaterialCategory } from '@/hooks/use-material-categories'

interface MaterialFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  categoryFilter?: string
  onCategoryFilterChange?: (value: string) => void
  lowStockOnly?: boolean
  onLowStockOnlyChange?: (value: boolean) => void
  categories?: MaterialCategory[]
}

export function MaterialFilters({
  searchTerm,
  onSearchChange,
  categoryFilter = 'all',
  onCategoryFilterChange,
  lowStockOnly = false,
  onLowStockOnlyChange,
  categories = []
}: MaterialFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por código, nombre, proveedor..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      {onCategoryFilterChange && (
        <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.slug}>
                <span className="flex items-center gap-2">
                  {cat.name}
                  {cat.deleted_at && (
                    <span className="text-[10px] text-muted-foreground">(inactiva)</span>
                  )}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {onLowStockOnlyChange && (
        <Select 
          value={lowStockOnly ? 'low' : 'all'} 
          onValueChange={(value) => onLowStockOnlyChange(value === 'low')}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="low">Stock Bajo</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
