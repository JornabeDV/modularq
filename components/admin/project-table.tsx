"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DraggableProjectRow } from './draggable-project-row'
import { ProjectFilters } from './project-filters'
import type { Project } from '@/lib/types'

interface ProjectTableProps {
  projects: Project[]
  searchTerm: string
  onSearchChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  onEditProject: (project: Project) => void
  onDeleteProject: (projectId: string) => void
  onReorderProjects?: (projectOrders: { id: string; projectOrder: number }[]) => void
}

export function ProjectTable({
  projects,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onEditProject,
  onDeleteProject,
  onReorderProjects
}: ProjectTableProps) {
  const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null)
  const [dragOverProjectId, setDragOverProjectId] = useState<string | null>(null)
  const [localProjects, setLocalProjects] = useState(projects)

  // Sincronizar localProjects con projects cuando cambien
  React.useEffect(() => {
    setLocalProjects(projects)
  }, [projects])

  // Funciones de drag and drop
  const handleDragStart = (e: React.DragEvent, projectId: string) => {
    setDraggedProjectId(projectId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', projectId)
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedProjectId(null)
    setDragOverProjectId(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, targetProjectId: string) => {
    e.preventDefault()
    
    if (!draggedProjectId || draggedProjectId === targetProjectId) {
      setDragOverProjectId(null)
      return
    }

    // Encontrar las posiciones de los proyectos
    const draggedIndex = localProjects.findIndex(project => project.id === draggedProjectId)
    const targetIndex = localProjects.findIndex(project => project.id === targetProjectId)
    
    if (draggedIndex === -1 || targetIndex === -1) {
      setDragOverProjectId(null)
      return
    }

    // Crear nuevo array con los proyectos reordenados
    const newProjects = [...localProjects]
    const [draggedProject] = newProjects.splice(draggedIndex, 1)
    newProjects.splice(targetIndex, 0, draggedProject)

    // Actualizar el orden de los proyectos
    const projectOrders = newProjects.map((project, index) => ({
      id: project.id,
      projectOrder: index + 1
    }))

    // Actualización optimista: mostrar el nuevo orden inmediatamente
    setLocalProjects(newProjects.map((project, index) => ({
      ...project,
      projectOrder: index + 1
    })))

    try {
      // Actualizar en el backend (sin loading state)
      await onReorderProjects?.(projectOrders)
    } catch (error) {
      // Si falla, revertir al estado anterior
      setLocalProjects(projects)
      console.error('Error reordering projects:', error)
    }

    setDragOverProjectId(null)
  }

  return (
    <Card>
      <CardHeader>
        <ProjectFilters
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          statusFilter={statusFilter}
          onStatusFilterChange={onStatusFilterChange}
        />
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-background">
                <TableHead className="text-center min-w-[60px]">#</TableHead>
                <TableHead className="min-w-[200px]">Proyecto</TableHead>
                <TableHead className="text-center min-w-[120px]">Cliente</TableHead>
                <TableHead className="text-center min-w-[120px]">Estado</TableHead>
                <TableHead className="text-center min-w-[120px]">Fecha Inicio</TableHead>
                <TableHead className="text-center min-w-[120px]">Fecha Fin</TableHead>
                <TableHead className="text-center min-w-[120px]">Progreso</TableHead>
                <TableHead className="text-center min-w-[120px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-muted-foreground">
                    No se encontraron proyectos
                  </td>
                </tr>
              ) : (
                localProjects.map((project, index) => (
                  <DraggableProjectRow
                    key={project.id}
                    project={project}
                    index={index + 1}
                    onEdit={onEditProject}
                    onDelete={onDeleteProject}
                    isDragging={draggedProjectId === project.id}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}