"use client"

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search } from 'lucide-react'

interface UserFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  roleFilter: string
  onRoleFilterChange: (value: string) => void
}

export function UserFilters({ 
  searchTerm, 
  onSearchChange, 
  roleFilter, 
  onRoleFilterChange 
}: UserFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mt-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={roleFilter} onValueChange={onRoleFilterChange}>
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Filtrar por rol" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los roles</SelectItem>
          <SelectItem value="admin">Administradores</SelectItem>
          <SelectItem value="supervisor">Supervisores</SelectItem>
          <SelectItem value="operario">Operarios</SelectItem>
          <SelectItem value="subcontratista">Subcontratistas</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
