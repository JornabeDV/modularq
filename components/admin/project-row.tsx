"use client"

import Link from 'next/link'
import { TableCell, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Eye } from 'lucide-react'
import { DeleteProjectButton } from './delete-project-button'
import type { Project } from '@/lib/types'

interface ProjectRowProps {
  project: Project
  onEdit: (project: Project) => void
  onDelete: (projectId: string) => void
}

export function ProjectRow({ project, onEdit, onDelete }: ProjectRowProps) {
  const getStatusInfo = (status: string) => {
    const statusMap = {
      'planning': { label: 'Planificación', color: 'secondary' as const },
      'active': { label: 'Activo', color: 'default' as const },
      'on-hold': { label: 'En Pausa', color: 'destructive' as const },
      'completed': { label: 'Completado', color: 'success' as const },
      'cancelled': { label: 'Cancelado', color: 'destructive' as const }
    }
    return statusMap[status as keyof typeof statusMap] || { label: status, color: 'default' as const }
  }

  const handleEdit = () => {
    onEdit(project)
  }


  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Sin fecha'
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <TableRow>
      <TableCell>
        <div>
          <div className="font-medium">{project.name}</div>
          <div className="text-sm text-muted-foreground mt-1">
            {project.description.length > 80 
              ? `${project.description.substring(0, 80)}...` 
              : project.description
            }
          </div>
        </div>
      </TableCell>
      <TableCell className="text-center">
        <Badge variant={getStatusInfo(project.status).color}>
          {getStatusInfo(project.status).label}
        </Badge>
      </TableCell>
      <TableCell className="text-center">
        <div className="text-sm">
          <div className="font-medium">{project.projectTasks.length}</div>
          <div className="text-muted-foreground">tareas</div>
        </div>
      </TableCell>
      <TableCell className="text-center">
        <div className="flex items-center justify-center space-x-2">
          <Link href={`/admin/projects/${project.id}`}>
            <Button
              variant="outline"
              size="sm"
              title="Ver detalles del proyecto"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={handleEdit}
            title="Editar proyecto"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <DeleteProjectButton
            projectId={project.id}
            projectName={project.name}
            onDelete={onDelete}
          />
        </div>
      </TableCell>
    </TableRow>
  )
}