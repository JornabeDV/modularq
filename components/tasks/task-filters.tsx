"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, X } from "lucide-react"

interface TaskFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  priorityFilter: string
  onPriorityFilterChange: (value: string) => void
  assigneeFilter: string
  onAssigneeFilterChange: (value: string) => void
  onClearFilters: () => void
  activeFiltersCount: number
}

export function TaskFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  assigneeFilter,
  onAssigneeFilterChange,
  onClearFilters,
  activeFiltersCount,
}: TaskFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar tareas..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filtros:</span>
        </div>

        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="in_progress">En progreso</SelectItem>
            <SelectItem value="completed">Completada</SelectItem>
            <SelectItem value="cancelled">Cancelada</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={onPriorityFilterChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Prioridad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las prioridades</SelectItem>
            <SelectItem value="critical">Crítica</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="medium">Media</SelectItem>
            <SelectItem value="low">Baja</SelectItem>
          </SelectContent>
        </Select>

        <Select value={assigneeFilter} onValueChange={onAssigneeFilterChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Asignado a" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los operarios</SelectItem>
            <SelectItem value="1">María García</SelectItem>
            <SelectItem value="2">Carlos López</SelectItem>
            <SelectItem value="3">Ana Martínez</SelectItem>
          </SelectContent>
        </Select>

        {activeFiltersCount > 0 && (
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            <X className="h-4 w-4 mr-2" />
            Limpiar filtros
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount}
            </Badge>
          </Button>
        )}
      </div>
    </div>
  )
}
