"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ProjectRow } from './project-row'
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
}

export function ProjectTable({
  projects,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onEditProject,
  onDeleteProject
}: ProjectTableProps) {
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
                <TableHead className="min-w-[200px]">Proyecto</TableHead>
                <TableHead className="text-center min-w-[120px]">Estado</TableHead>
                <TableHead className="text-center min-w-[100px]">Tareas</TableHead>
                <TableHead className="text-center min-w-[100px]">Operarios</TableHead>
                <TableHead className="text-center min-w-[120px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">
                    No se encontraron proyectos
                  </td>
                </tr>
              ) : (
                projects.map((project) => (
                  <ProjectRow
                    key={project.id}
                    project={project}
                    onEdit={onEditProject}
                    onDelete={onDeleteProject}
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