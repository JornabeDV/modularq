"use client"

import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

interface ClientFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
}

export function ClientFilters({ searchTerm, onSearchChange }: ClientFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mt-4">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por empresa, representante, CUIT o email..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 w-full sm:max-w-sm"
          />
        </div>
      </div>
    </div>
  )
}