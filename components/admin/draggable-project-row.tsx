"use client"

import Link from 'next/link'
import { useState } from 'react'
import { TableCell, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Eye, GripVertical } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { DeleteProjectButton } from './delete-project-button'
import type { Project } from '@/lib/types'

interface DraggableProjectRowProps {
  project: Project
  index: number
  onEdit: (project: Project) => void
  onDelete: (projectId: string) => void
  isDragging?: boolean
  onDragStart?: (e: React.DragEvent, projectId: string) => void
  onDragEnd?: (e: React.DragEvent) => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent, projectId: string) => void
}

export function DraggableProjectRow({ 
  project, 
  index,
  onEdit, 
  onDelete,
  isDragging = false,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop
}: DraggableProjectRowProps) {
  const [isHovered, setIsHovered] = useState(false)

  const getStatusInfo = (status: string) => {
    const statusMap = {
      'planning': { label: 'Planificación', color: 'secondary' as const },
      'active': { label: 'Activo', color: 'default' as const },
      'paused': { label: 'En Pausa', color: 'destructive' as const },
      'completed': { label: 'Completado', color: 'default' as const },
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

  // Calcular progreso del proyecto basado en tareas completadas
  const calculateProgress = () => {
    const totalTasks = project.projectTasks.length
    if (totalTasks === 0) return 0
    
    const completedTasks = project.projectTasks.filter(task => task.status === 'completed').length
    return Math.round((completedTasks / totalTasks) * 100)
  }

  const progress = calculateProgress()

  return (
    <TooltipProvider>
    <TableRow 
      className={`transition-all duration-200 select-none ${
        isDragging 
          ? 'opacity-50 shadow-lg' 
          : isHovered 
            ? 'shadow-md' 
            : 'hover:shadow-sm'
      }`}
      draggable
      onDragStart={(e) => onDragStart?.(e, project.id)}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop?.(e, project.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
          <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
            {index}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div>
          <div className="font-medium">{project.name}</div>
          <div className="text-sm text-muted-foreground mt-1 hidden sm:block">
            {project.description.length > 80 
              ? `${project.description.substring(0, 80)}...` 
              : project.description
            }
          </div>
        </div>
      </TableCell>
      <TableCell className="text-center">
        <div className="text-sm">
          <div className="font-medium">
            {project.client?.companyName || 'Sin cliente'}
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
          <div className="font-medium">{formatDate(project.startDate)}</div>
        </div>
      </TableCell>
      <TableCell className="text-center">
        <div className="text-sm">
          <div className="font-medium">{formatDate(project.endDate)}</div>
        </div>
      </TableCell>
      <TableCell className="text-center">
        <div className="text-sm">
          <div className="font-medium">{progress}%</div>
        </div>
      </TableCell>
      <TableCell className="text-center">
        <div className="flex items-center justify-center space-x-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={`/admin/projects/${project.id}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ver detalles del proyecto</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="cursor-pointer"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Editar proyecto</p>
            </TooltipContent>
          </Tooltip>
          
          {project.status !== 'active' && (
            <DeleteProjectButton
              projectId={project.id}
              projectName={project.name}
              onDelete={onDelete}
            />
          )}
        </div>
      </TableCell>
    </TableRow>
    </TooltipProvider>
  )
}