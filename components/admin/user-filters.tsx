"use client"

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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
    <div className="flex flex-col sm:flex-row gap-4 mt-4">
      <div className="flex-1">
        <Input
          placeholder="Buscar por nombre..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full sm:max-w-sm"
        />
      </div>
      <Select value={roleFilter} onValueChange={onRoleFilterChange}>
        <SelectTrigger className="w-full sm:w-48">
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